"use client";

import { type ReactNode } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { DropCard } from "@/components/DropCard";
import { LiveTicker } from "@/components/LiveTicker";
import { RegionMap } from "@/components/RegionMap";
import { CountUp } from "@/components/CountUp";
import type { Drop } from "@/lib/types";

type DropsResponse = { backend: string; region: string; drops: Drop[] };

export default function Home() {
  const { data, isLoading } = useSWR<DropsResponse>("/api/drops", fetcher, {
    refreshInterval: 1500,
  });

  const onDsql = data?.backend === "dsql";

  return (
    <div>
      <div className="-mx-4">
        <LiveTicker />
      </div>

      <section className="border-b-2 border-line py-12 sm:py-16">
        <div className="enter mb-5 flex flex-wrap items-center gap-2">
          <span className="tag bg-ink text-paper">
            <span className={`live-dot h-1.5 w-1.5 rounded-full ${onDsql ? "bg-ok" : "bg-accent"}`} />
            {data ? (onDsql ? `Aurora DSQL · ${data.region}` : "Preview · in-memory") : "…"}
          </span>
          <span className="tag">Strongly consistent</span>
          <span className="tag">Multi-region active-active</span>
        </div>

        <h1 className="enter max-w-3xl text-5xl font-extrabold leading-[0.98] tracking-tight [animation-delay:80ms] sm:text-6xl">
          Sell every unit.
          <br />
          <span className="wipe-in box-decoration-clone bg-accent px-2 text-paper">
            Oversell nothing.
          </span>
        </h1>
        <p className="enter mt-6 max-w-2xl text-lg text-muted [animation-delay:160ms]">
          DropZero runs limited drops for a worldwide audience. Every purchase atomically
          claims a distinct unit on{" "}
          <span className="font-semibold text-ink">Amazon Aurora DSQL</span> — so inventory
          can never go below zero, even with thousands buying in the same instant across
          regions. Pick a drop and try to break it.
        </p>

        <div className="enter mt-8 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line/10 [animation-delay:240ms] sm:grid-cols-4">
          <HeroStat value="0" label="Oversells, ever" />
          <HeroStat value={<><CountUp value={100} />%</>} label="Inventory integrity" />
          <HeroStat value={<CountUp value={5} />} label="AWS regions" />
          <HeroStat
            value={<CountUp value={12000} format={(n) => `${(n / 1000).toFixed(1)}k`} />}
            label="Txns/sec (sim)"
          />
        </div>

        <div className="enter mt-8 [animation-delay:320ms]">
          <RegionMap />
        </div>
      </section>

      <section className="py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="label text-ink">Live drops</h2>
          <span className="label">{data?.drops.length ?? 0} active</span>
        </div>
        {isLoading && <p className="font-mono text-sm text-muted">Loading drops…</p>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.drops.map((d) => (
            <DropCard key={d.id} drop={d} />
          ))}
        </div>
        {data && data.drops.length === 0 && (
          <p className="font-mono text-sm text-muted">
            No drops yet — create one in the{" "}
            <a className="text-accent underline" href="/admin">Seller</a> console.
          </p>
        )}
      </section>

      <section className="border-t-2 border-line py-12">
        <h2 className="label mb-6 text-ink">How it works</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Model inventory as rows",
              d: "Every unit is its own database row — not a shared counter. A 500-unit drop is 500 claimable rows.",
            },
            {
              n: "02",
              t: "Claim a random distinct unit",
              d: "Each buyer atomically claims a different random unit in one strongly-consistent Aurora DSQL transaction.",
            },
            {
              n: "03",
              t: "Provably never oversell",
              d: "Each row is claimable once, so the count can't exceed the total — across regions, under any load.",
            },
          ].map((s) => (
            <div key={s.n} className="card">
              <div className="font-mono text-2xl font-extrabold text-accent">{s.n}</div>
              <h3 className="mt-2 font-bold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t-2 border-line py-12">
        <h2 className="label mb-2 text-ink">Why Aurora DSQL</h2>
        <p className="mb-6 max-w-2xl text-muted">
          Overselling is a solved problem — but every existing fix trades away global speed,
          strong consistency, or operational simplicity. Aurora DSQL is the first to give all three.
        </p>
        <div className="overflow-x-auto rounded border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-card font-mono text-[11px] uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5 text-left font-medium">Approach</th>
                <th className="px-4 py-2.5 text-center font-medium">Global speed</th>
                <th className="px-4 py-2.5 text-center font-medium">Strong consistency</th>
                <th className="px-4 py-2.5 text-center font-medium">Simple ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/15">
              {[
                ["Single-region locked DB", false, true, true],
                ["Waiting-room queue", null, false, false],
                ["DynamoDB multi-region", true, false, true],
                ["Redis atomic counter", true, false, null],
                ["Aurora DSQL — DropZero", true, true, true],
              ].map((row, i) => {
                const last = i === 4;
                return (
                  <tr key={i} className={last ? "bg-accent/5 font-semibold" : ""}>
                    <td className="px-4 py-2.5">{row[0] as string}</td>
                    {[row[1], row[2], row[3]].map((v, j) => (
                      <td key={j} className="px-4 py-2.5 text-center font-mono">
                        {v === true ? (
                          <span className="text-ok">✓</span>
                        ) : v === false ? (
                          <span className="text-danger">✗</span>
                        ) : (
                          <span className="text-muted">~</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="bg-card px-4 py-3">
      <div className="num font-mono text-2xl font-extrabold text-ink">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
        {label}
      </div>
    </div>
  );
}
