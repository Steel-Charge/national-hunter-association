-- Fix RLS policies for agencies table
-- This allows users to create agencies and manage their own agencies

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all agencies" ON agencies;
DROP POLICY IF EXISTS "Users can create agencies" ON agencies;
DROP POLICY IF EXISTS "Captains can update their agency" ON agencies;
DROP POLICY IF EXISTS "Captains can delete their agency" ON agencies;

-- Enable RLS on agencies table (if not already enabled)
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view all agencies (for browsing/joining)
CREATE POLICY "Users can view all agencies"
ON agencies FOR SELECT
USING (true);

-- Policy 2: Any authenticated user can create an agency
CREATE POLICY "Users can create agencies"
ON agencies FOR INSERT
WITH CHECK (true);

-- Policy 3: Captains can update their own agency
CREATE POLICY "Captains can update their agency"
ON agencies FOR UPDATE
USING (captain_id = auth.uid());

-- Policy 4: Captains can delete their own agency
CREATE POLICY "Captains can delete their agency"
ON agencies FOR DELETE
USING (captain_id = auth.uid());

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'agencies';
