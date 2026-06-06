-- Bot-first acquisition: persist /start payload until Mini App /api/init consumes it.
-- Run before deploying code that writes telegram_start_attribution rows.

CREATE TABLE IF NOT EXISTS telegram_start_attribution (
  telegram_id BIGINT PRIMARY KEY,
  raw_start_param TEXT NOT NULL,
  cid TEXT,
  source TEXT,
  campaign TEXT,
  variant TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS telegram_start_attribution_unconsumed_idx
  ON telegram_start_attribution (telegram_id)
  WHERE consumed_at IS NULL;
