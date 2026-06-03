-- DropZero schema — Aurora DSQL flavor (paste straight into the DSQL query editor
-- in the AWS console). Same as db/schema.sql but with DSQL's CREATE INDEX ASYNC.
-- Run the whole thing once after your cluster is created.

CREATE TABLE IF NOT EXISTS drops (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  image_url   text,
  total       integer     NOT NULL,
  price_cents integer     NOT NULL DEFAULT 0,
  status      text        NOT NULL DEFAULT 'scheduled',
  starts_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drop_units (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id    uuid        NOT NULL,
  unit_no    integer     NOT NULL,
  status     text        NOT NULL DEFAULT 'available',
  order_id   uuid,
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

-- DSQL builds secondary indexes asynchronously:
CREATE INDEX ASYNC drop_units_lookup ON drop_units (drop_id, status, unit_no);
CREATE UNIQUE INDEX ASYNC orders_idem_uniq ON orders (idempotency_key);
CREATE INDEX ASYNC orders_drop_created ON orders (drop_id, created_at);
