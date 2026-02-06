-- Fix producer signup fallback: allow 'producer' notification category so producer_profiles triggers don't fail
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.notifications'::regclass
      AND conname = 'notifications_category_check'
  ) THEN
    ALTER TABLE public.notifications DROP CONSTRAINT notifications_category_check;
  END IF;
END $$;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_category_check
CHECK (
  category = ANY (
    ARRAY[
      'artist'::text,
      'fan'::text,
      'producer'::text,
      'competition'::text,
      'payment'::text,
      'content'::text,
      'system'::text,
      'general'::text
    ]
  )
);

-- Backfill: users who selected producer in auth metadata but ended up without producer role/profile
DO $$
DECLARE
  rec RECORD;
  _genres text[];
BEGIN
  FOR rec IN
    SELECT
      u.id as user_id,
      u.email,
      u.raw_user_meta_data as meta,
      COALESCE(
        NULLIF(trim(u.raw_user_meta_data->>'producerName'), ''),
        NULLIF(trim(u.raw_user_meta_data->>'producer_name'), ''),
        NULLIF(trim(u.raw_user_meta_data->>'username'), ''),
        split_part(u.email, '@', 1)
      ) as producer_name
    FROM auth.users u
    WHERE COALESCE(NULLIF(trim(u.raw_user_meta_data->>'role'), ''), '') = 'producer'
  LOOP
    -- Insert producer role if missing
    INSERT INTO public.user_roles (user_id, role)
    VALUES (rec.user_id, 'producer'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Extract genres array safely
    _genres := '{}'::text[];
    BEGIN
      IF rec.meta ? 'genres'
        AND rec.meta->'genres' IS NOT NULL
        AND jsonb_typeof(rec.meta->'genres') = 'array' THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(rec.meta->'genres'))
        INTO _genres;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      _genres := '{}'::text[];
    END;

    -- Insert producer profile if missing
    INSERT INTO public.producer_profiles (
      user_id,
      producer_name,
      genres,
      verified,
      producer_tier,
      total_earnings
    )
    SELECT
      rec.user_id,
      rec.producer_name,
      _genres,
      FALSE,
      'starter',
      0
    WHERE NOT EXISTS (
      SELECT 1 FROM public.producer_profiles pp WHERE pp.user_id = rec.user_id
    );
  END LOOP;
END $$;