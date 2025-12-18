-- Create title_requests table for tracking title request/approval workflow
CREATE TABLE IF NOT EXISTS title_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quest_id TEXT NOT NULL,
    title_name TEXT NOT NULL,
    title_rarity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id),
    UNIQUE(profile_id, quest_id) -- Prevent duplicate requests for same quest
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_title_requests_profile_id ON title_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_title_requests_status ON title_requests(status);
