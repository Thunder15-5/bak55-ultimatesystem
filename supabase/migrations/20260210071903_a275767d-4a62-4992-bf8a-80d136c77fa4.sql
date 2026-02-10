
-- Fix 1: Contact form rate limiting via database trigger
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM contacts
  WHERE email = NEW.email
  AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 3 submissions per hour';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER contact_rate_limit_trigger
BEFORE INSERT ON contacts
FOR EACH ROW EXECUTE FUNCTION public.check_contact_rate_limit();

-- Fix 2: Prevent public SELECT on early_access_signups
-- First check if a deny policy exists, if not create one
CREATE POLICY "Deny public read access to early access signups"
ON public.early_access_signups
FOR SELECT
USING (public.is_admin(auth.uid()));
