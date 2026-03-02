import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFeaturedCompetition(userId: string | undefined) {
  const [featuredCompetition, setFeaturedCompetition] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('competitions')
        .select('*, submissions(count)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setFeaturedCompetition(data);
    };

    fetch();
  }, [userId]);

  return featuredCompetition;
}
