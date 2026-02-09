-- Add signup_bonus_awarded column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signup_bonus_awarded BOOLEAN DEFAULT FALSE;