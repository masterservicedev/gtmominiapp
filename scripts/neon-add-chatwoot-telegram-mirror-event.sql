-- Per-handoff Telegram inbox (977) mirror idempotency via events table.
-- Run once per environment before inserts use the new event type.

ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'chatwoot_telegram_summary_posted';
