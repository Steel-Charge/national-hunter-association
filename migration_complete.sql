-- Consolidated migration for Profile Interview Features
-- Run this in your Supabase SQL Editor

-- 1. Add bio and manager_comment columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manager_comment text;

-- 2. Add video_url column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS video_url text;
