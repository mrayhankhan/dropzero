"use client";

import { useState, type ReactNode } from "react";
import { useSWRConfig } from "swr";
import { CountUp } from "./CountUp";

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
  retryRatePct: number;
  throughputPerSec: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  regions: { code: string; confirmed: number }[];
  integrityOk: boolean;
  durationMs: number;
};

export function SimulationPanel({ dropId }: { dropId: string }) {
  const { mutate } = useSWRConfig();
  const [buyers, setBuyers] = useState(2000);
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
    mutate(`/api/drops/${dropId}/stats`);
    mutate(`/api/feed?dropId=${dropId}`);
    mutate("/api/drops");
    setBusy(false);
  }

  const maxRegion = result ? Math.max(1, ...result.regions.map((r) => r.confirmed)) : 1;

  return (
    <div className="terminal p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-sm bg-accent font-mono text-xs font-bold text-paper">
            ⚡
          </span>
          <h3 className="font-bold uppercase tracking-tight">Consistency console</h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-paper/40">
          live load test
        </span>
      </div>
      <p className="mt-2 text-sm text-paper/70">
        Fire thousands of purchases <em>concurrently</em>, from many regions, at this drop.
        Watch <span className="text-paper">oversold stay 0</span>, conflicts stay near zero, and
        the integrity check pass — the live proof of strong consistency under load.
      </p>

      <div className="mt-4 flex items-end gap-3">
        <div className="w-44">
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
          className="rounded border-2 border-paper bg-paper px-4 py-2.5 font-semibold text-ink transition-all duration-100 hover:border-accent hover:bg-accent hover:text-paper disabled:opacity-40"
          onClick={run}
          disabled={busy}
        >
          {busy ? "Running…" : "Run stampede →"}
        </button>
      </div>

      {result && (
        <>
          {/* hero metrics */}
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded border border-paper/20 bg-paper/20 sm:grid-cols-4">
            <Hero label="Oversold" value={<CountUp value={result.oversold} />} tone={result.oversold === 0 ? "ok" : "bad"} />
            <Hero
              label="Integrity"
              value={result.integrityOk ? "✓ verified" : "✗ failed"}
              tone={result.integrityOk ? "ok" : "bad"}
            />
            <Hero
              label="Throughput"
              value={<CountUp value={result.throughputPerSec} format={(n) => `${n.toLocaleString()}/s`} />}
            />
            <Hero
              label="OCC retry rate"
              value={<CountUp value={result.retryRatePct} format={(n) => `${n}%`} />}
              tone={result.retryRatePct < 5 ? "ok" : undefined}
            />
          </div>

          {/* detail grid */}
          <div className="mt-px grid grid-cols-2 gap-px overflow-hidden rounded border border-paper/20 bg-paper/20 sm:grid-cols-4">
            <Stat label="Requested" value={<CountUp value={result.unitsRequested} />} />
            <Stat label="Confirmed" value={<CountUp value={result.confirmed} />} />
            <Stat label="Rejected" value={<CountUp value={result.soldOut} />} />
            <Stat label="Units sold" value={`${result.unitsSold}/${result.total}`} />
            <Stat label="Latency p50" value={`${result.latencyP50}ms`} />
            <Stat label="Latency p95" value={`${result.latencyP95}ms`} />
            <Stat label="Latency p99" value={`${result.latencyP99}ms`} />
            <Stat label="Wall time" value={`${result.durationMs}ms`} />
          </div>

          {/* region distribution */}
          {result.regions.length > 0 && (
            <div className="mt-4">
              <div className="label mb-2 text-paper/60">Confirmed sales by region · one consistent inventory</div>
              <div className="space-y-1.5">
                {result.regions.map((r) => (
                  <div key={r.code} className="flex items-center gap-2">
                    <span className="w-28 shrink-0 font-mono text-xs text-paper/70">{r.code}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-sm bg-paper/10">
                      <span
                        className="block h-full bg-accent transition-[width] duration-700 ease-out"
                        style={{ width: `${(r.confirmed / maxRegion) * 100}%` }}
                      />
                    </div>
                    <span className="num w-10 shrink-0 text-right font-mono text-xs text-paper">
                      {r.confirmed}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.oversold === 0 && result.integrityOk && (
            <p className="mt-4 rounded-sm border-l-2 border-ok bg-ok/15 px-3 py-2 text-sm text-paper">
              ✓ {result.confirmed.toLocaleString()} settled · {result.soldOut.toLocaleString()} safely
              rejected · <strong>0 oversold</strong> · integrity verified · {result.conflicts.toLocaleString()}{" "}
              conflict{result.conflicts === 1 ? "" : "s"} retried across {result.buyers.toLocaleString()}{" "}
              buyers in {result.regions.length} regions.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Hero({ label, value, tone }: { label: string; value: ReactNode; tone?: "ok" | "bad" }) {
  const color = tone === "ok" ? "text-ok" : tone === "bad" ? "text-danger" : "text-paper";
  return (
    <div className="bg-ink px-3 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-paper/50">{label}</div>
      <div className={`num mt-1 font-mono text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="bg-ink px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-paper/50">{label}</div>
      <div className="num mt-1 font-mono text-base font-semibold text-paper">{value}</div>
    </div>
  );
}
