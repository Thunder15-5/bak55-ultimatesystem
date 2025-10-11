-- Rename paystack_transactions to payment_transactions for generic use
ALTER TABLE public.paystack_transactions RENAME TO payment_transactions;

-- Add payment_provider column to track which provider was used
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'pesapal';

-- Rename paystack_reference to payment_reference for generic use
ALTER TABLE public.payment_transactions 
RENAME COLUMN paystack_reference TO payment_reference;

-- Update RLS policies to use new table name
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON public.payment_transactions;

CREATE POLICY "Admins can view all transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);