-- Fix 8: nurture send retry tracking (run in Neon before deploy)
ALTER TABLE nurture_queue
ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
