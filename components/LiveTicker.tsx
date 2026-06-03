"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { maskEmail, timeAgo } from "@/lib/format";
import type { Order } from "@/lib/types";

/**
 * A continuously-scrolling "live tape" of recent purchases across all drops and
 * regions. Driven by real /api/feed data — it visibly conveys "this is live and
 * global right now" without any decorative noise. Hidden when there's no activity.
 */
export function LiveTicker() {
  const { data } = useSWR<{ orders: Order[] }>("/api/feed?limit=24", fetcher, {
    refreshInterval: 2000,
  });
  const orders = data?.orders ?? [];
  if (orders.length === 0) return null;

  // duplicate the list so the marquee loops seamlessly
  const items = [...orders, ...orders];

  return (
    <div className="ambient-grid relative overflow-hidden border-y-2 border-line bg-ink">
      <div className="marquee-track flex w-max gap-8 py-2.5">
        {items.map((o, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-xs"
          >
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-ok" />
            <span className="text-paper">{maskEmail(o.buyer_email)}</span>
            <span className="text-paper/45">claimed ×{o.qty}</span>
            <span className="rounded-sm border border-paper/25 px-1.5 py-0.5 text-paper/70">
              {o.region ?? "global"}
            </span>
            <span className="text-paper/35">{timeAgo(o.created_at)}</span>
          </span>
        ))}
      </div>
      {/* edge fades */}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-ink to-transparent" />
      <span className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-ink to-transparent" />
      <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 font-mono text-[10px] uppercase tracking-wider text-paper/40 sm:block">
        live · global
      </span>
    </div>
  );
}
