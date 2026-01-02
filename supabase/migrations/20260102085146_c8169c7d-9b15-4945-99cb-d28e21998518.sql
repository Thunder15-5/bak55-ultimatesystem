-- Add duration_days and target_role columns to subscription_plans
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS target_role text DEFAULT 'artist';

-- Update existing Artist Free plan with correct values
UPDATE public.subscription_plans 
SET duration_days = 0, target_role = 'artist', 
    features = '["1 track upload", "Basic analytics", "Standard moderation (72h)"]'::jsonb
WHERE name = 'Artist Free';

-- Update Artist Pro to Artist Monthly with new pricing
UPDATE public.subscription_plans 
SET name = 'Artist Monthly', 
    price_bak = 10, price_usd = 2.00, price_kes = 200,
    duration_days = 30, target_role = 'artist',
    features = '["Unlimited uploads", "Advanced analytics", "Priority moderation (24h)", "Competition entries"]'::jsonb
WHERE name = 'Artist Pro';

-- Update Artist Premium to Artist Yearly with new pricing
UPDATE public.subscription_plans 
SET name = 'Artist Yearly', 
    price_bak = 125, price_usd = 25.00, price_kes = 2500,
    duration_days = 365, target_role = 'artist',
    features = '["All Monthly features", "48% savings", "Premium badge", "Priority support", "Featured artist rotation"]'::jsonb
WHERE name = 'Artist Premium';

-- Insert new Artist Quarterly plan
INSERT INTO public.subscription_plans (name, price_bak, price_usd, price_kes, duration_days, target_role, upload_limit, features, is_active) VALUES
('Artist Quarterly', 30, 6.00, 600, 90, 'artist', -1, '["All Monthly features", "25% savings", "Featured placement boost", "Early access to new features"]'::jsonb, true);

-- Insert Fan subscription plans
INSERT INTO public.subscription_plans (name, price_bak, price_usd, price_kes, duration_days, target_role, upload_limit, features, is_active) VALUES
('Fan Daily', 1, 0.20, 20, 1, 'fan', 0, '["Daily streaming access", "Voting rights", "Basic discovery features"]'::jsonb, true),
('Fan Monthly', 10, 2.00, 200, 30, 'fan', 0, '["Unlimited streaming", "Premium voting features", "Early access to competitions", "Ad-free experience"]'::jsonb, true),
('Fan Yearly', 75, 15.00, 1500, 365, 'fan', 0, '["All Monthly features", "Exclusive badges", "Priority support", "Voting bonus multiplier", "Best value - save 38%"]'::jsonb, true);