-- Phase 1 of the dual-inbox handoff fix.
--
-- Adds dedicated columns for the API inbox (976) and Telegram inbox (977)
-- conversations so we can pre-bind a canonical Chatwoot contact to inbox 977
-- before any Telegram inbound message arrives, and post the agent-facing
-- summary note idempotently when that conversation appears.
--
-- The legacy `chatwoot_conversation_id` column is intentionally left
-- unchanged. It continues to hold the API inbox conversation id so that
-- existing webhook fallback lookups keep working during rollout.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS chatwoot_api_conversation_id TEXT,
  ADD COLUMN IF NOT EXISTS chatwoot_telegram_conversation_id TEXT,
  ADD COLUMN IF NOT EXISTS chatwoot_telegram_summary_posted_at TIMESTAMP;
