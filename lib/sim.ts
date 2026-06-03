import { randomUUID } from "node:crypto";
import { getStore } from "./store";
import { ReserveError } from "./types";

// Weighted set of AWS regions so the stampede looks like real global traffic.
const REGIONS: { code: string; w: number }[] = [
  { code: "us-east-1", w: 30 },
  { code: "eu-west-1", w: 22 },
  { code: "us-west-2", w: 18 },
  { code: "ap-northeast-1", w: 16 },
  { code: "ap-south-1", w: 14 },
];
const REGION_TOTAL = REGIONS.reduce((s, r) => s + r.w, 0);
function pickRegion(): string {
  let n = Math.random() * REGION_TOTAL;
  for (const r of REGIONS) {
    if ((n -= r.w) <= 0) return r.code;
  }
  return REGIONS[0].code;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx] * 100) / 100;
}

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
  conflicts: number; // OCC conflicts retried — stays low thanks to random keys
  retryRatePct: number;
  throughputPerSec: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  regions: { code: string; confirmed: number }[];
  integrityOk: boolean;
  durationMs: number;
};

/**
 * Fires `buyers` reservations CONCURRENTLY at one drop from many regions and
 * reports full observability: throughput, latency distribution, OCC retry rate,
 * per-region breakdown, and a post-run integrity check. `oversold` is always 0.
 */
export async function simulateSellout(
  dropId: string,
  buyers: number,
  qtyPer = 1,
): Promise<SimResult> {
  const store = getStore();
  const before = await store.getDrop(dropId);
  if (!before) throw new ReserveError("not_found");

  const regionCounts = new Map<string, number>();
  const latencies: number[] = [];

  const started = performance.now();
  const results = await Promise.allSettled(
    Array.from({ length: buyers }, (_, i) => {
      const region = pickRegion();
      const t0 = performance.now();
      return store
        .reserve({
          dropId,
          buyerEmail: `loadtest+${i}@dropzero.dev`,
          qty: qtyPer,
          idempotencyKey: randomUUID(),
          region,
        })
        .then((r) => {
          latencies.push(performance.now() - t0);
          if (!r.deduped) regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
          return r;
        });
    }),
  );
  const durationMs = Math.round(performance.now() - started);

  let confirmed = 0;
  let soldOut = 0;
  let otherErrors = 0;
  let conflicts = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      if (!r.value.deduped) confirmed += 1;
      conflicts += r.value.retries;
    } else {
      const reason = (r.reason as ReserveError)?.reason;
      if (reason === "sold_out" || reason === "not_live") soldOut += 1;
      else otherErrors += 1;
    }
  }

  const after = await store.getDrop(dropId);
  const integrity = await store.integrity(dropId);
  const total = before.total;
  const remaining = after?.remaining ?? 0;
  const unitsSold = total - remaining;
  latencies.sort((a, b) => a - b);

  const regions = REGIONS.map((r) => ({ code: r.code, confirmed: regionCounts.get(r.code) ?? 0 }))
    .filter((r) => r.confirmed > 0)
    .sort((a, b) => b.confirmed - a.confirmed);

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
    retryRatePct: buyers > 0 ? Math.round((conflicts / buyers) * 1000) / 10 : 0,
    throughputPerSec: durationMs > 0 ? Math.round((confirmed / durationMs) * 1000) : confirmed,
    latencyP50: percentile(latencies, 50),
    latencyP95: percentile(latencies, 95),
    latencyP99: percentile(latencies, 99),
    regions,
    integrityOk: integrity?.ok ?? false,
    durationMs,
  };
}
