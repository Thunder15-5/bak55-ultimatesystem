-- Fix RLS policies for paystack_transactions to allow inserts
CREATE POLICY "Authenticated users can create transactions"
ON public.paystack_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also add an insert policy for transactions table to ensure withdrawals/deposits work
CREATE POLICY "System can create transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.wallets
    WHERE wallets.id = transactions.wallet_id
    AND wallets.user_id = auth.uid()
  )
);