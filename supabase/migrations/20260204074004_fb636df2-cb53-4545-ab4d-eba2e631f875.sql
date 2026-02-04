-- Step 1: Add 'producer' to the app_role enum
-- This must be committed before being used
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'producer';