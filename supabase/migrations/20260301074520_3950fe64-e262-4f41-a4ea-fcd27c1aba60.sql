
-- Exchange rates table to cache rates from external API
CREATE TABLE public.exchange_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency text NOT NULL DEFAULT 'USD',
  target_currency text NOT NULL,
  rate numeric NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Anyone can read exchange rates
CREATE POLICY "Anyone can view exchange rates"
  ON public.exchange_rates FOR SELECT
  USING (true);

-- Only admins/service role can update
CREATE POLICY "Admins can manage exchange rates"
  ON public.exchange_rates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add preferred_currency column to profiles
ALTER TABLE public.profiles 
  ADD COLUMN preferred_currency text DEFAULT 'KES';

-- Seed initial exchange rates (USD base, approximate rates)
INSERT INTO public.exchange_rates (base_currency, target_currency, rate) VALUES
  ('USD', 'KES', 129.50),
  ('USD', 'NGN', 1550.00),
  ('USD', 'GHS', 15.80),
  ('USD', 'UGX', 3750.00),
  ('USD', 'TZS', 2650.00),
  ('USD', 'RWF', 1350.00),
  ('USD', 'ETB', 57.00),
  ('USD', 'ZAR', 18.20),
  ('USD', 'XOF', 610.00),
  ('USD', 'XAF', 610.00),
  ('USD', 'USD', 1.00);
