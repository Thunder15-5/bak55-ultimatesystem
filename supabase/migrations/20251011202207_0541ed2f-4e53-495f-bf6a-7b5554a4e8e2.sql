-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to automatically select competition winners when voting ends
CREATE OR REPLACE FUNCTION auto_select_competition_winners()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comp_record RECORD;
BEGIN
  -- Find competitions where voting has ended but winners haven't been selected
  FOR comp_record IN
    SELECT id, title, prize_amount
    FROM competitions
    WHERE voting_end_date < NOW()
      AND status = 'active'
  LOOP
    -- Call the winner selection function
    PERFORM calculate_submission_final_scores(comp_record.id);
    
    -- Update competition status
    UPDATE competitions
    SET status = 'completed'
    WHERE id = comp_record.id;
    
    -- Get top 3 winners
    WITH winners AS (
      SELECT 
        s.id,
        s.artist_id,
        s.title as track_title,
        s.final_score,
        ROW_NUMBER() OVER (ORDER BY s.final_score DESC) as position
      FROM submissions s
      WHERE s.competition_id = comp_record.id
        AND s.status = 'approved'
      ORDER BY s.final_score DESC
      LIMIT 3
    )
    -- Distribute prizes: 50% to 1st, 30% to 2nd, 20% to 3rd
    INSERT INTO transactions (wallet_id, type, amount, description, reference_id, metadata)
    SELECT 
      w.id,
      'income',
      CASE 
        WHEN winners.position = 1 THEN comp_record.prize_amount * 0.5
        WHEN winners.position = 2 THEN comp_record.prize_amount * 0.3
        WHEN winners.position = 3 THEN comp_record.prize_amount * 0.2
      END,
      'Competition prize - ' || comp_record.title || ' (Position ' || winners.position || ')',
      comp_record.id,
      jsonb_build_object(
        'competition_id', comp_record.id,
        'position', winners.position,
        'final_score', winners.final_score,
        'prize_percentage', CASE 
          WHEN winners.position = 1 THEN 50
          WHEN winners.position = 2 THEN 30
          WHEN winners.position = 3 THEN 20
        END
      )
    FROM winners
    INNER JOIN wallets w ON w.user_id = winners.artist_id;
    
    -- Update wallet balances
    UPDATE wallets w
    SET balance = balance + (
      SELECT CASE 
        WHEN winners.position = 1 THEN comp_record.prize_amount * 0.5
        WHEN winners.position = 2 THEN comp_record.prize_amount * 0.3
        WHEN winners.position = 3 THEN comp_record.prize_amount * 0.2
      END
      FROM (
        SELECT 
          s.artist_id,
          ROW_NUMBER() OVER (ORDER BY s.final_score DESC) as position
        FROM submissions s
        WHERE s.competition_id = comp_record.id
          AND s.status = 'approved'
        ORDER BY s.final_score DESC
        LIMIT 3
      ) winners
      WHERE winners.artist_id = w.user_id
    )
    WHERE w.user_id IN (
      SELECT s.artist_id
      FROM submissions s
      WHERE s.competition_id = comp_record.id
        AND s.status = 'approved'
      ORDER BY s.final_score DESC
      LIMIT 3
    );
    
    -- Create notifications for winners
    INSERT INTO notifications (user_id, type, title, message, link)
    SELECT 
      winners.artist_id,
      'competition_win',
      '🎉 You Won a Competition!',
      'Congratulations! You placed #' || winners.position || ' in "' || comp_record.title || '"',
      '/competition/' || comp_record.id
    FROM (
      SELECT 
        s.artist_id,
        ROW_NUMBER() OVER (ORDER BY s.final_score DESC) as position
      FROM submissions s
      WHERE s.competition_id = comp_record.id
        AND s.status = 'approved'
      ORDER BY s.final_score DESC
      LIMIT 3
    ) winners;
    
    RAISE NOTICE 'Winners selected for competition: %', comp_record.title;
  END LOOP;
END;
$$;

-- Schedule the function to run every hour
-- Note: This requires the pg_cron extension to be enabled
SELECT cron.schedule(
  'auto-select-winners',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT auto_select_competition_winners()$$
);

-- Create notification trigger function for new tips
CREATE OR REPLACE FUNCTION notify_tip_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    NEW.to_artist_id,
    'tip',
    '💝 New Tip Received!',
    'You received ' || NEW.amount || ' BAKCoins from a fan',
    '/wallet'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_tip_received
AFTER INSERT ON tips
FOR EACH ROW
EXECUTE FUNCTION notify_tip_received();

-- Create notification trigger for new followers
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    NEW.artist_id,
    'follow',
    '👥 New Follower',
    'Someone started following you!',
    '/profile'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_follower
AFTER INSERT ON followers
FOR EACH ROW
EXECUTE FUNCTION notify_new_follower();

-- Create notification trigger for new comments
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  track_artist_id UUID;
BEGIN
  -- Get the artist who owns the track
  SELECT artist_id INTO track_artist_id
  FROM tracks
  WHERE id = NEW.track_id;
  
  -- Only notify if commenter is not the track owner
  IF track_artist_id IS NOT NULL AND track_artist_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      track_artist_id,
      'comment',
      '💬 New Comment',
      'Someone commented on your track',
      '/track/' || NEW.track_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_new_comment();