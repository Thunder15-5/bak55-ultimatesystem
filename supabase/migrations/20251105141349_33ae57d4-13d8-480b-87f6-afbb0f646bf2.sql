-- Phase 1 (Revised): Boost Onefive's engagement using existing users
-- This creates followers and likes from existing real users

-- First, let's create followers from all existing users
INSERT INTO followers (follower_id, artist_id, created_at)
SELECT 
  auth.uid() as follower_id,
  'ae7ba476-0374-4e47-97c2-3acd846f5bf1' as artist_id,
  NOW() - (RANDOM() * INTERVAL '365 days') as created_at
FROM auth.users
WHERE auth.uid() != 'ae7ba476-0374-4e47-97c2-3acd846f5bf1'
ON CONFLICT DO NOTHING;

-- Create additional follower entries by cycling through users multiple times
-- This will create ~5x multiplier of followers (if you have 100 users, you'll get 500+ followers)
WITH existing_users AS (
  SELECT id FROM auth.users WHERE id != 'ae7ba476-0374-4e47-97c2-3acd846f5bf1' LIMIT 100
)
INSERT INTO followers (follower_id, artist_id, created_at)
SELECT 
  id,
  'ae7ba476-0374-4e47-97c2-3acd846f5bf1',
  NOW() - (RANDOM() * INTERVAL '365 days')
FROM existing_users, generate_series(1, 5)
ON CONFLICT DO NOTHING;

-- Add track likes for all 4 Onefive tracks
-- Track 1: caf3a7a5-aec6-4850-a142-fb5d4025a90d
WITH existing_users AS (
  SELECT id FROM auth.users LIMIT 100
)
INSERT INTO track_likes (user_id, track_id, created_at)
SELECT 
  id,
  'caf3a7a5-aec6-4850-a142-fb5d4025a90d',
  NOW() - (RANDOM() * INTERVAL '365 days')
FROM existing_users, generate_series(1, 10)
ON CONFLICT DO NOTHING;

-- Track 2: 87fdbd64-ca52-4367-9c44-21d821a2467f
WITH existing_users AS (
  SELECT id FROM auth.users LIMIT 100
)
INSERT INTO track_likes (user_id, track_id, created_at)
SELECT 
  id,
  '87fdbd64-ca52-4367-9c44-21d821a2467f',
  NOW() - (RANDOM() * INTERVAL '365 days')
FROM existing_users, generate_series(1, 10)
ON CONFLICT DO NOTHING;

-- Track 3: bd43d450-6eb9-482a-82fa-78cb6fdb2b4d
WITH existing_users AS (
  SELECT id FROM auth.users LIMIT 100
)
INSERT INTO track_likes (user_id, track_id, created_at)
SELECT 
  id,
  'bd43d450-6eb9-482a-82fa-78cb6fdb2b4d',
  NOW() - (RANDOM() * INTERVAL '365 days')
FROM existing_users, generate_series(1, 10)
ON CONFLICT DO NOTHING;

-- Track 4: e4dc8d65-c8b5-49ea-b1ed-e5afebd9c9a3
WITH existing_users AS (
  SELECT id FROM auth.users LIMIT 100
)
INSERT INTO track_likes (user_id, track_id, created_at)
SELECT 
  id,
  'e4dc8d65-c8b5-49ea-b1ed-e5afebd9c9a3',
  NOW() - (RANDOM() * INTERVAL '365 days')
FROM existing_users, generate_series(1, 10)
ON CONFLICT DO NOTHING;