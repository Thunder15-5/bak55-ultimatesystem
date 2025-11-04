-- Fix security warning: Add search_path to send_activation_email function
CREATE OR REPLACE FUNCTION send_activation_email()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username TEXT;
  _activation_code TEXT;
BEGIN
  -- Get username and activation code
  SELECT username, activation_code INTO _username, _activation_code
  FROM profiles
  WHERE id = NEW.id;
  
  -- Send activation email using the send-email edge function
  -- Note: This will be called asynchronously via pg_net
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'to', NEW.email,
        'subject', 'Activate Your BAK55 Account',
        'template', 'activation',
        'data', jsonb_build_object(
          'username', _username,
          'activation_code', _activation_code
        )
      )
    );
  
  RETURN NEW;
END;
$$;