-- Run once in Neon SQL Editor (same DATABASE_URL as Vercel).
-- Idempotent: skips rows that already exist by name.

INSERT INTO offers (name, type, weight, active)
SELECT 'ad1', 'video', 1, true
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE name = 'ad1');

INSERT INTO offers (name, type, weight, active)
SELECT 'ad2', 'video', 1, true
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE name = 'ad2');

INSERT INTO offers (name, type, weight, active)
SELECT 'ad3', 'lp', 1, true
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE name = 'ad3');

INSERT INTO offers (name, type, weight, active)
SELECT 'ad4', 'code_lp', 1, true
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE name = 'ad4');

-- Optional: stop random assignment picking legacy Voluum names (normalize maps vid→ad1, lp→ad3 anyway).
-- Uncomment if those rows exist and you want only ad* in rotation:
-- UPDATE offers SET active = false WHERE name ~ '^(vid|lp)[0-9]+$';
