-- Run once in Neon SQL Editor (same DATABASE_URL as Vercel).
-- Idempotent: skips rows that already exist by name.
-- `weight` is read by /api/init: higher weight = more likely among active offers (new users / no sticky).

INSERT INTO offers (name, type, weight, active)
SELECT 'ad4', 'code_lp', 1, true
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE name = 'ad4');

INSERT INTO offers (name, type, weight, active)
SELECT 'ad5', 'code_lp', 1, true
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE name = 'ad5');

-- Optional: stop random assignment picking legacy Voluum names.
-- Uncomment if those rows exist and you want only ad* in rotation:
-- UPDATE offers SET active = false WHERE name ~ '^(vid|lp)[0-9]+$';
