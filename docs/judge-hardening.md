# Judge-hardening checklist — "what will they poke at?"

Honest list of the places a sharp judge (this panel = AWS Database experts) will
probe, the real gap today, and exactly what to do or say. Fix the 🔴 items before
submitting; have an answer ready for the rest.

---

## 🔴 Must-fix before submitting

### 1. "Is this *actually* on Aurora DSQL, or mocked?"
- **Gap:** in preview mode the badge says "Preview · in-memory" and regions are
  illustrative. A judge testing a preview URL sees a mock.
- **Fix:** deploy on a real DSQL cluster so the badge reads **"Aurora DSQL · region"**.
  In the video, create a drop live and refresh to show it persists. Attach the
  **Storage configuration screenshot** (required) proving the integration.

### 2. "Is it really multi-region, or is that a label?"
- **Gap:** the region breakdown in the console is *simulated* (random region tags)
  unless you actually run two linked DSQL clusters. Claiming "multi-region active-
  active" while running one region is the kind of overclaim this panel will catch.
- **Fix (best):** do the real 2-region deploy in `docs/multi-region.md` and demo
  both. **Or (honest):** say in the video "regions here are illustrative; the
  architecture and DSQL support active-active across linked clusters" — and show
  the code/arch diagram. **Do not state it's running two regions if it isn't.**

### 3. Repo proves real work during the submission window
- **Gap:** rules let judges request evidence of work done during the period.
- **Fix:** the git history + README "Built during the submission period" section
  cover this. Keep commits; don't squash away the story.

---

## 🟡 Have a confident answer ready

### 4. "A single hot counter would melt DSQL under load."
- **Answer:** exactly — that's why inventory is **N discrete rows**, each claimed at
  a random offset, so writes spread across the key range. Show the console's
  **OCC retry rate ≈ 0%** under thousands of buyers. This is your strongest moment.

### 5. "What if a buyer pays but the unit just sold out?"
- **Answer:** checkout uses **authorize → claim → capture** (`capture_method: manual`).
  If the claim fails, we **cancel the authorization** — the buyer is never charged
  for inventory we couldn't fulfill. (See `app/api/checkout/route.ts`.)

### 6. "Double-click / retries = double purchase?"
- **Answer:** every order carries an **idempotency key** with a unique index; a
  replay returns the same order. Safe retries by design.

### 7. "Counting available units per read won't scale to millions."
- **Answer:** correct — `COUNT(available)` is fine at demo scale; at true millions
  you'd maintain an **approximate counter via DSQL's CDC stream** rather than a hot
  counter. It's called out in `ARCHITECTURE.md` as planned work. (Honesty about the
  scaling path scores better than pretending it's free.)

### 8. "DSQL has no foreign keys / JSON / triggers — did you hit that?"
- **Answer:** yes, deliberately designed around it — logical references in app
  code, no JSON columns, PKs inline, and `db/init.ts` rewrites indexes to
  `CREATE INDEX ASYNC`. Schema mints units in batches under the **10k-rows/txn** limit.

### 9. "Where are the database credentials?"
- **Answer:** there are none. Vercel **OIDC** assumes an AWS IAM role; `DsqlSigner`
  mints a short-lived IAM token per connection. Nothing in the public repo.

### 10. "Cost at scale?"
- **Answer:** serverless, scales to zero, billed per DPU + GB-month. The simulator
  is **capped at 5,000 buyers** to bound demo spend; the free tier covers a
  hackathon's worth of runs.

---

## ⚪ Known limitations (acknowledge if asked — don't oversell as "done")

- **No seller/buyer auth.** Anyone can create or change drops — it's an open demo.
  Production needs seller accounts + RBAC (NextAuth/Cognito). Say this plainly.
- **No real fulfillment** (issuing the actual ticket/QR/code) or buyer receipts/email.
- **Payments are test-mode** (no Stripe Connect payouts / refunds UI).
- **No rate limiting / abuse controls** on the public endpoints.
- **Accessibility & mobile** are decent (responsive, semantic) but not audited.

These are fine for a hackathon **demo**; just don't claim it's production-ready for
paying customers. "A working foundation with a clear path to production" is the
honest, score-positive framing.

---

## Pre-demo smoke test (run on the LIVE deployment, right before recording)
- [ ] Badge reads **"Aurora DSQL · region"** (not Preview).
- [ ] Create a drop in the seller console → refresh → it persists.
- [ ] Run a stampede → **oversold 0**, **integrity verified**, low retry rate.
- [ ] Do one normal Buy → it appears in the live activity feed with a region tag.
- [ ] Seller analytics show real revenue / sell-through.
- [ ] `npm run build` passes; no console errors in the browser.
- [ ] The public repo link works and contains no secrets.

## Don't-overclaim list (protects credibility with this panel)
- Don't say "running active-active in N regions" unless you actually deployed them.
- Don't say "handles millions today" — say "architected to scale to millions."
- Don't say "production-ready" — say "a shippable foundation."
