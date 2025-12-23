-- Add recovery info to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS otp TEXT,
ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP WITH TIME ZONE;

-- Seed Edgelord with a mock email for testing
UPDATE profiles SET email = 'edgelord@nha.gov' WHERE name = 'Edgelord';
