-- Add is_hidden column to unlocked_titles table
ALTER TABLE unlocked_titles ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
