-- Give Edgelord back his Hunter title
INSERT INTO unlocked_titles (profile_id, name, rarity)
SELECT id, 'Hunter', 'Common'
FROM profiles
WHERE name = 'Edgelord'
ON CONFLICT DO NOTHING;

-- Also ensure Lockjaw doesn't have the quest completed for "Fleet Foot"
-- if he no longer has the title.
DELETE FROM completed_quests
WHERE profile_id IN (SELECT id FROM profiles WHERE name = 'Lockjaw')
AND quest_id = 'windrunner_1';
