"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Order } from "@/lib/types";

type Node = { code: string; label: string; x: number; y: number };

// Approximate positions on an equirectangular world (viewBox 1000 x 320).
const NODES: Node[] = [
  { code: "us-west-2", label: "US-WEST", x: 165, y: 150 },
  { code: "us-east-1", label: "US-EAST", x: 262, y: 138 },
  { code: "eu-west-1", label: "EU-WEST", x: 478, y: 116 },
  { code: "ap-south-1", label: "AP-SOUTH", x: 690, y: 196 },
  { code: "ap-northeast-1", label: "AP-NE", x: 848, y: 150 },
];
const ARCS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [1, 4],
];

type Ping = { id: number; x: number; y: number };

export function RegionMap() {
  const { data } = useSWR<{ orders: Order[] }>("/api/feed?limit=40", fetcher, {
    refreshInterval: 2000,
  });
  const orders = data?.orders ?? [];

  const seen = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const pingId = useRef(0);
  const [pings, setPings] = useState<Ping[]>([]);

  const counts: Record<string, number> = {};
  for (const o of orders) if (o.region) counts[o.region] = (counts[o.region] ?? 0) + 1;

  useEffect(() => {
    if (!data) return;
    const os = data.orders ?? [];
    const fresh: Order[] = [];
    for (const o of os) {
      if (!seen.current.has(o.id)) {
        seen.current.add(o.id);
        fresh.push(o);
      }
    }
    // don't ping the whole backlog on first load
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    const newPings: Ping[] = [];
    for (const o of fresh.slice(0, 6)) {
      const node = NODES.find((n) => n.code === o.region);
      if (node) newPings.push({ id: pingId.current++, x: node.x, y: node.y });
    }
    if (newPings.length) {
      setPings((p) => [...p, ...newPings]);
      const ids = new Set(newPings.map((n) => n.id));
      setTimeout(() => setPings((p) => p.filter((x) => !ids.has(x.id))), 1400);
    }
  }, [data]);

  return (
    <div className="ambient-grid rounded border-2 border-line bg-ink p-4 text-paper">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-paper/60">
          Live worldwide · one consistent inventory
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-paper/50">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-ok" /> live
        </span>
      </div>
      <svg
        viewBox="0 0 1000 320"
        className="w-full"
        role="img"
        aria-label="Live global purchase activity by AWS region"
      >
        <defs>
          <pattern id="mapdots" width="17" height="17" patternUnits="userSpaceOnUse">
            <circle cx="1.3" cy="1.3" r="1.3" fill="rgba(255,255,255,0.06)" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1000" height="320" fill="url(#mapdots)" />

        {ARCS.map(([a, b], i) => {
          const na = NODES[a];
          const nb = NODES[b];
          const mx = (na.x + nb.x) / 2;
          const my = Math.min(na.y, nb.y) - 46;
          return (
            <path
              key={i}
              className="map-arc"
              d={`M${na.x},${na.y} Q${mx},${my} ${nb.x},${nb.y}`}
              fill="none"
              stroke="rgba(31,59,255,0.45)"
              strokeWidth="1.5"
              strokeDasharray="3 7"
            />
          );
        })}

        {pings.map((p) => (
          <circle
            key={p.id}
            className="map-ping"
            cx={p.x}
            cy={p.y}
            r="11"
            fill="none"
            stroke="#0E7A4B"
            strokeWidth="2.5"
          />
        ))}

        {NODES.map((n, i) => (
          <g key={n.code}>
            <circle
              className="map-node-ring"
              cx={n.x}
              cy={n.y}
              r="10"
              fill="none"
              stroke="#1F3BFF"
              strokeWidth="1.5"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
            <circle cx={n.x} cy={n.y} r="4.5" fill="#1F3BFF" />
            <text
              x={n.x}
              y={n.y - 16}
              textAnchor="middle"
              fill="#F1EEE4"
              style={{ font: "600 12px ui-monospace, monospace" }}
            >
              {n.label}
            </text>
            <text
              x={n.x}
              y={n.y + 22}
              textAnchor="middle"
              fill="rgba(241,238,228,0.55)"
              style={{ font: "11px ui-monospace, monospace" }}
            >
              {counts[n.code] ?? 0}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
