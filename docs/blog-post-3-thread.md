# Bonus content #3 — X / Twitter thread

> Post as a public thread. Include the disclosure line + #H0Hackathon. Add a screen
> recording of the stampede for reach.

---

**1/**
I made a flash-sale app that's physically incapable of overselling — even under a
1,000-buyers-at-once stampede. Built on Amazon Aurora DSQL + Vercel for
#H0Hackathon. The trick is one data-model decision 🧵

**2/**
The on-sale problem: thousands buy in the same second, the system loses count, and
people get "confirmed → actually sold out" emails. Overselling = refunds,
chargebacks, angry fans.

**3/**
The naive fix: one `remaining` counter you decrement per sale. On a distributed SQL
DB with optimistic concurrency (Aurora DSQL), that single hot row is the worst case
— every buyer fights for the same row → serialization conflicts → retry storm.

**4/**
The fix: don't store a count. Store **one row per unit**. Each buyer atomically
claims a *random distinct* unsold row. 5,000 buyers → ~5,000 different rows → almost
no conflicts. And the count can't exceed N because each row is claimed at most once.

**5/**
So I added a "Run stampede" button. 1,000 concurrent buyers on 200 units →
✅ 200 confirmed
✅ 800 cleanly rejected
✅ 0 oversold
✅ 0 OCC conflicts
…in single-digit ms.

**6/**
Why Aurora DSQL: serverless, PostgreSQL-compatible, multi-region active-active, and
strongly consistent — so a buyer in Tokyo and one in Virginia hit one correct
inventory with no replication-lag oversell window.

**7/**
Bonus: zero stored DB passwords. Vercel's OIDC integration assumes an AWS IAM role
and mints short-lived auth tokens per connection.

**8/**
Takeaway: distributed databases don't delete the hard parts — they push them into
your schema. One hot row → many cool rows, and the problem dissolves.

Demo + code 👇  *I created this content for the purpose of entering the H0: Hack the
Zero Stack hackathon.* #H0Hackathon
