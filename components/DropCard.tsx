import Link from "next/link";
import type { Drop } from "@/lib/types";
import { money, pct } from "@/lib/format";

const STATUS_STYLE: Record<string, string> = {
  live: "text-ok",
  sold_out: "text-danger",
  scheduled: "text-accent",
  ended: "text-muted",
};

export function DropCard({ drop }: { drop: Drop }) {
  const remainingPct = pct(drop.remaining, drop.total);
  const soldOut = drop.status === "sold_out" || drop.remaining <= 0;
  return (
    <Link
      href={`/drops/${drop.id}`}
      className="card group block transition-all duration-100 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[17px] font-bold leading-tight">{drop.name}</h3>
        <span className={`tag ${STATUS_STYLE[drop.status] ?? ""}`}>
          {drop.status === "live" && <span className="h-1.5 w-1.5 rounded-full bg-ok" />}
          {drop.status.replace("_", " ")}
        </span>
      </div>
      {drop.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted">{drop.description}</p>
      )}

      <div className={`mt-4 meter ${soldOut ? "danger" : ""}`}>
        <span style={{ width: `${remainingPct}%` }} />
      </div>
      <div className="mt-2.5 flex items-end justify-between">
        <span className="num font-mono text-sm text-ink">
          {drop.remaining.toLocaleString()}
          <span className="text-muted"> / {drop.total.toLocaleString()} left</span>
        </span>
        <span className="num text-lg font-extrabold">{money(drop.price_cents)}</span>
      </div>
    </Link>
  );
}
