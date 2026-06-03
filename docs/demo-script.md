# DropZero — 3-minute demo video script

> Judges may stop at 3:00. Front-load the problem and the proof. Show the working
> app on screen for most of it. Say the database name out loud (a submission
> requirement).

**Total: ~2:50. Record at 1440p+, app in a clean desktop browser.**

---

### 0:00–0:25 — The problem (hook)
*[Screen: the DropZero home page, three live drops]*

> "Every time a hyped on-sale happens — concert tickets, a sneaker drop, a product
> launch — thousands of people buy in the same second, and systems oversell. You
> get the confirmation, then the 'sorry, actually sold out' email. DropZero makes
> that impossible, at global scale. It runs on **Amazon Aurora DSQL**."

### 0:25–0:55 — What it is
*[Click into "H0 Keynote — VIP Pass", 50 units]*

> "A seller creates a drop — here, 50 VIP passes. Buyers anywhere in the world rush
> in at once. Instead of one inventory counter everyone fights over, every single
> unit is its own row in the database, and each buyer atomically claims a different
> one."

### 0:55–1:40 — The proof (the centerpiece: the Consistency Console)
*[Set buyers to 2000, click **Run stampede**]*

> "Let's prove it. Two thousand buyers, from five AWS regions, hitting this drop at
> once."

*[Console renders]*

> "**Zero oversold. Integrity: verified** — that's a live check confirming claimed
> units exactly equal what orders account for. Several thousand transactions per
> second, p99 latency in the low tens of milliseconds, and an **OCC retry rate near
> zero** — because each buyer claims a *random distinct* row, so Aurora DSQL's
> strong consistency holds with almost no contention. And look at the region
> breakdown — buyers in us-east-1, eu-west-1, ap-northeast-1 all hitting **one
> consistent inventory**. Overselling here isn't prevented by luck. It's impossible
> by design."

*[Briefly show the Seller Analytics strip: revenue, 100% sell-through, time-to-sellout]*

> "And it's a real product — live revenue, sell-through, and velocity for the seller."

### 1:35–2:10 — Why Aurora DSQL specifically
*[Screen: ARCHITECTURE.md diagram]*

> "Aurora DSQL is serverless, PostgreSQL-compatible, and multi-region active-active
> with strong consistency. A buyer in Tokyo and a buyer in Virginia both write to
> their nearest region, and the inventory count is correct everywhere, instantly —
> no replication lag window where you could oversell. The key engineering decision
> was modelling inventory as discrete rows so DSQL's optimistic concurrency stays
> fast instead of melting down on a hot counter."

### 2:10–2:35 — It's a real product
*[Screen: seller console + a normal single Buy]*

> "Sellers spin up a drop in seconds, watch live sales, and connect payments — it's
> a shippable flash-sale engine for any scarce resource: tickets, drops, even
> appointment or relief-supply slots."

### 2:35–2:50 — Close
*[Screen: the "Aurora DSQL · region" badge + Vercel URL]*

> "Front end on Vercel, data on Aurora DSQL, deployed with zero stored credentials.
> Zero oversells. Zero cold starts. Zero ops. That's DropZero."

---

## Shot checklist
- [ ] Home page with live drops
- [ ] Drop detail with countdown / remaining
- [ ] **Run stampede** result showing `oversold: 0` and `conflicts: 0` (the hero shot)
- [ ] Architecture diagram on screen while naming Aurora DSQL
- [ ] The "Aurora DSQL · <region>" badge (proves real DB, not preview)
- [ ] Vercel deployment URL visible
- [ ] Say "Amazon Aurora DSQL" out loud at least twice
