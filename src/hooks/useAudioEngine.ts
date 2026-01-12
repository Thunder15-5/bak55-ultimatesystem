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

export function useAudioEngine(options: UseAudioEngineOptions = {}) {
  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isBuffering: false,
    isLoaded: false,
    error: null,
  });

  const howlRef = useRef<Howl | null>(null);
  const preloadRef = useRef<Howl | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const currentSrcRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Update time in animation frame for smooth progress
  const updateTime = useCallback(() => {
    if (howlRef.current && howlRef.current.playing()) {
      const seek = howlRef.current.seek() as number;
      setState(prev => ({ ...prev, currentTime: seek }));
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
    }));

    const createHowl = () => {
      const howl = new Howl({
        src: [src],
        html5: true, // Enable streaming for large files
        volume: state.volume,
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
          }
          options.onPause?.();
        },
        onstop: () => {
          setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
          }
        },
        onend: () => {
          setState(prev => ({ ...prev, isPlaying: false }));
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
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
          if (howl.playing()) {
            updateTime();
          }
        },
      });

      return howl;
    };

    howlRef.current = createHowl();

    if (autoplay) {
      // Small delay to ensure load starts
      setTimeout(() => {
        howlRef.current?.play();
      }, 100);
    }
  }, [cleanup, updateTime, options, state.volume]);

  // Preload next track
  const preload = useCallback((src: string) => {
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

  // Seek
  const seek = useCallback((time: number) => {
    if (howlRef.current) {
      howlRef.current.seek(time);
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  // Set volume (0-1)
  const setVolume = useCallback((vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    Howler.volume(clampedVol);
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
  };
}
