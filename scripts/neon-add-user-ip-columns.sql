-- Run on Neon if not using Drizzle push.
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_ip text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_ip text;
