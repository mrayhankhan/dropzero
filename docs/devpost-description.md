# Devpost submission — text fields (ready to paste)

## Project name
**DropZero — zero oversells at global scale**

## Tagline
Oversell-proof global live-drops on Amazon Aurora DSQL + Vercel.

## Which AWS Database did you use?
**Amazon Aurora DSQL** (serverless, multi-region active-active, strongly consistent).

## Track
Track 3 — Million-scale Global App.

---

## Inspiration
Every hyped on-sale — concert tickets, sneaker drops, product launches — ends the
same way for someone: a confirmation, then a "sorry, actually sold out" email.
That's **overselling**, and it happens because thousands of people buy in the same
second and the system loses count. We wanted to make overselling *impossible* —
globally, at scale, without a single-region bottleneck.

## What it does
DropZero is a flash-sale engine for any scarce, high-demand resource. A seller
creates a drop with fixed inventory; buyers worldwide rush in at once; every
purchase is guaranteed correct. The built-in **sellout simulator** fires thousands
of concurrent buys and shows the result live: e.g. *1,000 buyers → 200 confirmed,
800 rejected, **0 oversold, 0 conflicts.*** There's a seller console, a live global
activity feed, and per-drop scarcity meters.

## Beyond tickets — the bigger pattern (where this goes)
Ticketing is just the most photogenic example. The real product is **fair,
oversell-proof allocation of any scarce resource that thousands of people grab for
at the same instant** — precisely the systems that crash, freeze, or double-book
somebody every year:
- **University course registration** — 10,000 students hitting "enroll" at 8 a.m. for limited seats and lab sections.
- **Government services** — visa / passport / appointment slots, vaccine and benefit sign-ups, scheme enrollment, exam-center allocation.
- **Enterprise ERP** — inventory, capacity, and resource allocation across regions.
- **Anything with a hard cap** — limited drops, reservations, clinic appointments, parking, IPO/share allotment.

DropZero turns that entire class of problem into a few lines of SQL on Aurora DSQL —
globally, with a *correctness guarantee* instead of a virtual queue and an apology
email. That's the difference between "functional" and genuinely shippable
infrastructure for high-contention allocation worldwide.

## How we built it — and the one decision that matters
Aurora DSQL gives you global scale **and** strong consistency **and** serverless
simplicity at once — but only if you respect its **optimistic concurrency control
(OCC)**. The "obvious" design — one `remaining` counter every buyer decrements — is
the *worst* possible DSQL workload: thousands of writes to one hot row cause a
serialization-conflict retry storm.

So DropZero models inventory as **N discrete unit rows** (`drop_units`), and each
buyer atomically claims a **random distinct** unsold row inside one strongly-
consistent transaction. Now thousands of concurrent buyers touch thousands of
*different* rows — DSQL's sweet spot — and the count can never exceed N because each
row is claimable at most once. The result is **provable zero oversell with near-zero
contention**, which the simulator demonstrates. Idempotency keys make retries safe;
OCC conflicts (`40001`) are retried transparently with jittered backoff.

## Tech stack
Next.js (App Router) + Tailwind on **Vercel**; `pg` + `@aws-sdk/dsql-signer` for
IAM-token auth (no stored passwords); **Amazon Aurora DSQL** as the system of
record. On Vercel, the Marketplace **OIDC** integration assumes an AWS IAM role with
zero secrets in the repo.

## Built during the submission period
Designed the discrete-unit data model, the claim/OCC-retry engine, the concurrency
simulator, the full UI, and the Vercel + Aurora DSQL deployment from scratch during
the hackathon window.

## Revenue model
A per-transaction fee on each drop (the Ticketmaster / Shopify-flash-sale model),
plus seller subscriptions for high-volume drops.

## What's next
Linked multi-region clusters with per-region Vercel deployments; DynamoDB fan-out
for the activity feed at extreme volume; Stripe capture; CloudWatch DPU/conflict
dashboards.
