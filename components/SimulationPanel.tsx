"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";

type SimResult = {
  backend: string;
  buyers: number;
  unitsRequested: number;
  confirmed: number;
  soldOut: number;
  unitsSold: number;
  total: number;
  remaining: number;
  oversold: number;
  conflicts: number;
  durationMs: number;
};

export function SimulationPanel({ dropId }: { dropId: string }) {
  const { mutate } = useSWRConfig();
  const [buyers, setBuyers] = useState(1000);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dropId, buyers, qtyPer: 1 }),
    });
    const data = await res.json();
    if (res.ok) setResult(data);
    mutate(`/api/drops/${dropId}`);
    mutate(`/api/feed?dropId=${dropId}`);
    mutate("/api/drops");
    setBusy(false);
  }

  return (
    <div className="terminal p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-sm bg-accent font-mono text-xs font-bold text-paper">
          ⚡
        </span>
        <h3 className="font-bold uppercase tracking-tight">Sellout simulation</h3>
      </div>
      <p className="mt-2 text-sm text-paper/70">
        Fire thousands of purchases <em>concurrently</em> at this drop.{" "}
        <span className="text-paper">Oversold is always 0</span>, and because each buyer
        claims a <em>random distinct</em> unit, OCC conflicts stay near zero too.
      </p>

      <div className="mt-4 flex items-end gap-3">
        <div className="w-40">
          <label className="label text-paper/60">Concurrent buyers</label>
          <input
            type="number"
            min={1}
            max={5000}
            step={100}
            className="mt-1 w-full rounded border border-paper/30 bg-ink px-3 py-2 font-mono text-sm text-paper outline-none focus:border-accent"
            value={buyers}
            onChange={(e) => setBuyers(Math.min(5000, Math.max(1, Number(e.target.value))))}
          />
        </div>
        <button
          className="rounded border-2 border-paper bg-paper px-4 py-2.5 font-semibold text-ink transition-all duration-100 hover:bg-accent hover:border-accent hover:text-paper disabled:opacity-40"
          onClick={run}
          disabled={busy}
        >
          {busy ? "Running…" : "Run stampede →"}
        </button>
      </div>

      {result && (
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded border border-paper/20 bg-paper/20 sm:grid-cols-4">
          <Stat label="Requested" value={result.unitsRequested.toLocaleString()} />
          <Stat label="Confirmed" value={result.confirmed.toLocaleString()} tone="ok" />
          <Stat label="Rejected" value={result.soldOut.toLocaleString()} />
          <Stat
            label="Oversold"
            value={String(result.oversold)}
            tone={result.oversold === 0 ? "ok" : "bad"}
            big
          />
          <Stat label="Units sold" value={`${result.unitsSold} / ${result.total}`} />
          <Stat label="Remaining" value={result.remaining.toLocaleString()} />
          <Stat
            label="OCC conflicts"
            value={result.conflicts.toLocaleString()}
            tone={result.conflicts <= result.buyers * 0.1 ? "ok" : undefined}
          />
          <Stat label="Duration" value={`${result.durationMs}ms`} />
        </div>
      )}
      {result && result.oversold === 0 && (
        <p className="mt-4 rounded-sm border-l-2 border-ok bg-ok/15 px-3 py-2 text-sm text-paper">
          ✓ {result.confirmed.toLocaleString()} settled · {result.soldOut.toLocaleString()} safely
          rejected · <strong>0 oversold</strong> — with {result.conflicts.toLocaleString()} OCC
          conflict{result.conflicts === 1 ? "" : "s"} retried across{" "}
          {result.buyers.toLocaleString()} concurrent buyers.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  big,
}: {
  label: string;
  value: string;
  tone?: "ok" | "bad";
  big?: boolean;
}) {
  const color = tone === "ok" ? "text-ok" : tone === "bad" ? "text-danger" : "text-paper";
  return (
    <div className="bg-ink px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-paper/50">{label}</div>
      <div className={`num mt-1 font-mono font-semibold ${big ? "text-3xl" : "text-lg"} ${color}`}>
        {value}
      </div>
    </div>
  );
}
