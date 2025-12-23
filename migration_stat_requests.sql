-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Hunter';

-- Update Edgelord to Admin (just in case)
UPDATE profiles SET role = 'Admin' WHERE name = 'Edgelord';

-- Create stat_requests table
CREATE TABLE IF NOT EXISTS stat_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    stat_name TEXT NOT NULL,
    new_value FLOAT NOT NULL,
    old_value FLOAT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    
    -- Optional: context/notes for the admin
    notes TEXT
);

-- RLS Policies for stat_requests
ALTER TABLE stat_requests ENABLE ROW LEVEL SECURITY;

-- 1. Hunters can view their own requests
CREATE POLICY "Users can view own stat requests" 
ON stat_requests FOR SELECT 
USING (auth.uid() = profile_id);

-- 2. Hunters can insert their own requests
CREATE POLICY "Users can insert own stat requests" 
ON stat_requests FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

-- 3. Admins and Captains can view all requests
-- (Note: In a real app, we'd check the role in the profiles table via a function or join)
-- For now, allowing all for select to keep it simple, but we'll restrict update
CREATE POLICY "Admins and Captains can view all stat requests" 
ON stat_requests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'Admin' OR role = 'Captain')
  )
);

-- 4. Only Admins and Captains can update (approve/deny) requests
CREATE POLICY "Only Admins and Captains can resolve stat requests" 
ON stat_requests FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'Admin' OR role = 'Captain')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'Admin' OR role = 'Captain')
  )
);
