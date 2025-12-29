-- Create connections table
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- RLS Policies
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections"
ON connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add connections"
ON connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove connections"
ON connections FOR DELETE
USING (auth.uid() = user_id);
