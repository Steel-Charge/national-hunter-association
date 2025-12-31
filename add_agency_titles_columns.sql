-- Add unlocked_titles and title_visibility to agencies table
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS unlocked_titles JSONB DEFAULT '[]'::jsonb;

ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS title_visibility JSONB DEFAULT '{}'::jsonb;
