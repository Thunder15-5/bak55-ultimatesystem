-- Add color_images column to map colors to specific images
ALTER TABLE merch_products ADD COLUMN IF NOT EXISTS color_images jsonb DEFAULT '{}'::jsonb;

-- Create platform_announcements table for global notifications
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_active boolean DEFAULT true,
  priority text DEFAULT 'normal',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active announcements"
  ON public.platform_announcements FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage announcements"
  ON public.platform_announcements FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.announcement_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  announcement_id uuid NOT NULL REFERENCES public.platform_announcements(id) ON DELETE CASCADE,
  dismissed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dismissals"
  ON public.announcement_dismissals FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_announcements;