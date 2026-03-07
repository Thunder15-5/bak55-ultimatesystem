import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ArtistLevel {
  level: number;
  name: string;
  badge: string;
  can_withdraw: boolean;
  requires_kyc: boolean;
  perks: string[];
  streams: number;
  followers: number;
  kyc_status: string;
}

export interface LevelConfig {
  id: string;
  level_number: number;
  level_name: string;
  min_streams: number;
  min_followers: number;
  requires_kyc: boolean;
  can_withdraw: boolean;
  perks: string[];
  badge_icon: string;
}

export function useArtistLevel(userId?: string) {
  const [level, setLevel] = useState<ArtistLevel | null>(null);
  const [allLevels, setAllLevels] = useState<LevelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchLevel();
      fetchAllLevels();
    }
  }, [userId]);

  const fetchLevel = async () => {
    try {
      const { data, error } = await supabase.rpc('get_artist_level', { p_user_id: userId });
      if (error) throw error;
      setLevel(data as unknown as ArtistLevel);
    } catch (err) {
      console.error('Error fetching artist level:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLevels = async () => {
    const { data } = await supabase
      .from('artist_level_config')
      .select('*')
      .order('level_number');
    if (data) setAllLevels(data as unknown as LevelConfig[]);
  };

  const getNextLevel = (): LevelConfig | null => {
    if (!level || !allLevels.length) return null;
    return allLevels.find(l => l.level_number === level.level + 1) || null;
  };

  const getProgress = () => {
    const next = getNextLevel();
    if (!level || !next) return { streams: 100, followers: 100 };
    return {
      streams: Math.min((level.streams / next.min_streams) * 100, 100),
      followers: Math.min((level.followers / next.min_followers) * 100, 100),
    };
  };

  return { level, allLevels, loading, getNextLevel, getProgress, refetch: fetchLevel };
}
