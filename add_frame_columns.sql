ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS active_frame TEXT,
ADD COLUMN IF NOT EXISTS unlocked_frames TEXT[];

-- Update existing profiles to have 'Common' unlocked
UPDATE profiles 
SET unlocked_frames = ARRAY['Common'] 
WHERE unlocked_frames IS NULL;
