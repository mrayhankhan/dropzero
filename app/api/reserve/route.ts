import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getStore } from "@/lib/store";
import { ReserveError } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS: Record<string, number> = {
  not_found: 404,
  not_live: 409,
  sold_out: 409,
  invalid_qty: 400,
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.dropId !== "string") {
    return NextResponse.json({ error: "dropId is required" }, { status: 400 });
  }

  const store = getStore();
  try {
    const result = await store.reserve({
      dropId: body.dropId,
      buyerEmail: typeof body.buyerEmail === "string" ? body.buyerEmail : "guest@dropzero.dev",
      qty: Number.isInteger(body.qty) ? body.qty : 1,
      // idempotency key lets a buyer retry safely without double-buying
      idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : randomUUID(),
      region: body.region ?? null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof ReserveError) {
      return NextResponse.json(
        { error: err.reason },
        { status: STATUS[err.reason] ?? 400 },
      );
    }
    console.error("reserve failed:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
