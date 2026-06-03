import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const store = getStore();
  const stats = await store.stats(params.id);
  if (!stats) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ stats });
}
