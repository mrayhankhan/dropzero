import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dropId = searchParams.get("dropId") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 30);
  const store = getStore();
  const orders = await store.recentOrders(dropId, Number.isFinite(limit) ? limit : 30);
  return NextResponse.json({ orders });
}
