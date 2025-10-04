// frontend/components/audio/audio-player.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '@/store/audio-store';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Repeat, 
  Heart, 
  Share,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    play,
    pause,
    resume,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
    recordPlay,
  } = useAudioStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);

  // Sync audio element with store
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setIsLoaded(true);
      if (audioRef.current) {
        audioRef.current.currentTime = currentTime;
      }
    };

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        useAudioStore.setState({ currentTime: audioRef.current.currentTime });
      }
    };

    const handleEnded = () => {
      nextTrack();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTime, nextTrack]);

  // Control playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Control volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Control playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Record play when track changes
  useEffect(() => {
    if (currentTrack) {
      recordPlay(currentTrack.id);
    }
  }, [currentTrack, recordPlay]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seek(newTime);
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 glass border-t border-luxury-glass-border backdrop-blur-xl z-50"
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        preload="metadata"
        onLoadedData={() => setIsLoaded(true)}
      />

      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Track Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Music className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white truncate">
                {currentTrack.title}
              </p>
              <p className="text-sm text-gray-400 truncate">
                {currentTrack.artist.stageName}
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share className="h-4 w-4" />
            </Button>
          </div>

          {/* Playback Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
            {/* Control Buttons */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={previousTrack}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="w-12 h-12 rounded-full"
                onClick={isPlaying ? pause : resume}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={nextTrack}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Repeat className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs text-gray-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <div
                className="flex-1 h-1 bg-dark-600 rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                <div className="relative h-full">
                  <motion.div
                    className="bg-primary-500 h-full rounded-full relative group-hover:bg-primary-400"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                  </motion.div>
                </div>
              </div>
              <span className="text-xs text-gray-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Additional Controls */}
          <div className="flex items-center gap-3 justify-end flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <div className="w-20 h-1 bg-dark-600 rounded-full cursor-pointer group">
                <div
                  className="bg-gray-400 h-full rounded-full relative group-hover:bg-gray-300"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    setVolume(percent);
                  }}
                >
                  <div className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                </div>
              </div>
            </div>
            
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper Music icon component
function Music(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
