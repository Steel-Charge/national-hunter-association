-- Create profiles table
create table profiles (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  password text not null,
  active_title jsonb,
  test_scores jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create unlocked_titles table
create table unlocked_titles (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  rarity text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create completed_quests table
create table completed_quests (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  quest_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table unlocked_titles enable row level security;
alter table completed_quests enable row level security;

-- Create policies (for now, allow public access since we don't have auth)
create policy "Public profiles access" on profiles for all using (true);
create policy "Public titles access" on unlocked_titles for all using (true);
create policy "Public quests access" on completed_quests for all using (true);
