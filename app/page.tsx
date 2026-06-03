"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { DropCard } from "@/components/DropCard";
import type { Drop } from "@/lib/types";

type DropsResponse = { backend: string; region: string; drops: Drop[] };

export default function Home() {
  const { data, isLoading } = useSWR<DropsResponse>("/api/drops", fetcher, {
    refreshInterval: 1500,
  });

  const onDsql = data?.backend === "dsql";

  return (
    <div>
      <section className="border-b-2 border-line py-12 sm:py-16">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="tag bg-ink text-paper">
            <span className={`h-1.5 w-1.5 rounded-full ${onDsql ? "bg-ok" : "bg-accent"}`} />
            {data ? (onDsql ? `Aurora DSQL · ${data.region}` : "Preview · in-memory") : "…"}
          </span>
          <span className="tag">Strongly consistent</span>
          <span className="tag">Multi-region active-active</span>
        </div>

        <h1 className="max-w-3xl text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl">
          Sell every unit.
          <br />
          <span className="box-decoration-clone bg-accent px-2 text-paper">
            Oversell nothing.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          DropZero runs limited drops for a worldwide audience. Every purchase atomically
          claims a distinct unit on{" "}
          <span className="font-semibold text-ink">Amazon Aurora DSQL</span> — so inventory
          can never go below zero, even with thousands buying in the same instant across
          regions. Pick a drop and try to break it.
        </p>
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
    </div>
  );
}
