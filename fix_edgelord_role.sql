-- Check current role
SELECT name, role, agency_id, is_admin 
FROM profiles 
WHERE name = 'Edgelord';

-- Update Edgelord to Solo role if not already
UPDATE profiles 
SET role = 'Solo', agency_id = NULL
WHERE name = 'Edgelord';

-- Verify the update
SELECT name, role, agency_id, is_admin 
FROM profiles 
WHERE name = 'Edgelord';
