-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set Edgelord as admin
UPDATE profiles SET is_admin = TRUE WHERE name = 'Edgelord';

-- Ensure other users are not admins (optional, but good for consistency)
UPDATE profiles SET is_admin = FALSE WHERE name != 'Edgelord';
