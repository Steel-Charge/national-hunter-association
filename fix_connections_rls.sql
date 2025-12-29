-- Fix RLS policies for connections table to work with custom auth system
-- The previous policies relied on auth.uid() which is null in this app.

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own connections or requests" ON connections;
DROP POLICY IF EXISTS "Users can send connection requests" ON connections;
DROP POLICY IF EXISTS "Users can accept connection requests" ON connections;
DROP POLICY IF EXISTS "Users can remove connections or decline requests" ON connections;
DROP POLICY IF EXISTS "Public connections access" ON connections; -- in case I ran it before

-- Enable RLS (stays enabled)
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Allow all operations (Select, Insert, Update, Delete) for everyone
-- Security is handled by the application logic since Supabase Auth is not used.
CREATE POLICY "Public connections access"
ON connections FOR ALL
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'connections';
