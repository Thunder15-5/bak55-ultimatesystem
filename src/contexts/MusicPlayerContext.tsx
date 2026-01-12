import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { FEATURES } from '@/lib/featureFlags';

export interface Track {
  id: string;
  title: string;
  artist_id: string;
  audio_url: string;
  cover_image: string | null;
  genre: string | null;
  duration?: number;
  profiles: {
    username: string;
    avatar_url?: string | null;
  };
}

type RepeatMode = 'off' | 'one' | 'all';

interface MusicPlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isMinimized: boolean;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  history: Track[];
  nextTrackUrl: string | null;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  addToQueue: (track: Track) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  clearQueue: () => void;
  toggleMinimized: () => void;
  removeFromQueue: (trackId: string) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

// Shuffle array utility
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

  // Compute next track URL for preloading
  const nextTrackUrl = queue.length > 0 ? queue[0].audio_url : null;

  // Record listening history
  const recordHistory = useCallback(async (trackId: string) => {
    if (!user) return;
    
    try {
      await supabase.from('listening_history').insert({
        user_id: user.id,
        track_id: trackId,
      });
    } catch (error) {
      console.error('Failed to record listening history:', error);
    }
  }, [user]);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    // Add current track to history if exists
    if (currentTrack) {
      setHistory(prev => [currentTrack, ...prev.slice(0, 49)]); // Keep last 50 tracks
    }
    
    setCurrentTrack(track);
    setIsPlaying(true);
    
    if (newQueue) {
      const trackIndex = newQueue.findIndex(t => t.id === track.id);
      const remainingQueue = trackIndex !== -1 ? newQueue.slice(trackIndex + 1) : newQueue;
      
      setOriginalQueue(remainingQueue);
      
      if (shuffleEnabled && FEATURES.SHUFFLE_MODE) {
        setQueue(shuffleArray(remainingQueue));
      } else {
        setQueue(remainingQueue);
      }
    }

    // Record listening history
    recordHistory(track.id);
  }, [currentTrack, shuffleEnabled, recordHistory]);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
    setOriginalQueue(prev => [...prev, track]);
  }, []);

  const playNext = useCallback(() => {
    if (repeatMode === 'one' && currentTrack && FEATURES.REPEAT_MODE) {
      // Replay current track (handled by audio engine)
      setIsPlaying(true);
      return;
    }

    if (queue.length > 0) {
      const [nextTrack, ...remainingQueue] = queue;
      
      if (currentTrack) {
        setHistory(prev => [currentTrack, ...prev.slice(0, 49)]);
      }
      
      setCurrentTrack(nextTrack);
      setQueue(remainingQueue);
      setIsPlaying(true);
      
      recordHistory(nextTrack.id);
    } else if (repeatMode === 'all' && originalQueue.length > 0 && FEATURES.REPEAT_MODE) {
      // Restart queue from beginning
      const newQueue = shuffleEnabled && FEATURES.SHUFFLE_MODE 
        ? shuffleArray(originalQueue) 
        : [...originalQueue];
      
      if (newQueue.length > 0) {
        const [firstTrack, ...rest] = newQueue;
        if (currentTrack) {
          setHistory(prev => [currentTrack, ...prev.slice(0, 49)]);
        }
        setCurrentTrack(firstTrack);
        setQueue(rest);
        setIsPlaying(true);
        
        recordHistory(firstTrack.id);
      }
    } else {
      setIsPlaying(false);
    }
  }, [queue, repeatMode, originalQueue, shuffleEnabled, currentTrack, recordHistory]);

  const playPrevious = useCallback(() => {
    if (history.length > 0) {
      const [previousTrack, ...remainingHistory] = history;
      
      // Add current track back to queue front
      if (currentTrack) {
        setQueue(prev => [currentTrack, ...prev]);
      }
      
      setCurrentTrack(previousTrack);
      setHistory(remainingHistory);
      setIsPlaying(true);
    } else {
      // Just restart current track (handled by audio engine)
      setIsPlaying(true);
    }
  }, [history, currentTrack]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setOriginalQueue([]);
  }, []);

  const toggleMinimized = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue(prev => prev.filter(t => t.id !== trackId));
    setOriginalQueue(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const toggleShuffle = useCallback(() => {
    if (!FEATURES.SHUFFLE_MODE) return;
    
    setShuffleEnabled(prev => {
      const newValue = !prev;
      if (newValue) {
        // Shuffle the current queue
        setQueue(prevQueue => shuffleArray(prevQueue));
      } else {
        // Restore original order (matching remaining tracks)
        setQueue(prevQueue => {
          const remainingIds = new Set(prevQueue.map(t => t.id));
          return originalQueue.filter(t => remainingIds.has(t.id));
        });
      }
      return newValue;
    });
  }, [originalQueue]);

  const cycleRepeatMode = useCallback(() => {
    if (!FEATURES.REPEAT_MODE) return;
    
    setRepeatMode(prev => {
      switch (prev) {
        case 'off': return 'one';
        case 'one': return 'all';
        case 'all': return 'off';
      }
    });
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        isMinimized,
        shuffleEnabled,
        repeatMode,
        history,
        nextTrackUrl,
        playTrack,
        addToQueue,
        playNext,
        playPrevious,
        togglePlay,
        setIsPlaying,
        clearQueue,
        toggleMinimized,
        removeFromQueue,
        toggleShuffle,
        cycleRepeatMode,
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
