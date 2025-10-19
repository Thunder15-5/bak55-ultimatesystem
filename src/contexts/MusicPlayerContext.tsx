import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Track {
  id: string;
  title: string;
  artist_id: string;
  audio_url: string;
  cover_image: string | null;
  genre: string | null;
  profiles: {
    username: string;
    avatar_url?: string | null;
  };
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isMinimized: boolean;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  addToQueue: (track: Track) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  clearQueue: () => void;
  toggleMinimized: () => void;
  removeFromQueue: (trackId: string) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  const playTrack = (track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    if (newQueue) {
      const trackIndex = newQueue.findIndex(t => t.id === track.id);
      if (trackIndex !== -1) {
        setQueue(newQueue.slice(trackIndex + 1));
      } else {
        setQueue(newQueue);
      }
    }

    // Record listening history
    if (user) {
      supabase.from('listening_history').insert({
        user_id: user.id,
        track_id: track.id,
      });
    }
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  const playNext = () => {
    if (queue.length > 0) {
      const [nextTrack, ...remainingQueue] = queue;
      setCurrentTrack(nextTrack);
      setQueue(remainingQueue);
      setIsPlaying(true);

      if (user) {
        supabase.from('listening_history').insert({
          user_id: user.id,
          track_id: nextTrack.id,
        });
      }
    } else {
      setIsPlaying(false);
    }
  };

  const playPrevious = () => {
    // In a full implementation, you'd keep a history stack
    // For now, we'll just restart the current track
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  const removeFromQueue = (trackId: string) => {
    setQueue(prev => prev.filter(t => t.id !== trackId));
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        isMinimized,
        playTrack,
        addToQueue,
        playNext,
        playPrevious,
        togglePlay,
        setIsPlaying,
        clearQueue,
        toggleMinimized,
        removeFromQueue,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
}
