-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Public agencies access" ON agencies FOR SELECT USING (true);

-- Create admin-only update policy
CREATE POLICY "Admin update agency" ON agencies FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Seed with Batch 3 data
INSERT INTO agencies (name, description, logo_url)
VALUES (
    'BATCH 3',
    'BATCH 3 WAS FORMED AS AWAY FOR THE NHA TO TRACK ALL THE SOLO HUNTERS, WE CANT LET SUCH POWER GO UNMONITERED',
    '/placeholder.png' -- Using placeholder as requested (app logo placeholder)
)
ON CONFLICT DO NOTHING;
