"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import landTopo from "world-atlas/land-110m.json";
import { fetcher } from "@/lib/fetcher";
import type { Order } from "@/lib/types";

// Build a real world silhouette once, projected to the SVG box.
const W = 960;
const H = 470;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const landFeature = feature(landTopo as any, (landTopo as any).objects.land) as any;
const projection = geoNaturalEarth1().fitExtent(
  [
    [14, 14],
    [W - 14, H - 14],
  ],
  landFeature,
);
const LAND_PATH = geoPath(projection)(landFeature) ?? "";

const REGION_DEF = [
  { code: "us-west-2", label: "US-WEST", lon: -120, lat: 44 },
  { code: "us-east-1", label: "US-EAST", lon: -77, lat: 38 },
  { code: "eu-west-1", label: "EU-WEST", lon: -8, lat: 53 },
  { code: "ap-south-1", label: "AP-SOUTH", lon: 73, lat: 19 },
  { code: "ap-northeast-1", label: "AP-NE", lon: 139, lat: 36 },
];
const NODES = REGION_DEF.map((r) => {
  const p = projection([r.lon, r.lat]) ?? [0, 0];
  return { ...r, x: p[0], y: p[1] };
});
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
    const fresh: Order[] = [];
    for (const o of data.orders ?? []) {
      if (!seen.current.has(o.id)) {
        seen.current.add(o.id);
        fresh.push(o);
      }
    }
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
    <div className="card">
      <div className="mb-1 flex items-center justify-between">
        <span className="label">Live worldwide · one consistent inventory</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-ok" /> live
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Live global purchase activity by AWS region"
      >
        {/* continents */}
        <path d={LAND_PATH} fill="rgba(22,20,16,0.07)" stroke="rgba(22,20,16,0.18)" strokeWidth={0.7} />

        {/* great-circle-ish arcs between regions */}
        {ARCS.map(([a, b], i) => {
          const na = NODES[a];
          const nb = NODES[b];
          const mx = (na.x + nb.x) / 2;
          const my = Math.min(na.y, nb.y) - 42;
          return (
            <path
              key={i}
              className="map-arc"
              d={`M${na.x},${na.y} Q${mx},${my} ${nb.x},${nb.y}`}
              fill="none"
              stroke="rgba(31,59,255,0.35)"
              strokeWidth={1.4}
              strokeDasharray="3 7"
            />
          );
        })}

        {/* purchase pings */}
        {pings.map((p) => (
          <circle
            key={p.id}
            className="map-ping"
            cx={p.x}
            cy={p.y}
            r={12}
            fill="none"
            stroke="#0E7A4B"
            strokeWidth={2.5}
          />
        ))}

        {/* region nodes */}
        {NODES.map((n, i) => (
          <g key={n.code}>
            <circle
              className="map-node-ring"
              cx={n.x}
              cy={n.y}
              r={11}
              fill="none"
              stroke="#1F3BFF"
              strokeWidth={1.6}
              style={{ animationDelay: `${i * 0.5}s` }}
            />
            <circle cx={n.x} cy={n.y} r={5} fill="#1F3BFF" />
            <text
              x={n.x}
              y={n.y - 16}
              textAnchor="middle"
              fill="#161410"
              style={{ font: "600 13px ui-monospace, monospace" }}
            >
              {n.label}
            </text>
            <text
              x={n.x}
              y={n.y + 24}
              textAnchor="middle"
              fill="rgba(22,20,16,0.55)"
              style={{ font: "12px ui-monospace, monospace" }}
            >
              {counts[n.code] ?? 0}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
