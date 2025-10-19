-- Add admin RLS policies for payment_transactions
CREATE POLICY "Admins can update payment_transactions" ON public.payment_transactions
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Add admin RLS policies for wallets
CREATE POLICY "Admins can update wallets" ON public.wallets
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Add admin RLS policies for transactions
CREATE POLICY "Admins can insert transactions" ON public.transactions
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update transactions" ON public.transactions
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Add admin RLS policies for competitions
CREATE POLICY "Admins can delete competitions" ON public.competitions
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Add admin RLS policies for profiles
CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Update notification functions to use admin email
CREATE OR REPLACE FUNCTION public.notify_new_follower_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_email TEXT;
  follower_username TEXT;
BEGIN
  SELECT email INTO artist_email
  FROM profiles
  WHERE id = NEW.artist_id;

  SELECT username INTO follower_username
  FROM profiles
  WHERE id = NEW.follower_id;

  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT id, 'follow', 'New Follower Alert', follower_username || ' started following an artist (' || artist_email || ')', '/artist/' || NEW.artist_id
  FROM profiles
  WHERE email = 'admin@bak55talent.co.ke';

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_track_upload_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_username TEXT;
  artist_email TEXT;
BEGIN
  SELECT username, email INTO artist_username, artist_email
  FROM profiles
  WHERE id = NEW.artist_id;

  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT id, 'upload', 'New Track Uploaded', 'Track "' || NEW.title || '" by ' || artist_username || ' (' || artist_email || ')', '/track/' || NEW.id
  FROM profiles
  WHERE email = 'admin@bak55talent.co.ke';

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_tip_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_email TEXT;
  artist_username TEXT;
  tipper_username TEXT;
BEGIN
  SELECT username, email INTO artist_username, artist_email
  FROM profiles
  WHERE id = NEW.to_artist_id;

  SELECT username INTO tipper_username
  FROM profiles
  WHERE id = NEW.from_user_id;

  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT id, 'tip', 'New Tip Transaction', tipper_username || ' tipped ' || NEW.amount || ' BAKCoins to ' || artist_username || ' (' || artist_email || ')', '/wallet'
  FROM profiles
  WHERE email = 'admin@bak55talent.co.ke';

  RETURN NEW;
END;
$$;