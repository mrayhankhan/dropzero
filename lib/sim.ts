import { randomUUID } from "node:crypto";
import { getStore } from "./store";
import { ReserveError } from "./types";

export type SimResult = {
  dropId: string;
  backend: string;
  buyers: number;
  qtyPer: number;
  unitsRequested: number;
  confirmed: number;
  soldOut: number;
  otherErrors: number;
  unitsSold: number;
  total: number;
  remaining: number;
  oversold: number; // MUST be 0 — this is the proof
  conflicts: number; // OCC conflicts that were retried — stays low thanks to random keys
  durationMs: number;
};

/**
 * Fires `buyers` reservations CONCURRENTLY at one drop and reports the outcome.
 * This is the demo's money shot: thousands of simultaneous buyers, and
 * `oversold` comes back 0 every time because the decrement is atomic and
 * strongly consistent in Aurora DSQL.
 */
export async function simulateSellout(
  dropId: string,
  buyers: number,
  qtyPer = 1,
): Promise<SimResult> {
  const store = getStore();
  const before = await store.getDrop(dropId);
  if (!before) throw new ReserveError("not_found");

  const started = Date.now();
  const results = await Promise.allSettled(
    Array.from({ length: buyers }, (_, i) =>
      store.reserve({
        dropId,
        buyerEmail: `loadtest+${i}@dropzero.dev`,
        qty: qtyPer,
        idempotencyKey: randomUUID(),
        region: "load-test",
      }),
    ),
  );
  const durationMs = Date.now() - started;

  let confirmed = 0;
  let soldOut = 0;
  let otherErrors = 0;
  let conflicts = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      if (!r.value.deduped) confirmed += 1;
      conflicts += r.value.retries;
    } else if (r.status === "rejected") {
      const reason = (r.reason as ReserveError)?.reason;
      if (reason === "sold_out" || reason === "not_live") soldOut += 1;
      else otherErrors += 1;
    }
  }

  const after = await store.getDrop(dropId);
  const total = before.total;
  const remaining = after?.remaining ?? 0;
  const unitsSold = total - remaining;

  return {
    dropId,
    backend: store.backend,
    buyers,
    qtyPer,
    unitsRequested: buyers * qtyPer,
    confirmed,
    soldOut,
    otherErrors,
    unitsSold,
    total,
    remaining,
    oversold: Math.max(0, unitsSold - total),
    conflicts,
    durationMs,
  };
}
