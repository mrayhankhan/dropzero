import { NextResponse } from "next/server";
import { simulateSellout } from "@/lib/sim";
import { ReserveError } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.dropId !== "string") {
    return NextResponse.json({ error: "dropId is required" }, { status: 400 });
  }
  // cap the burst so a demo click can't run away with cost
  const buyers = Math.min(Math.max(Number(body.buyers) || 500, 1), 5000);
  const qtyPer = Math.min(Math.max(Number(body.qtyPer) || 1, 1), 10);

  try {
    const result = await simulateSellout(body.dropId, buyers, qtyPer);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ReserveError) {
      return NextResponse.json({ error: err.reason }, { status: 404 });
    }
    console.error("simulate failed:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
