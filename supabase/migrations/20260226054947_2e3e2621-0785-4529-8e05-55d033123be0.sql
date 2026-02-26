
-- Add voting_enabled flag to submissions for admin control
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS voting_enabled boolean DEFAULT true;

-- Create index for voting page queries
CREATE INDEX IF NOT EXISTS idx_submissions_voting ON public.submissions (competition_id, moderation_status, voting_enabled, vote_count DESC);

-- Trigger: When admin approves a submission, auto-set status to 'approved'
CREATE OR REPLACE FUNCTION public.auto_publish_approved_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When moderation_status changes to 'approved', auto-publish
  IF OLD.moderation_status = 'pending' AND NEW.moderation_status = 'approved' THEN
    NEW.status = 'approved';
    NEW.voting_enabled = true;
    NEW.vote_count = COALESCE(NEW.vote_count, 0);
    
    -- Send notification to artist about voting being live
    INSERT INTO notifications (user_id, type, title, message, link, priority, category)
    VALUES (
      NEW.artist_id,
      'submission_approved',
      '🎉 Your Song Is Live for Voting!',
      'Your song "' || NEW.title || '" has been approved and is now live on the Rising Stars Voting Page. Share it with fans to get votes!',
      '/rising-stars/voting',
      'high',
      'competition'
    );
  END IF;
  
  -- When rejected, ensure it stays hidden
  IF OLD.moderation_status = 'pending' AND NEW.moderation_status = 'rejected' THEN
    NEW.status = 'rejected';
    NEW.voting_enabled = false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop if exists to avoid conflict
DROP TRIGGER IF EXISTS trg_auto_publish_submission ON public.submissions;
CREATE TRIGGER trg_auto_publish_submission
  BEFORE UPDATE OF moderation_status ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_publish_approved_submission();
