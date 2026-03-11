import { useState, useCallback, useRef, useEffect } from 'react';
import { Howl, Howler } from 'howler';

export interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  error: string | null;
  isSeeking: boolean;
}

interface UseAudioEngineOptions {
  onEnd?: () => void;
  onLoad?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onError?: (error: string) => void;
  preloadNext?: string | null;
}

// Persist volume across sessions
const VOLUME_STORAGE_KEY = 'bak55_player_volume';
const getStoredVolume = (): number => {
  try {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
    return stored ? parseFloat(stored) : 1;
  } catch {
    return 1;
  }
};

const storeVolume = (volume: number) => {
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
  } catch {
    // Ignore storage errors
  }
};

export function useAudioEngine(options: UseAudioEngineOptions = {}) {
  const initialVolume = useRef(getStoredVolume());
  
  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: initialVolume.current,
    isMuted: false,
    isBuffering: false,
    isLoaded: false,
    error: null,
    isSeeking: false,
  });

  const howlRef = useRef<Howl | null>(null);
  const preloadRef = useRef<Howl | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const currentSrcRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const seekingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxRetries = 3;

  // Update time in animation frame for smooth progress
  const updateTime = useCallback(() => {
    if (howlRef.current && howlRef.current.playing()) {
      const seek = howlRef.current.seek() as number;
      // Only update if not seeking to prevent jumpy slider
      setState(prev => {
        if (prev.isSeeking) return prev;
        return { ...prev, currentTime: seek };
      });
      options.onTimeUpdate?.(seek);
      rafIdRef.current = requestAnimationFrame(updateTime);
    }
  }, [options]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (seekingTimeoutRef.current) {
      clearTimeout(seekingTimeoutRef.current);
      seekingTimeoutRef.current = null;
    }
    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }
  }, []);

  // Load a track
  const load = useCallback((src: string, autoplay = true) => {
    // Don't reload same track
    if (currentSrcRef.current === src && howlRef.current) {
      if (autoplay) {
        howlRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true }));
      }
      return;
    }

    cleanup();
    currentSrcRef.current = src;
    retryCountRef.current = 0;

    setState(prev => ({
      ...prev,
      isBuffering: true,
      isLoaded: false,
      error: null,
      currentTime: 0,
      duration: 0,
      isSeeking: false,
    }));

    const currentVolume = state.volume;

    const createHowl = () => {
      const howl = new Howl({
        src: [src],
        html5: true, // Enable streaming for large files
        volume: currentVolume,
        preload: true,
        onload: () => {
          setState(prev => ({
            ...prev,
            isBuffering: false,
            isLoaded: true,
            duration: howl.duration(),
          }));
          options.onLoad?.();
          retryCountRef.current = 0;
        },
        onplay: () => {
          setState(prev => ({ ...prev, isPlaying: true, isBuffering: false }));
          updateTime();
          options.onPlay?.();
        },
        onpause: () => {
          setState(prev => ({ ...prev, isPlaying: false }));
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
          }
          options.onPause?.();
        },
        onstop: () => {
          setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
          }
        },
        onend: () => {
          setState(prev => ({ ...prev, isPlaying: false }));
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
          }
          options.onEnd?.();
        },
        onloaderror: (_id, errorCode) => {
          console.error('Audio load error:', errorCode);
          retryCountRef.current++;
          
          if (retryCountRef.current < maxRetries) {
            // Retry with exponential backoff
            setTimeout(() => {
              if (currentSrcRef.current === src) {
                howlRef.current?.unload();
                howlRef.current = createHowl();
              }
            }, Math.pow(2, retryCountRef.current) * 1000);
          } else {
            const errorMsg = 'Failed to load audio. Please check your connection.';
            setState(prev => ({
              ...prev,
              isBuffering: false,
              error: errorMsg,
            }));
            options.onError?.(errorMsg);
          }
        },
        onplayerror: (_id, errorCode) => {
          console.error('Audio play error:', errorCode);
          // Try to recover from play errors
          howl.once('unlock', () => {
            howl.play();
          });
        },
        onseek: () => {
          // Clear seeking state after a brief delay
          if (seekingTimeoutRef.current) {
            clearTimeout(seekingTimeoutRef.current);
          }
          seekingTimeoutRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, isSeeking: false }));
            if (howl.playing()) {
              updateTime();
            }
          }, 100);
        },
      });

      return howl;
    };

    howlRef.current = createHowl();

    if (autoplay) {
      // Small delay to ensure load starts
      setTimeout(() => {
        howlRef.current?.play();
      }, 50);
    }
  }, [cleanup, updateTime, options, state.volume]);

  // Preload next track for gapless playback
  const preload = useCallback((src: string) => {
    // Don't preload if it's the current track
    if (src === currentSrcRef.current) return;
    
    if (preloadRef.current) {
      preloadRef.current.unload();
    }

    preloadRef.current = new Howl({
      src: [src],
      html5: true,
      preload: true,
      volume: 0,
    });
  }, []);

  // Use preloaded track for faster playback start
  const usePreloaded = useCallback((src: string, autoplay = true) => {
    if (preloadRef.current && preloadRef.current._src?.includes(src)) {
      cleanup();
      currentSrcRef.current = src;
      howlRef.current = preloadRef.current;
      preloadRef.current = null;
      
      // Set proper volume
      howlRef.current.volume(state.volume);
      
      // Register event handlers
      howlRef.current.on('play', () => {
        setState(prev => ({ ...prev, isPlaying: true, isBuffering: false }));
        updateTime();
        options.onPlay?.();
      });
      
      howlRef.current.on('end', () => {
        setState(prev => ({ ...prev, isPlaying: false }));
        options.onEnd?.();
      });
      
      setState(prev => ({
        ...prev,
        isLoaded: true,
        isBuffering: false,
        duration: howlRef.current!.duration(),
        currentTime: 0,
      }));
      
      if (autoplay) {
        howlRef.current.play();
      }
      
      return true;
    }
    return false;
  }, [cleanup, updateTime, options, state.volume]);

  // Play
  const play = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.play();
    }
  }, []);

  // Pause
  const pause = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.pause();
    }
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (howlRef.current) {
      if (howlRef.current.playing()) {
        howlRef.current.pause();
      } else {
        howlRef.current.play();
      }
    }
  }, []);

  // Seek with smooth progress
  const seek = useCallback((time: number) => {
    if (howlRef.current) {
      // Set seeking state immediately to prevent jumpy slider
      setState(prev => ({ ...prev, isSeeking: true, currentTime: time }));
      howlRef.current.seek(time);
    }
  }, []);

  // Set volume (0-1) with persistence
  const setVolume = useCallback((vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    Howler.volume(clampedVol);
    if (howlRef.current) {
      howlRef.current.volume(clampedVol);
    }
    storeVolume(clampedVol);
    setState(prev => ({
      ...prev,
      volume: clampedVol,
      isMuted: clampedVol === 0,
    }));
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (howlRef.current) {
      const newMuted = !state.isMuted;
      howlRef.current.mute(newMuted);
      Howler.mute(newMuted);
      setState(prev => ({ ...prev, isMuted: newMuted }));
    }
  }, [state.isMuted]);

  // Stop
  const stop = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.stop();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    // Set initial volume
    Howler.volume(initialVolume.current);
    
    return () => {
      cleanup();
      if (preloadRef.current) {
        preloadRef.current.unload();
      }
    };
  }, [cleanup]);

  // Handle visibility change (background playback)
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Audio continues playing in background with html5: true
      // This is just for any additional handling needed
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Preload next track when provided
  useEffect(() => {
    if (options.preloadNext) {
      preload(options.preloadNext);
    }
  }, [options.preloadNext, preload]);

  return {
    ...state,
    load,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    stop,
    preload,
    usePreloaded,
  };
}
