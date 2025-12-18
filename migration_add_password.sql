-- Run this in Supabase SQL Editor to fix the 400 error
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password text NOT NULL DEFAULT 'default';
