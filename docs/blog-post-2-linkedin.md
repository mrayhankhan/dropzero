# Bonus content #2 — LinkedIn post

> Publish on LinkedIn (public). Keep the hackathon-disclosure line. #H0Hackathon

---

I built a flash-sale engine that **cannot** oversell — even with thousands of people
buying in the same second, across regions. Here's the one design decision that made
it work. 👇

The naive way to prevent overselling is a single inventory counter you decrement on
every purchase. On a distributed SQL database that uses **optimistic concurrency
control** — like **Amazon Aurora DSQL** — that's the *worst* thing you can do:
thousands of writes to one row collide at commit time and you get a retry storm.

The fix flips it around. Instead of one hot counter, I model **every unit as its own
row**, and each buyer atomically claims a **random distinct** one. Now 5,000
simultaneous buyers touch ~5,000 *different* rows — exactly what DSQL is good at —
and overselling becomes mathematically impossible, because each row can be claimed
at most once.

I added a "stampede" button that fires thousands of concurrent purchases on demand.
The result, every time: the exact inventory sold, the rest cleanly rejected,
**zero oversold, near-zero conflicts.**

Stack: Next.js on Vercel + Amazon Aurora DSQL (serverless, multi-region, strongly
consistent), with keyless IAM auth via Vercel's OIDC integration — no database
passwords anywhere.

The lesson I'll keep: distributed databases don't remove the hard parts, they move
them into your data model. Turn one hot row into many cool rows and a scary
concurrency problem becomes a dozen lines of SQL.

*I created this content for the purpose of entering the H0: Hack the Zero Stack
hackathon. #H0Hackathon*

[link to live demo] · [link to repo]
