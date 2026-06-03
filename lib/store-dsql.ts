import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool, tx, withRetry, primaryRegionLabel } from "./db";
import {
  ReserveError,
  type CreateDropInput,
  type Drop,
  type DropStatus,
  type Order,
  type ReserveInput,
  type ReserveResult,
  type Store,
} from "./types";

const MINT_BATCH = 500; // rows per insert — keeps well under DSQL's 10k rows/txn limit

function mapDrop(r: Record<string, unknown>): Drop {
  return {
    id: String(r.id),
    name: String(r.name),
    description: (r.description as string | null) ?? null,
    image_url: (r.image_url as string | null) ?? null,
    total: Number(r.total),
    remaining: Number(r.remaining ?? 0),
    price_cents: Number(r.price_cents),
    status: r.status as DropStatus,
    starts_at: r.starts_at ? new Date(r.starts_at as string).toISOString() : null,
    created_at: new Date(r.created_at as string).toISOString(),
    updated_at: new Date(r.updated_at as string).toISOString(),
  };
}

function mapOrder(r: Record<string, unknown>): Order {
  return {
    id: String(r.id),
    drop_id: String(r.drop_id),
    buyer_email: String(r.buyer_email),
    qty: Number(r.qty),
    amount_cents: Number(r.amount_cents),
    idempotency_key: String(r.idempotency_key),
    region: (r.region as string | null) ?? null,
    status: String(r.status),
    created_at: new Date(r.created_at as string).toISOString(),
  };
}

// Marks a synthetic OCC conflict so withRetry restarts the whole transaction.
function conflict(message: string): Error {
  const e = new Error(message) as Error & { code: string };
  e.code = "40001";
  return e;
}

async function countAvailable(client: PoolClient, dropId: string): Promise<number> {
  const { rows } = await client.query(
    `SELECT count(*)::int AS c FROM drop_units WHERE drop_id = $1 AND status = 'available'`,
    [dropId],
  );
  return Number(rows[0]?.c ?? 0);
}

/**
 * Claims ONE random available unit within the caller's transaction.
 * Picking a random starting unit_no spreads concurrent buyers across distinct
 * rows, so their commits don't collide — the essence of making OCC fast.
 * Returns the unit_no, or null if the drop is fully claimed.
 */
async function claimOneUnit(
  client: PoolClient,
  dropId: string,
  total: number,
  orderId: string,
): Promise<number | null> {
  const start = Math.floor(Math.random() * Math.max(1, total)) + 1;

  // Try to find an available unit at/after a random offset; wrap to the start
  // if the tail is exhausted.
  let pick = await client.query(
    `SELECT id FROM drop_units
       WHERE drop_id = $1 AND status = 'available' AND unit_no >= $2
       ORDER BY unit_no LIMIT 1`,
    [dropId, start],
  );
  if (pick.rowCount === 0) {
    pick = await client.query(
      `SELECT id FROM drop_units
         WHERE drop_id = $1 AND status = 'available'
         ORDER BY unit_no LIMIT 1`,
      [dropId],
    );
  }
  if (pick.rowCount === 0) return null; // genuinely sold out

  const unitId = pick.rows[0].id as string;
  const upd = await client.query(
    `UPDATE drop_units
        SET status = 'claimed', order_id = $2, claimed_at = now()
      WHERE id = $1 AND status = 'available'
      RETURNING unit_no`,
    [unitId, orderId],
  );
  // In OCC, a same-snapshot row should still be claimable; a 0 here means a
  // concurrent commit beat us — restart the transaction and pick again.
  if (upd.rowCount === 0) throw conflict("unit taken concurrently");
  return Number(upd.rows[0].unit_no);
}

