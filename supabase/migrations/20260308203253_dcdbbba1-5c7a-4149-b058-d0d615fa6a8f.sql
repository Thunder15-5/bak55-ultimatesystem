-- Sprint 2: All database changes

-- 1. KYC Documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc_documents', 'kyc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- KYC storage RLS policies
CREATE POLICY "Users can upload their own KYC docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kyc_documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own KYC docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kyc_documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Direct Messaging tables
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_two uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_one, participant_two)
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT TO authenticated
USING (participant_one = auth.uid() OR participant_two = auth.uid());

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (participant_one = auth.uid() OR participant_two = auth.uid());

CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.direct_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  )
);

CREATE POLICY "Users can update read_at on their messages"
ON public.direct_messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  )
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON public.direct_messages(conversation_id, sender_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_one, participant_two);

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- 3. Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE conversations SET last_message_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_direct_message
AFTER INSERT ON public.direct_messages
FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();