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
  for (const input of samples) makeDrop(s, input);
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
