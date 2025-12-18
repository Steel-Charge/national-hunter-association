-- Reset titles and quests for Toto and Lockjaw
-- Run this in Supabase SQL Editor

-- 1. Reset Active Title to Hunter
UPDATE profiles 
SET active_title = '{"name": "Hunter", "rarity": "Common"}'::jsonb 
WHERE name IN ('Toto', 'Lockjaw');

-- 2. Delete all titles except Hunter
DELETE FROM unlocked_titles 
WHERE profile_id IN (SELECT id FROM profiles WHERE name IN ('Toto', 'Lockjaw'))
AND name != 'Hunter';

-- 3. Delete all completed quests
DELETE FROM completed_quests 
WHERE profile_id IN (SELECT id FROM profiles WHERE name IN ('Toto', 'Lockjaw'));
