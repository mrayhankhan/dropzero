-- DropZero schema — designed for Aurora DSQL (also runs on Aurora PostgreSQL).
--
-- KEY DESIGN DECISION (this is the whole technical story):
-- Inventory is NOT a single `remaining` counter. A single hot counter row that
-- every buyer decrements is the worst case for Aurora DSQL's optimistic
-- concurrency control (OCC): thousands of writes to one key => serialization
-- conflicts (SQLSTATE 40001) and a retry storm. AWS's own guidance is to spread
-- writes across the key range using random keys.
--
-- So inventory is modelled as N DISCRETE UNIT ROWS (one per item). Each buyer
-- atomically claims a *random distinct* unsold row. 5,000 concurrent buyers then
-- touch ~5,000 different rows — DSQL's sweet spot — and the count can still never
-- exceed N, because each unit row can be claimed at most once. Zero oversell,
-- near-zero contention.
--
-- DSQL compatibility notes (deliberate, not omissions):
--   * No FOREIGN KEYs / JSON / triggers / views — unsupported in DSQL.
--   * Primary keys declared inline at CREATE TABLE (required by DSQL).
--   * gen_random_uuid() is built into PostgreSQL 14+ (no extension needed).
--   * Secondary indexes use `CREATE INDEX ASYNC` on DSQL; db/init.ts rewrites the
--     statements below automatically when it detects a DSQL endpoint.

CREATE TABLE IF NOT EXISTS drops (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  image_url   text,
  total       integer     NOT NULL,                      -- units minted for this drop
  price_cents integer     NOT NULL DEFAULT 0,
  status      text        NOT NULL DEFAULT 'scheduled',  -- scheduled | live | sold_out | ended
  starts_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- One row per sellable unit. `remaining` is derived from COUNT(status='available'),
-- never stored as a decremented counter.
CREATE TABLE IF NOT EXISTS drop_units (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id    uuid        NOT NULL,                 -- logical ref -> drops.id (no FK in DSQL)
  unit_no    integer     NOT NULL,                 -- 1..total, used to target random keys
  status     text        NOT NULL DEFAULT 'available', -- available | claimed
  order_id   uuid,                                 -- set when claimed
  claimed_at timestamptz
);

CREATE TABLE IF NOT EXISTS orders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id         uuid        NOT NULL,
  buyer_email     text        NOT NULL,
  qty             integer     NOT NULL,
  amount_cents    integer     NOT NULL,
  idempotency_key text        NOT NULL,
  region          text,
  status          text        NOT NULL DEFAULT 'confirmed',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Supports: "find a random available unit at/after unit_no" + counting availability.
CREATE INDEX IF NOT EXISTS drop_units_lookup ON drop_units (drop_id, status, unit_no);

-- Idempotency guard: a given key can only ever create one order (safe retries).
CREATE UNIQUE INDEX IF NOT EXISTS orders_idem_uniq ON orders (idempotency_key);

-- Fast per-drop activity feed.
CREATE INDEX IF NOT EXISTS orders_drop_created ON orders (drop_id, created_at);
