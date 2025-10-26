-- Create role upgrades audit table
CREATE TABLE IF NOT EXISTS public.role_upgrades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_role app_role NOT NULL,
  to_role app_role NOT NULL,
  upgraded_at timestamp with time zone DEFAULT now() NOT NULL,
  reason text
);

-- Enable RLS
ALTER TABLE public.role_upgrades ENABLE ROW LEVEL SECURITY;

-- Users can view their own upgrades
CREATE POLICY "Users can view own upgrades" ON public.role_upgrades
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all upgrades
CREATE POLICY "Admins can view all upgrades" ON public.role_upgrades
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_upgrades_user_id ON public.role_upgrades(user_id);
CREATE INDEX IF NOT EXISTS idx_role_upgrades_upgraded_at ON public.role_upgrades(upgraded_at DESC);