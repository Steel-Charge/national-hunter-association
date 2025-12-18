-- Reset all hunters to only have the "Hunter" title
-- This will delete all unlocked titles and completed quests, then add back just the Hunter title

-- 1. Delete all completed quests
DELETE FROM completed_quests;

-- 2. Delete all unlocked titles
DELETE FROM unlocked_titles;

-- 3. Add "Hunter" title back for all profiles
INSERT INTO unlocked_titles (profile_id, name, rarity)
SELECT id, 'Hunter', 'Common'
FROM profiles;

-- 4. Set active title to "Hunter" for all profiles
UPDATE profiles
SET active_title = '{"name": "Hunter", "rarity": "Common"}'::jsonb;

-- 5. Optional: Clear any pending title requests
DELETE FROM title_requests;
