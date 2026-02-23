-- Create weight_entries table
CREATE TABLE IF NOT EXISTS public.weight_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(profile_id, date)
);

-- Enable Row Level Security (Keeping it enabled for future but making it permissive for custom auth)
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own weight entries" ON public.weight_entries;
DROP POLICY IF EXISTS "Users can insert own weight entries" ON public.weight_entries;
DROP POLICY IF EXISTS "Users can update own weight entries" ON public.weight_entries;
DROP POLICY IF EXISTS "Users can delete own weight entries" ON public.weight_entries;

-- Create permissive policies (Since app uses custom table-based auth)
CREATE POLICY "Public view access" ON public.weight_entries FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.weight_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.weight_entries FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.weight_entries FOR DELETE USING (true);
