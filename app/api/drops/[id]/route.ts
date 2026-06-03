import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import type { DropStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const store = getStore();
  const drop = await store.getDrop(params.id);
  if (!drop) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ drop });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => null);
  const status = body?.status as DropStatus | undefined;
  const allowed: DropStatus[] = ["scheduled", "live", "sold_out", "ended"];
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const store = getStore();
  const drop = await store.setStatus(params.id, status);
  if (!drop) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ drop });
}
