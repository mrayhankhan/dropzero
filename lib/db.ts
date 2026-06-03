import { Pool, type PoolClient, type PoolConfig } from "pg";
import { DsqlSigner } from "@aws-sdk/dsql-signer";

/**
 * Aurora DSQL connection layer.
 *
 * DSQL is PostgreSQL wire-compatible but authenticates with short-lived IAM
 * tokens instead of static passwords. We mint a fresh token per *physical*
 * connection by passing pg an async `password` callback. On Vercel the
 * Marketplace OIDC integration supplies the AWS role with no stored keys; for
 * local dev the default AWS credential chain (env vars / SSO / profile) is used.
 */

export function isDsqlConfigured(): boolean {
  return Boolean(process.env.DSQL_CLUSTER_ENDPOINT);
}

export function primaryRegionLabel(): string {
  return (
    process.env.APP_REGION_LABEL ??
    process.env.AWS_REGION ??
    process.env.AWS_DEFAULT_REGION ??
    "us-east-1"
  );
}

function buildPool(): Pool {
  const endpoint = process.env.DSQL_CLUSTER_ENDPOINT;
  if (!endpoint) {
    throw new Error(
      "DSQL_CLUSTER_ENDPOINT is not set. Add it to .env.local (or run in preview mode).",
    );
  }
  const region =
    process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1";
  const user = process.env.DSQL_USER ?? "admin";
  const database = process.env.DSQL_DATABASE ?? "postgres";
  const signer = new DsqlSigner({ hostname: endpoint, region });

  const config: PoolConfig = {
    host: endpoint,
    port: 5432,
    user,
    database,
    // pg calls this for every new connection — DSQL tokens are short-lived,
    // so a long-running pool stays healthy by re-signing on connect.
    password: async () =>
      user === "admin"
        ? signer.getDbConnectAdminAuthToken()
        : signer.getDbConnectAuthToken(),
    ssl: { rejectUnauthorized: true },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };
  return new Pool(config);
}

// Reuse a single pool across hot reloads / lambda invocations.
const g = globalThis as unknown as { __dropzeroPool?: Pool };
export function pool(): Pool {
  if (!g.__dropzeroPool) g.__dropzeroPool = buildPool();
  return g.__dropzeroPool;
}

/** Run `fn` inside a transaction on a dedicated client. */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore rollback failures */
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * DSQL uses Optimistic Concurrency Control: when two transactions touch the
 * same row, one commits and the other fails with SQLSTATE 40001
 * (serialization_failure). The prescribed pattern is to retry the whole
 * transaction. This is the single most important DSQL-specific decision in the
 * app — it's what keeps the conditional inventory decrement correct under
 * thousands of concurrent buyers without ever locking or overselling.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 8,
  onRetry?: (attempt: number) => void,
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const isConflict = code === "40001" || code === "40P01"; // serialization / deadlock
      if (isConflict && attempt < maxRetries) {
        attempt += 1;
        onRetry?.(attempt);
        // jittered exponential backoff so retried transactions don't stampede
        const backoff = Math.min(15 * 2 ** attempt, 400) + Math.random() * 25;
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      throw err;
    }
  }
}
