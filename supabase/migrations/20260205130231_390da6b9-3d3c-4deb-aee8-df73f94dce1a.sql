-- Create email_templates table for admin template management
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Create email_campaigns table for automated campaigns
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.email_templates(id),
  trigger_type TEXT NOT NULL, -- 'signup', 'profile_incomplete', 'first_upload', 'competition_entry', etc.
  delay_hours INTEGER DEFAULT 0, -- hours after trigger to send
  target_roles TEXT[] DEFAULT '{}', -- empty = all roles
  is_active BOOLEAN DEFAULT true,
  send_count INTEGER DEFAULT 0,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create email_queue table for pending emails
CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create email_sent_log table for tracking
CREATE TABLE public.email_sent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resend_id TEXT,
  status TEXT DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sent_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for admins only
CREATE POLICY "Admins can manage email templates"
ON public.email_templates FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage email campaigns"
ON public.email_campaigns FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view email queue"
ON public.email_queue FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view email logs"
ON public.email_sent_log FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default welcome campaign templates
INSERT INTO public.email_templates (name, subject, description, html_content, variables, category) VALUES
('welcome', 'Welcome to BAK55 Talent! 🎵', 'Welcome email sent after signup', 
 '<h1>Welcome {{username}}!</h1><p>Start your music journey today.</p>', 
 ARRAY['username', 'role', 'dashboard_link'], 'onboarding'),
 
('profile_reminder', 'Complete Your Profile ✨', 'Reminder to complete profile', 
 '<h1>Hi {{username}}</h1><p>Complete your profile to get discovered!</p>', 
 ARRAY['username', 'profile_link', 'missing_items'], 'onboarding'),
 
('first_upload_guide', 'Ready to Upload Your Music? 🎤', 'Guide for first upload', 
 '<h1>Share Your Music</h1><p>Upload your first track and reach thousands.</p>', 
 ARRAY['username', 'upload_link'], 'onboarding'),
 
('competition_guide', 'Win Big in Competitions! 🏆', 'Introduction to competitions', 
 '<h1>Enter to Win</h1><p>Compete and win BAKCoins!</p>', 
 ARRAY['username', 'competitions_link'], 'onboarding'),
 
('monetization_guide', 'Start Earning with Your Music 💰', 'Monetization introduction', 
 '<h1>Earn from Your Talent</h1><p>Tips, competitions, and more!</p>', 
 ARRAY['username', 'wallet_link'], 'onboarding');

-- Insert default campaigns
INSERT INTO public.email_campaigns (name, trigger_type, delay_hours, target_roles, is_active) VALUES
('Welcome Email', 'signup', 0, '{}', true),
('Profile Reminder - 24h', 'signup', 24, '{}', true),
('Upload Guide - Artists', 'signup', 48, ARRAY['artist'], true),
('Competition Guide - Artists', 'signup', 72, ARRAY['artist'], true),
('Monetization Guide', 'signup', 96, ARRAY['artist', 'producer'], true);

-- Create trigger to queue welcome email on signup
CREATE OR REPLACE FUNCTION public.queue_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue welcome email immediately
  INSERT INTO public.email_queue (user_id, template_name, recipient_email, subject, metadata)
  VALUES (
    NEW.id,
    'welcome',
    NEW.email,
    'Welcome to BAK55 Talent! 🎵',
    jsonb_build_object('username', NEW.username, 'role', 'fan')
  );
  
  -- Queue profile reminder for 24 hours later
  INSERT INTO public.email_queue (user_id, template_name, recipient_email, subject, scheduled_for, metadata)
  VALUES (
    NEW.id,
    'profile_reminder',
    NEW.email,
    'Complete Your Profile ✨',
    now() + interval '24 hours',
    jsonb_build_object('username', NEW.username)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_profile_created_queue_emails
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.queue_welcome_email();

-- Create function to queue role-specific onboarding emails
CREATE OR REPLACE FUNCTION public.queue_role_onboarding_emails()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get user email and name
  SELECT email, username INTO user_email, user_name
  FROM public.profiles WHERE id = NEW.user_id;
  
  IF NEW.role = 'artist' THEN
    -- Queue artist-specific emails
    INSERT INTO public.email_queue (user_id, template_name, recipient_email, subject, scheduled_for, metadata)
    VALUES 
    (NEW.user_id, 'first_upload_guide', user_email, 'Ready to Upload Your Music? 🎤', now() + interval '48 hours', jsonb_build_object('username', user_name)),
    (NEW.user_id, 'competition_guide', user_email, 'Win Big in Competitions! 🏆', now() + interval '72 hours', jsonb_build_object('username', user_name)),
    (NEW.user_id, 'monetization_guide', user_email, 'Start Earning with Your Music 💰', now() + interval '96 hours', jsonb_build_object('username', user_name));
  ELSIF NEW.role = 'producer' THEN
    -- Queue producer-specific emails
    INSERT INTO public.email_queue (user_id, template_name, recipient_email, subject, scheduled_for, metadata)
    VALUES 
    (NEW.user_id, 'monetization_guide', user_email, 'Start Earning with Your Beats 💰', now() + interval '48 hours', jsonb_build_object('username', user_name));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on user_roles
CREATE TRIGGER on_role_assigned_queue_emails
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.queue_role_onboarding_emails();