"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { money } from "@/lib/format";

type Props = { dropId: string; priceCents: number; disabled?: boolean };

export function BuyPanel({ dropId, priceCents, disabled }: Props) {
  const { mutate } = useSWRConfig();
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function buy() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dropId,
          qty,
          buyerEmail: email || "guest@dropzero.dev",
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const paid = data.payment ? " · paid (test)" : "";
        setMsg({ kind: "ok", text: `Confirmed — ${qty} claimed · ${data.remaining} left${paid}.` });
      } else {
        const map: Record<string, string> = {
          sold_out: "Sold out — DSQL refused to oversell.",
          not_live: "This drop isn't live.",
          not_found: "Drop not found.",
          invalid_qty: "Quantity must be a positive number.",
          payment_failed: "Payment was declined.",
        };
        setMsg({ kind: "err", text: map[data.error] ?? "Could not complete purchase." });
      }
      mutate(`/api/drops/${dropId}`);
      mutate(`/api/feed?dropId=${dropId}`);
      mutate("/api/drops");
    } catch {
      setMsg({ kind: "err", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3 className="font-bold uppercase tracking-tight">Buy</h3>
      <div className="mt-3 grid gap-3">
        <div>
          <label className="label">Email (optional)</label>
          <input
            className="input mt-1"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-3">
          <div className="w-24">
            <label className="label">Qty</label>
            <input
              type="number"
              min={1}
              max={10}
              className="input mt-1 num font-mono"
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <button className="btn-primary flex-1" onClick={buy} disabled={busy || disabled}>
            {busy ? "Claiming…" : `Buy · ${money(priceCents * qty)}`}
          </button>
        </div>
        {msg && (
          <p className={`text-sm font-medium ${msg.kind === "ok" ? "text-ok" : "text-danger"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
