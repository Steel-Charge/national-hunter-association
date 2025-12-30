-- Transaction to reset Bob's data
BEGIN;

DO $$
DECLARE
    bob_id UUID;
BEGIN
    -- Get Bob's ID
    SELECT id INTO bob_id FROM profiles WHERE name = 'Bob';

    IF bob_id IS NULL THEN
        RAISE NOTICE 'Bob not found.';
        RETURN;
    END IF;

    -- 1. Clear Completed Quests
    DELETE FROM completed_quests WHERE profile_id = bob_id;

    -- 2. Clear Unlocked Titles (reset to default set)
    DELETE FROM unlocked_titles WHERE profile_id = bob_id;

    -- Insert Default Title
    INSERT INTO unlocked_titles (profile_id, name, rarity) VALUES
    (bob_id, 'Hunter', 'Common');

    -- 3. Reset Active Title and Frame in Profile
    UPDATE profiles 
    SET 
        active_title = '{"name": "Hunter", "rarity": "Common"}'::jsonb,
        active_frame = 'Common',
        unlocked_frames = ARRAY['Common']
    WHERE id = bob_id;

    RAISE NOTICE 'Bob titles, missions, and frame reset to default.';

END $$;

COMMIT;
