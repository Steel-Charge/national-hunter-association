-- Add status column
ALTER TABLE connections ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Drop old policies to recreate
DROP POLICY IF EXISTS "Users can view their own connections" ON connections;
DROP POLICY IF EXISTS "Users can add connections" ON connections;
DROP POLICY IF EXISTS "Users can remove connections" ON connections;

-- New RLS Policies
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections or requests"
ON connections FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send connection requests"
ON connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can accept connection requests"
ON connections FOR UPDATE
USING (auth.uid() = friend_id);

CREATE POLICY "Users can remove connections or decline requests"
ON connections FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);
