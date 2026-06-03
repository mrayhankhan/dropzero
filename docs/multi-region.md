# Multi-region active-active (the scale story)

DropZero's code already supports it — this guide makes the "global, strongly-
consistent" claim *provable* in your demo. Optional but high-impact for Track 3.

## Why it's compelling
Aurora DSQL runs **multi-region active-active**: linked clusters in two regions each
accept reads *and* writes, and the data is **strongly consistent** across both — no
replication-lag window where you could oversell. A buyer in each region claims units
from the same inventory, and the counts stay perfectly correct. That's the thing the
DSQL judges built; showing it is the strongest possible "judge fit."

## Setup

1. **Create a linked (peered) DSQL cluster** in two regions on the same continent
   (DSQL links within US, within Europe, or within Asia Pacific — not yet across
   continents). e.g. `us-east-1` ↔ `us-east-2`. Each region exposes its own
   endpoint; both see the same data with strong consistency.

2. **Initialize once.** Run `npm run db:init && npm run db:seed` against either
   endpoint — the schema and data appear in both regions.

3. **Deploy DropZero to two Vercel regions**, each pointed at its nearest DSQL
   endpoint:
   - Deployment A env: `DSQL_CLUSTER_ENDPOINT=<region-A endpoint>`,
     `AWS_REGION=us-east-1`, `APP_REGION_LABEL=us-east-1`
   - Deployment B env: `DSQL_CLUSTER_ENDPOINT=<region-B endpoint>`,
     `AWS_REGION=us-east-2`, `APP_REGION_LABEL=us-east-2`

   The `region` is stamped onto every order, so the **live activity feed shows
   purchases tagged with both regions** flowing into one consistent inventory.

## Demoing it
- Open both deployments side by side.
- Run a stampede on each at the *same* drop simultaneously.
- Show the combined result: total confirmed never exceeds inventory, `oversold: 0`,
  and the feed shows `us-east-1` **and** `us-east-2` orders against one count.

> The app needs no code changes — only the two env-configured deployments. The
> claim engine's correctness is per-row and transaction-scoped, so it holds
> identically whether one region or two are writing.

## Cost note (for the architecture diagram's cost pillar)
Multi-region adds ~50% to DPU (writes replicate) and stores data in each region.
The simulator is capped at 5,000 buyers to bound demo spend; the $100 AWS credit
comfortably covers a hackathon's worth of stampedes.
