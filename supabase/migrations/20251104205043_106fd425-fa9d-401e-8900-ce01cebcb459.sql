-- Create function to send activation email (called from trigger)
CREATE OR REPLACE FUNCTION send_activation_email()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to send activation email after profile is created
DROP TRIGGER IF EXISTS send_activation_email_trigger ON profiles;
CREATE TRIGGER send_activation_email_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.activation_code IS NOT NULL AND NEW.is_activated = FALSE)
  EXECUTE FUNCTION send_activation_email();