import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Centralized track data management with React Query for cache invalidation
export interface Track {
  id: string;
  title: string;
  artist_id: string;
  audio_url: string;
  cover_image: string | null;
  genre: string | null;
  plays: number;
  duration: number | null;
  moderation_status: string | null;
  created_at: string;
  artist_profiles?: {
    stage_name: string | null;
    user_id: string;
  } | null;
  profiles?: {
    username: string;
    avatar_url?: string | null;
    display_name?: string | null;
  } | null;
}

// Query key factory for tracks
export const trackKeys = {
  all: ['tracks'] as const,
  approved: () => [...trackKeys.all, 'approved'] as const,
  pending: () => [...trackKeys.all, 'pending'] as const,
  byArtist: (artistId: string) => [...trackKeys.all, 'artist', artistId] as const,
  trending: (limit: number) => [...trackKeys.all, 'trending', limit] as const,
  detail: (id: string) => [...trackKeys.all, 'detail', id] as const,
};

// Fetch approved tracks for public pages
export function useApprovedTracks() {
  return useQuery({
    queryKey: trackKeys.approved(),
    queryFn: async () => {
      const { data: tracksData, error: tracksError } = await supabase
        .from("tracks")
        .select("*")
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

      if (tracksError) throw tracksError;

      if (!tracksData || tracksData.length === 0) {
        return [];
      }

      // Fetch artist profiles for these tracks
      const artistIds = [...new Set(tracksData.map(t => t.artist_id))];
      const { data: artistsData } = await supabase
        .from("artist_profiles")
        .select("user_id, stage_name")
        .in("user_id", artistIds);

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, display_name")
        .in("id", artistIds);

      // Merge data
      const tracksWithArtists: Track[] = tracksData.map(track => ({
        ...track,
        artist_profiles: artistsData?.find(a => a.user_id === track.artist_id) || null,
        profiles: profilesData?.find(p => p.id === track.artist_id) || null,
      }));

      return tracksWithArtists;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// Fetch pending tracks for moderation
export function usePendingTracks() {
  return useQuery({
    queryKey: trackKeys.pending(),
    queryFn: async () => {
      const { data: tracks, error } = await supabase
        .from("tracks")
        .select(`
          id,
          title,
          genre,
          artist_id,
          audio_url,
          cover_image,
          moderation_status,
          moderation_notes,
          created_at,
          profiles:artist_id (username, email)
        `)
        .in("moderation_status", ["pending", "flagged"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return tracks || [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Fetch trending tracks with proper artist name resolution
export function useTrendingTracks(limit: number = 5) {
  return useQuery({
    queryKey: trackKeys.trending(limit),
    queryFn: async () => {
      // First fetch tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('id, title, cover_image, plays, audio_url, genre, artist_id')
        .eq('moderation_status', 'approved')
        .order('plays', { ascending: false })
        .limit(limit);

      if (tracksError) throw tracksError;
      if (!tracksData || tracksData.length === 0) return [];

      // Get unique artist IDs
      const artistIds = [...new Set(tracksData.map(t => t.artist_id))];

      // Fetch artist profiles and profiles in parallel
      const [artistProfilesRes, profilesRes] = await Promise.all([
        supabase
          .from('artist_profiles')
          .select('user_id, stage_name')
          .in('user_id', artistIds),
        supabase
          .from('profiles')
          .select('id, display_name, username')
          .in('id', artistIds)
      ]);

      const artistProfiles = artistProfilesRes.data || [];
      const profiles = profilesRes.data || [];

      // Merge the data
      return tracksData.map(track => {
        const artistProfile = artistProfiles.find(ap => ap.user_id === track.artist_id);
        const profile = profiles.find(p => p.id === track.artist_id);
        return {
          ...track,
          artist_profiles: artistProfile || null,
          profiles: profile || null,
        };
      });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to invalidate all track-related queries
export function useInvalidateTracks() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: trackKeys.all }),
    invalidateApproved: () => queryClient.invalidateQueries({ queryKey: trackKeys.approved() }),
    invalidatePending: () => queryClient.invalidateQueries({ queryKey: trackKeys.pending() }),
    invalidateTrending: () => queryClient.invalidateQueries({ queryKey: ['tracks', 'trending'] }),
  };
}
