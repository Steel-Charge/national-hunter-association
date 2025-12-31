-- Add lore-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS affinities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS class_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mission_logs JSONB DEFAULT '[]'::jsonb;
