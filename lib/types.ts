// Shared domain types for DropZero.

export type DropStatus = "scheduled" | "live" | "sold_out" | "ended";

export type Drop = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  total: number;
  remaining: number;
  price_cents: number;
  status: DropStatus;
  starts_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  drop_id: string;
  buyer_email: string;
  qty: number;
  amount_cents: number;
  idempotency_key: string;
  region: string | null;
  status: string;
  created_at: string;
};

export type CreateDropInput = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  total: number;
  priceCents: number;
  startsAt?: string | null;
  status?: DropStatus;
};

export type ReserveInput = {
  dropId: string;
  buyerEmail: string;
  qty: number;
  idempotencyKey: string;
  region?: string | null;
};

export type ReserveResult = {
  order: Order;
  remaining: number;
  deduped: boolean;
  retries: number; // OCC conflicts that were transparently retried (should be ~0)
  unitNos: number[]; // the specific units this buyer claimed
};

export type ReserveFailureReason =
  | "not_found"
  | "not_live"
  | "sold_out"
  | "invalid_qty";

export class ReserveError extends Error {
  reason: ReserveFailureReason;
  constructor(reason: ReserveFailureReason, message?: string) {
    super(message ?? reason);
    this.name = "ReserveError";
    this.reason = reason;
  }
}

// The Store interface is implemented twice: once against Aurora DSQL (the real,
// judged path) and once in-memory (so the UI runs with zero credentials).
export interface Store {
  backend: "dsql" | "memory";
  region: string;
  listDrops(): Promise<Drop[]>;
  getDrop(id: string): Promise<Drop | null>;
  createDrop(input: CreateDropInput): Promise<Drop>;
  reserve(input: ReserveInput): Promise<ReserveResult>;
  setStatus(id: string, status: DropStatus): Promise<Drop | null>;
  recentOrders(dropId?: string, limit?: number): Promise<Order[]>;
}