export function createDsqlStore(): Store {
  const region = primaryRegionLabel();

  async function getDrop(id: string): Promise<Drop | null> {
    const { rows } = await pool().query(
      `SELECT d.*,
              (SELECT count(*)::int FROM drop_units u
                WHERE u.drop_id = d.id AND u.status = 'available') AS remaining
         FROM drops d WHERE d.id = $1`,
      [id],
    );
    return rows[0] ? mapDrop(rows[0]) : null;
  }

  async function mintUnits(dropId: string, total: number): Promise<void> {
    for (let start = 1; start <= total; start += MINT_BATCH) {
      const end = Math.min(total, start + MINT_BATCH - 1);
      const tuples: string[] = [];
      const params: unknown[] = [];
      let p = 1;
      for (let n = start; n <= end; n++) {
        tuples.push(`($${p++}, $${p++})`);
        params.push(dropId, n);
      }
      await pool().query(
        `INSERT INTO drop_units (drop_id, unit_no) VALUES ${tuples.join(", ")}`,
        params,
      );
    }
  }

  return {
    backend: "dsql",
    region,
    getDrop,

    async listDrops() {
      const { rows } = await pool().query(
        `SELECT d.*,
                (SELECT count(*)::int FROM drop_units u
                  WHERE u.drop_id = d.id AND u.status = 'available') AS remaining
           FROM drops d ORDER BY d.created_at DESC LIMIT 100`,
      );
      return rows.map(mapDrop);
    },

    async createDrop(input: CreateDropInput) {
      const { rows } = await pool().query(
        `INSERT INTO drops (name, description, image_url, total, price_cents, status, starts_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          input.name,
          input.description ?? null,
          input.imageUrl ?? null,
          input.total,
          input.priceCents,
          input.status ?? "live",
          input.startsAt ?? null,
        ],
      );
      const id = String(rows[0].id);
      await mintUnits(id, input.total);
      const drop = await getDrop(id);
      if (!drop) throw new Error("drop vanished after creation");
      return drop;
    },

    async setStatus(id, status) {
      const { rowCount } = await pool().query(
        `UPDATE drops SET status = $2, updated_at = now() WHERE id = $1`,
        [id, status],
      );
      if (rowCount === 0) return null;
      return getDrop(id);
    },

    async recentOrders(dropId, limit = 30) {
      const { rows } = dropId
        ? await pool().query(
            `SELECT * FROM orders WHERE drop_id = $1 ORDER BY created_at DESC LIMIT $2`,
            [dropId, limit],
          )
        : await pool().query(
            `SELECT * FROM orders ORDER BY created_at DESC LIMIT $1`,
            [limit],
          );
      return rows.map(mapOrder);
    },

    /**
     * Claims `qty` distinct random units in one strongly-consistent transaction:
     *   1. Idempotency — replay the same key => same order, never a double-buy.
     *   2. Claim qty distinct available units (each at most once, so 0 oversell).
     *   3. Record the order.
     * withRetry restarts the whole transaction on OCC conflicts (40001); because
     * each buyer targets random units, conflicts are rare and retries stay near 0.
     */
    async reserve(input: ReserveInput): Promise<ReserveResult> {
      if (!Number.isInteger(input.qty) || input.qty <= 0) {
        throw new ReserveError("invalid_qty");
      }

      let retries = 0;
      const result = await withRetry(
        () =>
          tx(async (client) => {
            const existing = await client.query(
              `SELECT * FROM orders WHERE idempotency_key = $1`,
              [input.idempotencyKey],
            );
            if (existing.rows[0]) {
              const order = mapOrder(existing.rows[0]);
              return {
                order,
                remaining: await countAvailable(client, order.drop_id),
                deduped: true,
                unitNos: [] as number[],
              };
            }

            const dropRow = await client.query(
              `SELECT total, price_cents, status FROM drops WHERE id = $1`,
              [input.dropId],
            );
            if (!dropRow.rows[0]) throw new ReserveError("not_found");
            if (dropRow.rows[0].status !== "live") throw new ReserveError("not_live");

            const total = Number(dropRow.rows[0].total);
            const priceCents = Number(dropRow.rows[0].price_cents);
            const orderId = randomUUID();
            const unitNos: number[] = [];

            for (let i = 0; i < input.qty; i++) {
              const unitNo = await claimOneUnit(client, input.dropId, total, orderId);
              if (unitNo === null) throw new ReserveError("sold_out");
              unitNos.push(unitNo);
            }

            const inserted = await client.query(
              `INSERT INTO orders (id, drop_id, buyer_email, qty, amount_cents, idempotency_key, region, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed')
               RETURNING *`,
              [
                orderId,
                input.dropId,
                input.buyerEmail,
                input.qty,
                priceCents * input.qty,
                input.idempotencyKey,
                input.region ?? region,
              ],
            );

            // If this drop just sold out, flip its status (best-effort, off the hot path).
            const remaining = await countAvailable(client, input.dropId);
            if (remaining === 0) {
              await client.query(
                `UPDATE drops SET status = 'sold_out', updated_at = now() WHERE id = $1 AND status = 'live'`,
                [input.dropId],
              );
            }

            return { order: mapOrder(inserted.rows[0]), remaining, deduped: false, unitNos };
          }),
        8,
        () => {
          retries += 1;
        },
      );

      return { ...result, retries };
    },
  };
}
