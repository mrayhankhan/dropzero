"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { money, pct } from "@/lib/format";
import { BuyPanel } from "@/components/BuyPanel";
import { SimulationPanel } from "@/components/SimulationPanel";
import { ActivityFeed } from "@/components/ActivityFeed";
import type { Drop } from "@/lib/types";

export default function DropPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data, error, isLoading } = useSWR<{ drop: Drop }>(
    `/api/drops/${id}`,
    fetcher,
    { refreshInterval: 1200 },
  );

  if (isLoading) return <p className="py-10 font-mono text-sm text-muted">Loading…</p>;
  if (error || !data?.drop)
    return (
      <div className="py-10">
        <p className="text-muted">Drop not found.</p>
        <Link href="/" className="font-mono text-sm text-accent underline">← All drops</Link>
      </div>
    );

  const drop = data.drop;
  const remainingPct = pct(drop.remaining, drop.total);
  const soldOut = drop.status !== "live" || drop.remaining <= 0;

  return (
    <div className="py-8">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-wider text-muted hover:text-ink"
      >
        ← All drops
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{drop.name}</h1>
              <span className="num shrink-0 text-2xl font-extrabold">{money(drop.price_cents)}</span>
            </div>
            {drop.description && <p className="mt-2 text-muted">{drop.description}</p>}

            <div className="perf my-5" />

            <div className={`meter ${soldOut ? "danger" : ""}`}>
              <span style={{ width: `${remainingPct}%` }} />
            </div>
            <div className="mt-2.5 flex items-center justify-between font-mono text-sm">
              <span className={`num ${soldOut ? "text-danger" : "text-ok"}`}>
                {drop.remaining.toLocaleString()} of {drop.total.toLocaleString()} remaining
              </span>
              <span className="num text-muted">{remainingPct}%</span>
            </div>
          </div>

          <SimulationPanel dropId={drop.id} />
        </div>

        <div className="space-y-6">
          <BuyPanel dropId={drop.id} priceCents={drop.price_cents} disabled={soldOut} />
          <ActivityFeed dropId={drop.id} />
        </div>
      </div>
    </div>
  );
}
