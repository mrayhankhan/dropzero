"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { money } from "@/lib/format";
import type { Drop, DropStatus } from "@/lib/types";

type DropsResponse = { backend: string; region: string; drops: Drop[] };

export default function AdminPage() {
  const { data, mutate } = useSWR<DropsResponse>("/api/drops", fetcher, {
    refreshInterval: 2000,
  });
  const [name, setName] = useState("");
  const [total, setTotal] = useState(100);
  const [price, setPrice] = useState(2500);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    await fetch("/api/drops", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, description, total, priceCents: price, status: "live" }),
    });
    setName("");
    setDescription("");
    await mutate();
    setBusy(false);
  }

  async function setStatus(id: string, status: DropStatus) {
    await fetch(`/api/drops/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate();
  }

  return (
    <div className="py-8">
      <div className="flex items-end justify-between border-b-2 border-line pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Seller console</h1>
        <span className="tag bg-ink text-paper">
          {data ? (data.backend === "dsql" ? `Aurora DSQL · ${data.region}` : "Preview · in-memory") : "…"}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="card h-fit">
          <h2 className="font-bold uppercase tracking-tight">Create a drop</h2>
          <div className="mt-3 grid gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                className="input mt-1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Inventory (units)</label>
                <input
                  type="number"
                  min={1}
                  className="input mt-1 num font-mono"
                  value={total}
                  onChange={(e) => setTotal(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div>
                <label className="label">Price (cents)</label>
                <input
                  type="number"
                  min={0}
                  className="input mt-1 num font-mono"
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>
            <button className="btn-primary" onClick={create} disabled={busy || !name.trim()}>
              {busy ? "Creating…" : "Create drop"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {data?.drops.map((d) => (
            <div key={d.id} className="card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/drops/${d.id}`} className="font-bold hover:text-accent">
                  {d.name}
                </Link>
                <div className="num mt-0.5 font-mono text-xs text-muted">
                  {d.remaining}/{d.total} · {money(d.price_cents)} · {d.status}
                </div>
              </div>
              <select
                className="input w-32"
                value={d.status}
                onChange={(e) => setStatus(d.id, e.target.value as DropStatus)}
              >
                <option value="scheduled">scheduled</option>
                <option value="live">live</option>
                <option value="sold_out">sold_out</option>
                <option value="ended">ended</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
