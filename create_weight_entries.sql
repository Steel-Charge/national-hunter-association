-- Create weight_entries table
CREATE TABLE IF NOT EXISTS public.weight_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(profile_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only view their own weight entries
CREATE POLICY "Users can view own weight entries" 
ON public.weight_entries 
FOR SELECT 
USING (auth.uid() = profile_id);

-- Users can only insert their own weight entries
CREATE POLICY "Users can insert own weight entries" 
ON public.weight_entries 
FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

-- Users can only update their own weight entries
CREATE POLICY "Users can update own weight entries" 
ON public.weight_entries 
FOR UPDATE 
USING (auth.uid() = profile_id);

-- Users can only delete their own weight entries
CREATE POLICY "Users can delete own weight entries" 
ON public.weight_entries 
FOR DELETE 
USING (auth.uid() = profile_id);
