-- Drop the unique constraint to allow unlimited voting per user per submission
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_submission_id_voter_id_key;