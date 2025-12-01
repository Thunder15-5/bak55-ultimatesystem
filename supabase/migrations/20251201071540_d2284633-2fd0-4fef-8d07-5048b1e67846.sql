-- Add display_name column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add price_usd column to subscription_plans table
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS price_usd NUMERIC DEFAULT 0;

-- Update subscription plans with USD pricing
-- Monthly: $2, Quarterly: $5, Yearly: $19
UPDATE subscription_plans 
SET price_usd = CASE 
  WHEN name = 'Artist Pro' THEN 2.00
  WHEN name = 'Artist Premium' THEN 5.00
  WHEN name = 'Artist Pro Yearly' THEN 19.00
  ELSE 0
END;