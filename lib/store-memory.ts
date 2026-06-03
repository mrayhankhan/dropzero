import { randomUUID } from "node:crypto";
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

/**
 * In-memory store so the app runs with ZERO credentials (local dev + browser
 * preview). It mirrors the discrete-unit-row claim model of the DSQL store, so
 * the UI behaves identically. The moment DSQL_CLUSTER_ENDPOINT is set,
 * lib/store.ts switches to the real Aurora DSQL store. Not for production.
 */

type Unit = { unit_no: number; status: "available" | "claimed"; order_id: string | null };
type DropBase = Omit<Drop, "remaining">;
type MemState = {
  drops: Map<string, DropBase>;
  units: Map<string, Unit[]>;
  orders: Order[];
};

const g = globalThis as unknown as { __dropzeroMem?: MemState };
function state(): MemState {
  if (!g.__dropzeroMem) {
    g.__dropzeroMem = { drops: new Map(), units: new Map(), orders: [] };
    seedDemo(g.__dropzeroMem);
  }
  return g.__dropzeroMem;
}

function mint(s: MemState, dropId: string, total: number) {
  const units: Unit[] = [];
  for (let n = 1; n <= total; n++) units.push({ unit_no: n, status: "available", order_id: null });
  s.units.set(dropId, units);
}

function makeDrop(s: MemState, input: CreateDropInput): Drop {
  const id = randomUUID();
  const iso = new Date().toISOString();
  const base: DropBase = {
    id,
    name: input.name,
    description: input.description ?? null,
    image_url: input.imageUrl ?? null,
    total: input.total,
    price_cents: input.priceCents,
    status: input.status ?? "live",
    starts_at: input.startsAt ?? null,
    created_at: iso,
    updated_at: iso,
  };
  s.drops.set(id, base);
  mint(s, id, input.total);
  return { ...base, remaining: input.total };
}

function available(s: MemState, dropId: string): number {
  return (s.units.get(dropId) ?? []).filter((u) => u.status === "available").length;
}

function withRemaining(s: MemState, base: DropBase): Drop {
  return { ...base, remaining: available(s, base.id) };
}

function seedDemo(s: MemState) {
  const samples: CreateDropInput[] = [
    {
      name: "Aurora Live — Front Row (Tokyo)",
      description: "200 front-row seats. Global on-sale. Zero oversells.",
      total: 200,
      priceCents: 18900,
      status: "live",
    },
    {
      name: "Zero Stack Hoodie — Founder's Drop",
      description: "500 units worldwide. Limited founder edition.",
      total: 500,
      priceCents: 6400,
      status: "live",
    },
    {
      name: "H0 Keynote — VIP Pass",
      description: "50 VIP passes. They will sell out in seconds.",
      total: 50,
      priceCents: 24900,
      status: "live",
    },
  ];
  const created = samples.map((input) => makeDrop(s, input));

  // Seed recent activity so the live tape + feed are populated in preview mode.
  const regions = ["us-east-1", "eu-west-1", "ap-northeast-1", "us-west-2", "ap-south-1"];
  const perDrop = [16, 24, 7];
  created.forEach((drop, di) => {
    const units = s.units.get(drop.id) ?? [];
    const n = Math.min(perDrop[di] ?? 8, units.length);
    for (let i = 0; i < n; i++) {
      const u = units[i];
      if (u.status !== "available") continue;
      const orderId = randomUUID();
      u.status = "claimed";
      u.order_id = orderId;
      s.orders.push({
        id: orderId,
        drop_id: drop.id,
        buyer_email: `fan${Math.floor(1000 + Math.random() * 9000)}@dropzero.dev`,
        qty: 1,
        amount_cents: drop.price_cents,
        idempotency_key: orderId,
        region: regions[Math.floor(Math.random() * regions.length)],
        status: "confirmed",
        created_at: new Date(Date.now() - Math.floor(Math.random() * 600) * 1000).toISOString(),
      });
    }
  });
}

