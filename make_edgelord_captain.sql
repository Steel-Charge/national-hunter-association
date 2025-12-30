-- Transaction to safely promote Edgelord to Captain of his current agency

DO $$
DECLARE
    target_user_id UUID;
    target_agency_id UUID;
BEGIN
    -- 1. Get Edgelord's ID and Agency ID
    SELECT id, agency_id INTO target_user_id, target_agency_id
    FROM profiles
    WHERE name = 'Edgelord';

    -- Check if Edgelord exists and is in an agency
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User Edgelord not found.';
        RETURN;
    END IF;

    IF target_agency_id IS NULL THEN
        RAISE NOTICE 'Edgelord is not in an agency. Cannot make him captain.';
        RETURN;
    END IF;

    -- 2. Demote any existing captain in that agency to 'Hunter'
    UPDATE profiles
    SET role = 'Hunter'
    WHERE agency_id = target_agency_id 
    AND role = 'Captain' 
    AND id != target_user_id;

    -- 3. Promote Edgelord to 'Captain'
    UPDATE profiles
    SET role = 'Captain'
    WHERE id = target_user_id;

    -- 4. Update the agency's captain_id
    UPDATE agencies
    SET captain_id = target_user_id
    WHERE id = target_agency_id;

    RAISE NOTICE 'Edgelord successfully promoted to Captain of agency %', target_agency_id;

END $$;
