-- Transaction to reset Edgelord's data
BEGIN;

DO $$
DECLARE
    edgelord_id UUID;
BEGIN
    -- Get Edgelord's ID
    SELECT id INTO edgelord_id FROM profiles WHERE name = 'Edgelord';

    IF edgelord_id IS NULL THEN
        RAISE NOTICE 'Edgelord not found.';
        RETURN;
    END IF;

    -- 1. Clear Completed Quests
    DELETE FROM completed_quests WHERE profile_id = edgelord_id;

    -- 2. Clear Unlocked Titles (reset to default set)
    DELETE FROM unlocked_titles WHERE profile_id = edgelord_id;

    -- Insert Default Titles (from store.ts DEFAULT_PROFILE)
    INSERT INTO unlocked_titles (profile_id, name, rarity) VALUES
    (edgelord_id, 'Windrunner', 'Mythic'),
    (edgelord_id, 'Challenger of Storms', 'Legendary'),
    (edgelord_id, 'Streak of Lightning', 'Epic'),
    (edgelord_id, 'Fleet Foot', 'Rare'),
    (edgelord_id, 'Hunter', 'Common');

    -- 3. Reset Active Title and Frame in Profile
    UPDATE profiles 
    SET 
        active_title = '{"name": "Challenger of Storms", "rarity": "Legendary"}'::jsonb,
        active_frame = 'Legendary',
        unlocked_frames = ARRAY['Common', 'Rare', 'Epic', 'Legendary', 'Mythic']
    WHERE id = edgelord_id;

    RAISE NOTICE 'Edgelord titles, missions, and frame reset to default.';

END $$;

COMMIT;
