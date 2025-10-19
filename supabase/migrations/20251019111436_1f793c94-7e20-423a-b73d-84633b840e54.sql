-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create early_access_signups table
CREATE TABLE public.early_access_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'homepage_cta',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

-- Support tickets policies
CREATE POLICY "Anyone can submit support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view support tickets"
  ON public.support_tickets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update support tickets"
  ON public.support_tickets FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Early access policies
CREATE POLICY "Anyone can sign up for early access"
  ON public.early_access_signups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view early access signups"
  ON public.early_access_signups FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created ON public.support_tickets(created_at DESC);
CREATE INDEX idx_early_access_email ON public.early_access_signups(email);
CREATE INDEX idx_early_access_created ON public.early_access_signups(created_at DESC);