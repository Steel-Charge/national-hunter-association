-- Disable RLS for stat_requests as the app uses custom profile-based login
-- rather than Supabase Auth (so auth.uid() is null).
ALTER TABLE stat_requests DISABLE ROW LEVEL SECURITY;

-- Also ensure Edgelord and others have the correct roles for testing
UPDATE profiles SET role = 'Admin' WHERE name = 'Edgelord';
UPDATE profiles SET role = 'Hunter' WHERE name NOT IN ('Edgelord');
