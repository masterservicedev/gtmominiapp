-- Phase 1 fix for re-engagement: ensure the Telegram inbox (977) receives
-- a fresh agent-visible reactivation lead card whenever a user reactivates,
-- not only on the original first handoff.
--
-- Per-offer idempotency lock. A `broadcast_offers` row whose
-- `chatwoot_reactivation_card_posted_at` is still NULL is treated as a
-- pending Telegram reactivation card; when the user's next inbound Telegram
-- message arrives, the webhook handler drains and posts it exactly once.

ALTER TABLE broadcast_offers
  ADD COLUMN IF NOT EXISTS chatwoot_reactivation_card_posted_at TIMESTAMP;
