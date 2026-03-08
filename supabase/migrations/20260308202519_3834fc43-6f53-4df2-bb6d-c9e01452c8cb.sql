
-- Sprint 1.1: Fan Club Content Gating
-- Add exclusive content columns to tracks
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS is_exclusive boolean DEFAULT false;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS required_tier_level integer DEFAULT 0;

-- Create index for exclusive content queries
CREATE INDEX IF NOT EXISTS idx_tracks_exclusive ON public.tracks (is_exclusive, artist_id) WHERE is_exclusive = true;

-- Sprint 1.2: Withdrawal status tracking improvements
-- Add withdrawal_status column to admin_tasks for better tracking
ALTER TABLE public.admin_tasks ADD COLUMN IF NOT EXISTS withdrawal_status text DEFAULT 'pending';

-- Sprint 1.4: Webhook replay attack prevention
-- Add unique constraint on payment_reference to prevent duplicate processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_unique_ref 
ON public.payment_transactions (payment_reference) 
WHERE payment_reference IS NOT NULL;

-- Performance indexes for Sprint 1
CREATE INDEX IF NOT EXISTS idx_votes_submission_id ON public.votes (submission_id);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_moderation ON public.tracks (artist_id, moderation_status);
CREATE INDEX IF NOT EXISTS idx_followers_artist_id ON public.followers (artist_id);
CREATE INDEX IF NOT EXISTS idx_fan_club_memberships_lookup ON public.fan_club_memberships (fan_id, artist_id, status);
