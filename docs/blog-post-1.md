# Building an oversell-proof flash-sale engine on Amazon Aurora DSQL

> *I created this piece of content for the purpose of entering the H0: Hack the
> Zero Stack hackathon. #H0Hackathon*

**Bonus-points content draft.** Publish publicly (dev.to, Medium, LinkedIn,
builder.aws.com, or YouTube). Each public, non-unlisted piece is worth +0.2 (up to
+0.6). Add a screenshot or two and your live Vercel link before posting.

---

## The deceptively hard problem

"Don't sell more tickets than you have" sounds trivial until 10,000 people click
*Buy* in the same second. The naive fix — one `remaining` counter you decrement —
falls apart under load, and going multi-region makes it worse: with eventual
consistency you can oversell during the replication window.

I wanted a flash-sale engine that is **globally fast and strongly consistent and
operationally simple** — all three. That combination is exactly what **Amazon
Aurora DSQL** is built for, so I built **DropZero** on it for the hackathon.

## The trap I almost walked into

Aurora DSQL is a serverless, PostgreSQL-compatible, multi-region active-active SQL
database. Crucially, it uses **optimistic concurrency control (OCC)**: transactions
run without locks, and conflicts are caught at commit time — the loser gets a
`40001` serialization error and retries.

That detail flips the "obvious" design on its head. A single hot counter row that
every buyer updates is the **worst** workload for OCC: thousands of writes to one
key means thousands of conflicts and a retry storm. AWS's own guidance is explicit:
spread writes across the key range.

## The design that works

Instead of a counter, **model each sellable unit as its own row**:

```sql
CREATE TABLE drop_units (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id    uuid NOT NULL,
  unit_no    integer NOT NULL,
  status     text NOT NULL DEFAULT 'available',  -- available | claimed
  order_id   uuid,
  claimed_at timestamptz
);
```

Each buyer **claims a random distinct unit** in one strongly-consistent transaction:

```sql
-- find an available unit at a random offset, then claim it
UPDATE drop_units
   SET status = 'claimed', order_id = $order, claimed_at = now()
 WHERE id = $picked_unit_id AND status = 'available'
RETURNING unit_no;
```

Two things fall out of this for free:

1. **Overselling is impossible.** Each row goes `available → claimed` at most once,
   so `claimed ≤ total` always — regardless of region or traffic.
2. **Conflicts stay near zero.** Because buyers target *random* rows, 5,000
   simultaneous buyers touch ~5,000 different rows, which is DSQL's sweet spot. The
   few genuine collisions are retried transparently with jittered backoff.

I wrapped the transaction in a small `withRetry` that only retries `40001`, and
added an `idempotency_key` unique index so a double-click never double-buys.

## Proving it

DropZero ships with a stampede simulator that fires N concurrent purchases at one
drop. Firing **1,000 buyers at 200 units** returns: **200 confirmed, 800 rejected,
0 oversold, 0 conflicts** — and you can watch the same thing happen live in the UI.

## The stack

- **Frontend:** Next.js + Tailwind, deployed on **Vercel**.
- **Database:** **Amazon Aurora DSQL**, connected with the `pg` driver and IAM auth
  tokens via `@aws-sdk/dsql-signer` — no stored passwords. On Vercel, the
  Marketplace OIDC integration assumes an IAM role with zero secrets in the repo.

## Takeaway

DSQL removes the old trade-off between global scale and strong consistency — but
only if you design *with* its concurrency model. Turn your one hot row into many
cool rows, and a "hard" distributed-systems problem becomes a dozen lines of SQL.

*Live demo: `<your-vercel-url>` · Code: `<your-repo-url>`*
