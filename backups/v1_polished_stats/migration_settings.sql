-- Add avatar_url and settings columns to profiles table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{"statsCalculator": true, "theme": null}'::jsonb;

-- Update existing profiles with default settings
UPDATE profiles 
SET settings = '{"statsCalculator": true, "theme": null}'::jsonb 
WHERE settings IS NULL;
