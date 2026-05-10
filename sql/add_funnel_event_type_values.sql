-- Extend `event_type` for funnel analytics (run once per environment if not using `npm run db:push`).
-- Requires PostgreSQL 15+ for IF NOT EXISTS on ADD VALUE. Older PG: omit IF NOT EXISTS and run only once.

ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'funnel_gate_complete';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'prelander_view';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'prelander_complete';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'offer_watched';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'questionnaire_processing_shown';
