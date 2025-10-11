-- Add M-Pesa transaction support
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS mpesa_receipt_number TEXT,
ADD COLUMN IF NOT EXISTS mpesa_phone_number TEXT;

-- Add withdrawal fee tracking
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS withdrawal_fee NUMERIC DEFAULT 0;

-- Create admin notifications table for withdrawal approvals
CREATE TABLE IF NOT EXISTS admin_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  related_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id)
);

ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all tasks"
ON admin_tasks FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tasks"
ON admin_tasks FOR UPDATE
USING (has_role(auth.uid(), 'admin'));