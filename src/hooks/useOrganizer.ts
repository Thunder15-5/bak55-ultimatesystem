import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Organizer {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  organizer_type: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website: string | null;
  socials: any;
  country: string | null;
  city: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  verification: string;
  featured: boolean;
  total_competitions: number;
  total_prize_awarded: number;
  total_contestants: number;
  follower_count: number;
  average_rating: number;
  created_at: string;
}

export function useOrganizer() {
  const { user, loading: authLoading } = useAuth();
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) {
      setOrganizer(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("organizers")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (error) setError(error.message);
    setOrganizer((data as any) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetch();
  }, [authLoading, fetch]);

  return { organizer, loading: loading || authLoading, error, refresh: fetch };
}
