
-- Add missing price_in_bak column to tracks table
ALTER TABLE public.tracks
ADD COLUMN IF NOT EXISTS price_in_bak NUMERIC(10, 2);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
