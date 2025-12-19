-- Seed data for Edgelord, Toto, and Lockjaw
-- Run this in Supabase SQL Editor
-- This script is idempotent: it will update existing users and skip existing titles/quests.

DO $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- ==========================================
  -- 1. Edgelord
  -- ==========================================
  INSERT INTO profiles (name, password, active_title, test_scores)
  VALUES (
    'Edgelord', 
    'Qwerty1', 
    '{"name": "Challenger of Storms", "rarity": "Legendary"}', 
    '{
      "Squat": 0,
      "Burpees": 7,
      "Deadlift": 60,
      "Pull-ups": 1,
      "Push-ups": 30,
      "1-mile run": 0,
      "Bench Press": 60,
      "Plank Hold": 1.37,
      "100m Sprint": 17.6,
      "40-yard Dash": 6.1,
      "Pro Agility Shuttle": 8.3
    }'
  )
  ON CONFLICT (name) DO UPDATE SET
    password = EXCLUDED.password,
    active_title = EXCLUDED.active_title,
    test_scores = EXCLUDED.test_scores
  RETURNING id INTO v_profile_id;

  -- Insert Titles (if not exist)
  INSERT INTO unlocked_titles (profile_id, name, rarity)
  SELECT v_profile_id, t.name, t.rarity 
  FROM (VALUES 
    ('Windrunner', 'Mythic'),
    ('Challenger of Storms', 'Legendary'),
    ('Streak of Lightning', 'Epic'),
    ('Fleet Foot', 'Rare'),
    ('Hunter', 'Common')
  ) AS t(name, rarity)
  WHERE NOT EXISTS (
    SELECT 1 FROM unlocked_titles ut WHERE ut.profile_id = v_profile_id AND ut.name = t.name
  );

  -- Insert Quests (if not exist)
  INSERT INTO completed_quests (profile_id, quest_id)
  SELECT v_profile_id, q.quest_id 
  FROM (VALUES 
    ('windrunner_1'),
    ('windrunner_2'),
    ('windrunner_3'),
    ('windrunner_mythic')
  ) AS q(quest_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM completed_quests cq WHERE cq.profile_id = v_profile_id AND cq.quest_id = q.quest_id
  );

  -- ==========================================
  -- 2. Toto
  -- ==========================================
  INSERT INTO profiles (name, password, active_title, test_scores)
  VALUES (
    'Toto', 
    'Password1', 
    '{"name": "Hunter", "rarity": "Common"}', 
    '{
      "Squat": 100,
      "Burpees": 1,
      "Deadlift": 0,
      "Pull-ups": 0,
      "Push-ups": 0,
      "1-mile run": 0,
      "Bench Press": 60,
      "Plank Hold": 0.32,
      "100m Sprint": 19.05,
      "40-yard Dash": 6.45,
      "Pro Agility Shuttle": 6.9
    }'
  )
  ON CONFLICT (name) DO UPDATE SET
    password = EXCLUDED.password,
    active_title = EXCLUDED.active_title,
    test_scores = EXCLUDED.test_scores
  RETURNING id INTO v_profile_id;

  -- Insert Titles
  INSERT INTO unlocked_titles (profile_id, name, rarity)
  SELECT v_profile_id, 'Hunter', 'Common'
  WHERE NOT EXISTS (
    SELECT 1 FROM unlocked_titles ut WHERE ut.profile_id = v_profile_id AND ut.name = 'Hunter'
  );

  -- ==========================================
  -- 3. Lockjaw
  -- ==========================================
  INSERT INTO profiles (name, password, active_title, test_scores)
  VALUES (
    'Lockjaw', 
    'Password2', 
    '{"name": "Hunter", "rarity": "Common"}', 
    '{
      "Squat": 50,
      "Burpees": 1,
      "Deadlift": 0,
      "Pull-ups": 0,
      "Push-ups": 13,
      "1-mile run": 0,
      "Bench Press": 40,
      "Plank Hold": 0.39,
      "100m Sprint": 18.2,
      "40-yard Dash": 6.9,
      "Pro Agility Shuttle": 7.5
    }'
  )
  ON CONFLICT (name) DO UPDATE SET
    password = EXCLUDED.password,
    active_title = EXCLUDED.active_title,
    test_scores = EXCLUDED.test_scores
  RETURNING id INTO v_profile_id;

  -- Insert Titles
  INSERT INTO unlocked_titles (profile_id, name, rarity)
  SELECT v_profile_id, 'Hunter', 'Common'
  WHERE NOT EXISTS (
    SELECT 1 FROM unlocked_titles ut WHERE ut.profile_id = v_profile_id AND ut.name = 'Hunter'
  );

END $$;
