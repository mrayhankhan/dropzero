import "dotenv/config";
import { isDsqlConfigured } from "../lib/db";
import { getStore } from "../lib/store";
import type { CreateDropInput } from "../lib/types";

/**
 * Seeds a few headline drops so the app has something to show.
 *   npm run db:seed
 * Run `npm run db:init` first. In preview (no DSQL) the app self-seeds, so this
 * is mainly for a real cluster.
 */

const drops: CreateDropInput[] = [
  {
    name: "Aurora Live — Front Row (Tokyo)",
    description:
      "200 front-row seats for the sold-out Tokyo show. Global on-sale, zero oversells.",
    total: 200,
    priceCents: 18900,
    status: "live",
  },
  {
    name: "Zero Stack Hoodie — Founder's Drop",
    description: "500 units worldwide. Heavyweight fleece, founder edition.",
    total: 500,
    priceCents: 6400,
    status: "live",
  },
  {
    name: "H0 Keynote — VIP Pass",
    description: "Only 50 VIP passes. These sell out in seconds.",
    total: 50,
    priceCents: 24900,
    status: "live",
  },
  {
    name: "Region-Failover Sneaker — Drop 001",
    description: "1,000 pairs. Buyers hit two AWS regions at once; still no oversell.",
    total: 1000,
    priceCents: 12000,
    status: "live",
  },
];

async function main() {
  if (!isDsqlConfigured()) {
    console.warn(
      "DSQL not configured — preview mode self-seeds in memory. Nothing to do.",
    );
    return;
  }
  const store = getStore();
  for (const d of drops) {
    const created = await store.createDrop(d);
    console.log(`✓ ${created.name} (${created.total} units) — ${created.id}`);
  }
  console.log(`\nSeeded ${drops.length} drops into Aurora DSQL.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
