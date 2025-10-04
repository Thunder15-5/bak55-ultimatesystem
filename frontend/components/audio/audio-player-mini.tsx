// frontend/components/audio/audio-player-mini.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AudioTrack } from '@/types/audio';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerMiniProps {
  track: AudioTrack;
  className?: string;
}

export function AudioPlayerMini({ track, className }: AudioPlayerMiniProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, this would control the actual audio element
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn('bg-dark-800 rounded-lg p-3', className)}>
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlayPause}
          className="w-8 h-8 p-0 rounded-full flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {track.title}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {formatTime(currentTime)} / {formatTime(duration || track.duration)}
          </p>
        </div>

        {/* Volume Icon */}
        <Volume2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </div>

      {/* Progress Bar */}
      <div className="mt-2">
        <div className="w-full bg-dark-600 rounded-full h-1">
          <motion.div
            className="bg-primary-500 h-1 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    </div>
  );
}