export function createMemoryStore(): Store {
  return {
    backend: "memory",
    region: "preview",

    async listDrops() {
      const s = state();
      return [...s.drops.values()]
        .map((b) => withRemaining(s, b))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },

    async getDrop(id) {
      const s = state();
      const base = s.drops.get(id);
      return base ? withRemaining(s, base) : null;
    },

    async createDrop(input) {
      return makeDrop(state(), input);
    },

    async setStatus(id, status: DropStatus) {
      const s = state();
      const base = s.drops.get(id);
      if (!base) return null;
      base.status = status;
      base.updated_at = new Date().toISOString();
      return withRemaining(s, base);
    },

    async recentOrders(dropId, limit = 30) {
      let orders = state().orders;
      if (dropId) orders = orders.filter((o) => o.drop_id === dropId);
      return orders
        .slice()
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit);
    },

    async stats(dropId) {
      const s = state();
      const base = s.drops.get(dropId);
      if (!base) return null;
      const orders = s.orders.filter((o) => o.drop_id === dropId);
      const unitsSold = orders.reduce((n, o) => n + o.qty, 0);
      const revenueCents = orders.reduce((n, o) => n + o.amount_cents, 0);
      const times = orders.map((o) => new Date(o.created_at).getTime()).sort((a, b) => a - b);
      const first = times[0] ?? null;
      const last = times[times.length - 1] ?? null;
      const spanMin = first && last ? Math.max(0.001, (last - first) / 60000) : 0;
      const soldOut = base.status === "sold_out" || unitsSold >= base.total;
      return {
        total: base.total,
        unitsSold,
        orders: orders.length,
        sellThroughPct: base.total > 0 ? Math.round((unitsSold / base.total) * 1000) / 10 : 0,
        revenueCents,
        velocityPerMin: spanMin > 0 ? Math.round((unitsSold / spanMin) * 10) / 10 : 0,
        firstSaleAt: first ? new Date(first).toISOString() : null,
        lastSaleAt: last ? new Date(last).toISOString() : null,
        timeToSelloutSec: soldOut && first && last ? Math.round((last - first) / 1000) : null,
      };
    },

    async integrity(dropId) {
      const s = state();
      const base = s.drops.get(dropId);
      if (!base) return null;
      const units = s.units.get(dropId) ?? [];
      const claimedUnits = units.filter((u) => u.status === "claimed").length;
      const orderUnitSum = s.orders
        .filter((o) => o.drop_id === dropId)
        .reduce((n, o) => n + o.qty, 0);
      return {
        total: base.total,
        claimedUnits,
        orderUnitSum,
        oversold: Math.max(0, claimedUnits - base.total),
        ok: claimedUnits === orderUnitSum && claimedUnits <= base.total,
      };
    },

    async reserve(input: ReserveInput): Promise<ReserveResult> {
      if (!Number.isInteger(input.qty) || input.qty <= 0) {
        throw new ReserveError("invalid_qty");
      }
      const s = state();

      const existing = s.orders.find((o) => o.idempotency_key === input.idempotencyKey);
      if (existing) {
        return {
          order: existing,
          remaining: available(s, existing.drop_id),
          deduped: true,
          retries: 0,
          unitNos: [],
        };
      }

      const base = s.drops.get(input.dropId);
      if (!base) throw new ReserveError("not_found");
      if (base.status !== "live") throw new ReserveError("not_live");

      const units = s.units.get(input.dropId) ?? [];
      const free = units.filter((u) => u.status === "available");
      if (free.length < input.qty) throw new ReserveError("sold_out");

      // claim qty distinct random units (single-threaded => naturally atomic)
      const orderId = randomUUID();
      const unitNos: number[] = [];
      for (let i = 0; i < input.qty; i++) {
        const idx = Math.floor(Math.random() * free.length);
        const [unit] = free.splice(idx, 1);
        unit.status = "claimed";
        unit.order_id = orderId;
        unitNos.push(unit.unit_no);
      }

      const order: Order = {
        id: orderId,
        drop_id: input.dropId,
        buyer_email: input.buyerEmail,
        qty: input.qty,
        amount_cents: base.price_cents * input.qty,
        idempotency_key: input.idempotencyKey,
        region: input.region ?? "preview",
        status: "confirmed",
        created_at: new Date().toISOString(),
      };
      s.orders.push(order);

      const remaining = available(s, input.dropId);
      if (remaining === 0) base.status = "sold_out";

      return { order, remaining, deduped: false, retries: 0, unitNos };
    },
  };
}
