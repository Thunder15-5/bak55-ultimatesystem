-- Update payment_transactions to support Selar
ALTER TABLE payment_transactions 
ALTER COLUMN payment_provider SET DEFAULT 'selar';

-- Add Selar-specific fields
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS selar_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS selar_customer_id TEXT,
ADD COLUMN IF NOT EXISTS selar_payment_link TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_selar_id 
ON payment_transactions(selar_transaction_id) WHERE selar_transaction_id IS NOT NULL;

COMMENT ON COLUMN payment_transactions.selar_transaction_id IS 'Selar unique transaction identifier';
COMMENT ON COLUMN payment_transactions.selar_customer_id IS 'Selar customer identifier';
COMMENT ON COLUMN payment_transactions.selar_payment_link IS 'Selar payment checkout URL';