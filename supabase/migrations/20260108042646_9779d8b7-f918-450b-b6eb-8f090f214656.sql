-- Fix function search paths - need to drop and recreate can_enter_competition due to parameter name change
DROP FUNCTION IF EXISTS public.can_enter_competition(uuid, uuid);

-- Recreate can_enter_competition with search_path
CREATE FUNCTION public.can_enter_competition(competition_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM public.submissions 
        WHERE competition_id = competition_id_param 
        AND artist_id = user_id_param
    )
    AND EXISTS (
        SELECT 1 FROM public.competitions 
        WHERE id = competition_id_param 
        AND status = 'active'
        AND start_date <= now() 
        AND end_date >= now()
    )
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public;

-- Fix has_sufficient_balance
CREATE OR REPLACE FUNCTION public.has_sufficient_balance(_amount numeric, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT balance FROM public.wallets WHERE user_id = _user_id), 0) >= _amount
$$;

-- Fix can_user_upload_track
CREATE OR REPLACE FUNCTION public.can_user_upload_track(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM public.user_subscriptions us
            JOIN public.subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = user_id_param
            AND us.status = 'active'
            AND us.expires_at > now()
        ) THEN true
        WHEN (SELECT COUNT(*) FROM public.tracks WHERE artist_id = user_id_param) < 1 THEN true
        ELSE false
    END
$$;

-- Fix get_primary_role
CREATE OR REPLACE FUNCTION public.get_primary_role(user_id_param uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT role::text FROM public.user_roles WHERE user_id = user_id_param ORDER BY 
            CASE role 
                WHEN 'admin' THEN 1 
                WHEN 'brand' THEN 2 
                WHEN 'artist' THEN 3 
                ELSE 4 
            END 
        LIMIT 1),
        'fan'
    )
$$;

-- Fix is_not_fan
CREATE OR REPLACE FUNCTION public.is_not_fan(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_id_param 
        AND role IN ('artist', 'brand', 'admin')
    )
$$;