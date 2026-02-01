-- Add missing RLS policies for moderation system to work properly

-- 1. Tracks table - Allow admins to update any track (for moderation)
CREATE POLICY "Admins can update any track"
ON public.tracks FOR UPDATE
USING (public.is_admin(auth.uid()));

-- 2. Submissions table - Allow admins to update any submission (for moderation)
CREATE POLICY "Admins can update any submission"
ON public.submissions FOR UPDATE
USING (public.is_admin(auth.uid()));

-- 3. Admin activity log - Allow admins to insert activity logs
CREATE POLICY "Admins can insert activity logs"
ON public.admin_activity_log FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- 4. Notifications table - Allow users to create notifications for themselves
CREATE POLICY "Users can create own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Notifications table - Allow admins to create notifications for any user
CREATE POLICY "Admins can create notifications for any user"
ON public.notifications FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));