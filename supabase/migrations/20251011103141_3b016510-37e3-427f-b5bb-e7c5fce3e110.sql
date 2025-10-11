-- Create contacts table for contact form submissions
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit contact forms
CREATE POLICY "Anyone can submit contact forms"
ON public.contacts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view contacts
CREATE POLICY "Admins can view contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));