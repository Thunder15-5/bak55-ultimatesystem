-- Fix security issue: Add search_path to handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix security issue: Add search_path to update_submission_vote_count function
CREATE OR REPLACE FUNCTION public.update_submission_vote_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.submissions
    SET vote_count = vote_count + 1
    WHERE id = NEW.submission_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.submissions
    SET vote_count = vote_count - 1
    WHERE id = OLD.submission_id;
  END IF;
  RETURN NULL;
END;
$function$;