"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { money } from "@/lib/format";
import type { DropStats } from "@/lib/types";

function fmtDuration(sec: number | null): string {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export function DropStats({ dropId }: { dropId: string }) {
  const { data } = useSWR<{ stats: DropStats }>(`/api/drops/${dropId}/stats`, fetcher, {
    refreshInterval: 1500,
  });
  const s = data?.stats;

  const cells: { label: string; value: string }[] = [
    { label: "Revenue", value: s ? money(s.revenueCents) : "—" },
    { label: "Sell-through", value: s ? `${s.sellThroughPct}%` : "—" },
    { label: "Units sold", value: s ? `${s.unitsSold.toLocaleString()}/${s.total.toLocaleString()}` : "—" },
    { label: "Velocity", value: s ? `${s.velocityPerMin}/min` : "—" },
    { label: "Time to sellout", value: s ? fmtDuration(s.timeToSelloutSec) : "—" },
  ];

  return (
    <div className="card">
      <h3 className="label">Seller analytics</h3>
      <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded border border-line/20 bg-line/10 sm:grid-cols-5">
        {cells.map((c) => (
          <div key={c.label} className="bg-card px-3 py-2.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">{c.label}</div>
            <div className="num mt-1 text-lg font-extrabold">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
