import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const drops = await store.listDrops();
  return NextResponse.json({ backend: store.backend, region: store.region, drops });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !Number.isInteger(body.total)) {
    return NextResponse.json(
      { error: "name (string) and total (integer) are required" },
      { status: 400 },
    );
  }
  const store = getStore();
  const drop = await store.createDrop({
    name: body.name,
    description: body.description ?? null,
    imageUrl: body.imageUrl ?? null,
    total: body.total,
    priceCents: Number.isInteger(body.priceCents) ? body.priceCents : 0,
    status: body.status ?? "live",
    startsAt: body.startsAt ?? null,
  });
  return NextResponse.json({ drop }, { status: 201 });
}
