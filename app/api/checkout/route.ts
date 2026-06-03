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

/**
 * Buyer checkout. Two modes:
 *  - No STRIPE_SECRET_KEY  → preview: just claim the units (same shape as /reserve).
 *  - STRIPE_SECRET_KEY set → test-mode payment using the correct
 *    authorize → fulfill → capture pattern:
 *      1. authorize the card (PaymentIntent, capture_method: manual)
 *      2. claim the inventory in Aurora DSQL
 *      3. capture on success, or cancel the authorization if it sold out
 *    so we never charge a buyer we couldn't fulfill.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.dropId !== "string") {
    return NextResponse.json({ error: "dropId is required" }, { status: 400 });
  }

  const store = getStore();
  const reserveInput = {
    dropId: body.dropId as string,
    buyerEmail: typeof body.buyerEmail === "string" ? body.buyerEmail : "guest@dropzero.dev",
    qty: Number.isInteger(body.qty) ? (body.qty as number) : 1,
    idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : randomUUID(),
    region: body.region ?? null,
  };

  const key = process.env.STRIPE_SECRET_KEY;

  // ── Preview / no-payments path ────────────────────────────────────────────
  if (!key) {
    try {
      const result = await store.reserve(reserveInput);
      return NextResponse.json({ ...result, payment: null, mode: "preview" }, { status: 201 });
    } catch (err) {
      return mapError(err);
    }
  }

  // ── Stripe test-mode path ─────────────────────────────────────────────────
  const drop = await store.getDrop(reserveInput.dropId);
  if (!drop) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const amount = drop.price_cents * reserveInput.qty;

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(key);

  let intentId: string | undefined;
  try {
    // 1) authorize
    const intent = await stripe.paymentIntents.create(
      {
        amount,
        currency: "usd",
        payment_method: "pm_card_visa", // Stripe test card
        payment_method_types: ["card"],
        capture_method: "manual",
        confirm: true,
        description: `DropZero · ${drop.name}`,
        receipt_email: reserveInput.buyerEmail,
      },
      { idempotencyKey: `auth_${reserveInput.idempotencyKey}` },
    );
    intentId = intent.id;
    if (intent.status !== "requires_capture") {
      return NextResponse.json({ error: "payment_failed", status: intent.status }, { status: 402 });
    }

    // 2) fulfill (claim inventory)
    const result = await store.reserve(reserveInput);

    // 3) capture
    const captured = await stripe.paymentIntents.capture(intent.id);
    return NextResponse.json(
      {
        ...result,
        payment: { id: captured.id, status: captured.status, amount },
        mode: "stripe_test",
      },
      { status: 201 },
    );
  } catch (err) {
    // release the authorization if we couldn't fulfill
    if (intentId) {
      try {
        await stripe.paymentIntents.cancel(intentId);
      } catch {
        /* best effort */
      }
    }
    return mapError(err);
  }
}

function mapError(err: unknown) {
  if (err instanceof ReserveError) {
    return NextResponse.json({ error: err.reason }, { status: STATUS[err.reason] ?? 400 });
  }
  console.error("checkout failed:", err);
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}
