import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool, isDsqlConfigured } from "../lib/db";

/**
 * Applies db/schema.sql to the configured Aurora DSQL cluster.
 *
 *   npm run db:init           # create tables + indexes
 *   npm run db:init -- --drop # drop existing tables first (DEV ONLY)
 *
 * On DSQL, `CREATE INDEX` must be `CREATE INDEX ASYNC`, so we transform the
 * portable schema before sending it. (CLAUDE.md says don't delete anything —
 * --drop is opt-in and only ever touches DropZero's own demo tables.)
 */

function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

function toDsql(stmt: string): string {
  // CREATE [UNIQUE] INDEX [IF NOT EXISTS] name  ->  CREATE [UNIQUE] INDEX ASYNC name
  if (/^create\s+(unique\s+)?index/i.test(stmt)) {
    return stmt
      .replace(/\bif\s+not\s+exists\s+/i, "")
      .replace(/\bindex\s+/i, "INDEX ASYNC ");
  }
  return stmt;
}

async function main() {
  if (!isDsqlConfigured()) {
    console.error(
      "DSQL_CLUSTER_ENDPOINT is not set. Set it in .env.local to initialize a real cluster.\n" +
        "(Without it, the app runs in in-memory preview mode and needs no schema.)",
    );
    process.exit(1);
  }

  const drop = process.argv.includes("--drop");
  const p = pool();

  if (drop) {
    console.log("Dropping existing DropZero tables…");
    await p.query("DROP TABLE IF EXISTS orders");
    await p.query("DROP TABLE IF EXISTS drops");
  }

  const sql = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  const statements = splitStatements(sql).map(toDsql);

  for (const stmt of statements) {
    const label = stmt.split("\n")[0].slice(0, 70);
    process.stdout.write(`→ ${label}…\n`);
    await p.query(stmt);
  }

  console.log(`\n✓ Schema applied (${statements.length} statements).`);
  await p.end();
}

main().catch((err) => {
  console.error("Schema init failed:", err);
  process.exit(1);
});
