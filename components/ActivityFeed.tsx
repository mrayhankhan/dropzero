"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { maskEmail, timeAgo } from "@/lib/format";
import type { Order } from "@/lib/types";

export function ActivityFeed({ dropId }: { dropId?: string }) {
  const key = dropId ? `/api/feed?dropId=${dropId}` : "/api/feed";
  const { data } = useSWR<{ orders: Order[] }>(key, fetcher, { refreshInterval: 1200 });
  const orders = data?.orders ?? [];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="font-bold uppercase tracking-tight">Live activity</h3>
        <span className="tag">{orders.length} recent</span>
      </div>
      <ul className="mt-3 space-y-px">
        {orders.length === 0 && (
          <li className="py-3 font-mono text-sm text-muted">No sales yet.</li>
        )}
        {orders.map((o) => (
          <li
            key={o.id}
            className="flex items-center justify-between border-b border-line/15 py-2 text-sm last:border-0"
          >
            <span className="num font-mono text-ink">{maskEmail(o.buyer_email)}</span>
            <span className="flex items-center gap-2.5">
              <span className="num font-mono text-muted">×{o.qty}</span>
              {o.region && <span className="tag text-accent">{o.region}</span>}
              <span className="font-mono text-xs text-muted">{timeAgo(o.created_at)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
