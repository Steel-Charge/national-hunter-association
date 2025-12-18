-- Change default settings to disable statsCalculator for new users
ALTER TABLE profiles 
ALTER COLUMN settings SET DEFAULT '{"statsCalculator": false, "theme": null}'::jsonb;

-- Update existing profiles to disable statsCalculator, except for Edgelord (admin)
UPDATE profiles 
SET settings = jsonb_set(settings, '{statsCalculator}', 'false')
WHERE name != 'Edgelord';

-- Explicitly ensure Lockjaw is not an admin
UPDATE profiles 
SET is_admin = FALSE 
WHERE name = 'Lockjaw';
