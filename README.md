# DropZero — zero oversells at global scale

**Oversell-proof global live-drops, built on Amazon Aurora DSQL + Vercel.**
Sell limited inventory (tickets, sneaker drops, product launches, appointment
slots — any scarce, high-demand resource) to a worldwide audience, and never
oversell a single unit, even when thousands of people buy in the same instant.

> Built for the **H0: Hack the Zero Stack** hackathon · Track 3 (Million-scale
> Global App) · Database: **Amazon Aurora DSQL**.

---

## The problem

When a hyped drop goes on sale, thousands of buyers hit "Buy" in the same
half-second. Most systems handle this by either (a) funneling everyone through a
single locked database row (a global bottleneck — slow, doesn't scale), (b) a
virtual waiting room (a workaround, not a fix), or (c) eventually-consistent
cross-region writes (which can briefly **oversell** during replication). Each
trades away global speed, strong consistency, or operational simplicity.

## The insight (and the one decision the whole project rests on)

Aurora DSQL gives you all three at once — serverless, multi-region **active-active**,
**strongly consistent** SQL — *if you design for its concurrency model.*

DSQL uses **optimistic concurrency control (OCC)**: transactions run lock-free and
conflicts are detected at commit, where the loser gets `SQLSTATE 40001` and must
retry. That means the "obvious" design — **one `remaining` counter that every
buyer decrements** — is the *worst* possible workload: thousands of writes to one
hot row produce a retry storm.

**DropZero models inventory as `N` discrete unit rows** (`drop_units`), and each
buyer atomically claims a **random distinct** unsold row. Now 5,000 concurrent
buyers touch ~5,000 *different* rows — DSQL's documented sweet spot — and the count
can never exceed `N`, because each unit row is claimable at most once.

> **Result:** provable zero oversell **and** near-zero conflicts. The app's
> built-in stampede simulator demonstrates both live.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full diagram and data model.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind, SWR live polling |
| API | Next.js Route Handlers (Node runtime) |
| Database | **Amazon Aurora DSQL** (PostgreSQL-compatible, multi-region) |
| DB driver | `pg` + `@aws-sdk/dsql-signer` (IAM token auth, no passwords) |
| Hosting | Vercel (+ Vercel Marketplace OIDC for keyless AWS access) |

---

## Quick start (zero credentials)

The app ships with an in-memory store that mirrors the DSQL claim model, so you
can run and demo it **with no AWS account at all**:

```bash
npm install
npm run dev      # http://localhost:3000
```

Open a drop → hit **Run stampede** → watch `oversold: 0`. The header badge reads
**"Preview mode (in-memory)"** until you connect a real cluster.

---

## Going live on Aurora DSQL

### Option A — Vercel Marketplace (recommended, keyless)

1. In your Vercel project: **Storage → Add → Amazon Aurora DSQL** (Marketplace).
2. Pick a region and plan; Vercel provisions the cluster and wires **OIDC** so
   your deployment assumes an IAM role with **no stored secrets**. It injects
   `DSQL_CLUSTER_ENDPOINT` and `AWS_REGION` automatically.
3. Initialize the schema and seed data (from your machine, against the cluster):
   ```bash
   cp .env.example .env.local   # paste the cluster endpoint + region
   npm run db:init              # creates tables; rewrites indexes to CREATE INDEX ASYNC for DSQL
   npm run db:seed              # mints a few headline drops
   ```
4. Redeploy. The badge flips to **"Aurora DSQL · <region>"**.

### Option B — Bring your own AWS account

Create a DSQL cluster in the AWS console, then set the values in `.env.local`
(`DSQL_CLUSTER_ENDPOINT`, `AWS_REGION`, and local `AWS_ACCESS_KEY_ID` /
`AWS_SECRET_ACCESS_KEY` for the signer). Run `db:init` + `db:seed` as above.

> **Multi-region:** create a linked DSQL cluster (peer region), deploy DropZero to
> two Vercel regions, and point each at its nearest endpoint. Both regions read
> and write with strong consistency — that's the active-active story for the demo.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app (preview mode unless DSQL is configured) |
| `npm run db:init` | Apply `db/schema.sql` to the DSQL cluster (`-- --drop` to reset) |
| `npm run db:seed` | Insert headline drops + mint their unit rows |
| `npm run build` / `start` | Production build / serve |

---

## How it works (the claim transaction)

`lib/store-dsql.ts` → `reserve()`, wrapped in `withRetry` (`lib/db.ts`):

1. **Idempotency** — if the `idempotency_key` already produced an order, return it
   (a double-click never double-buys).
2. **Claim `qty` distinct random units** — for each unit, find an available row at
   a *random* `unit_no` offset, then `UPDATE … WHERE id = $ AND status = 'available'`.
   Random targeting spreads concurrent writers across distinct keys.
3. **Record the order**; flip the drop to `sold_out` when the last unit goes.

OCC conflicts (`40001`) restart the whole transaction with jittered backoff. The
simulator counts those retries and shows you they stay near zero.

---

## Project structure

```
app/                  Next.js App Router (pages + /api route handlers)
components/            DropCard, BuyPanel, SimulationPanel, ActivityFeed, Header
lib/
  db.ts               DSQL pool, IAM-token auth, tx(), withRetry() (OCC)
  store-dsql.ts       the real, judged data layer (discrete-unit claims)
  store-memory.ts     zero-credential preview mirror
  store.ts            picks dsql vs memory at runtime
  sim.ts              concurrent stampede engine (the proof)
db/
  schema.sql          DSQL-compatible schema (no FKs/JSON; async indexes)
  init.ts / seed.ts   apply schema + mint demo drops
docs/                 demo script, v0 prompt, blog draft, submission checklist
```

## Security

No database passwords anywhere. On Vercel, the Marketplace **OIDC** integration
lets the app assume a short-lived AWS IAM role per request; locally,
`DsqlSigner` mints a fresh IAM auth token per connection. Never commit `.env*`
(see `.gitignore`).
