// frontend/components/audio/waveform.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface WaveformProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  height?: number;
  className?: string;
}

export function Waveform({ 
  audioUrl, 
  currentTime, 
  duration, 
  onSeek, 
  height = 40,
  className 
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!audioUrl) return;

    const analyzeAudio = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, you would:
        // 1. Fetch the audio file
        // 2. Use Web Audio API to analyze and generate waveform data
        // 3. Set the waveform data for visualization
        
        // For now, we'll generate mock waveform data
        const mockData = Array.from({ length: 200 }, () => 
          Math.random() * 0.8 + 0.2
        );
        setWaveformData(mockData);
      } catch (error) {
        console.error('Failed to analyze audio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeAudio();
  }, [audioUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    const barWidth = width / waveformData.length;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    waveformData.forEach((value, index) => {
      const barHeight = value * height * 0.6;
      const x = index * barWidth;
      const progress = (index / waveformData.length);
      const isPlayed = progress < (currentTime / duration);

      // Gradient based on playback position
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#8B5CF6');
      gradient.addColorStop(1, '#06D6A0');

      ctx.fillStyle = isPlayed ? gradient : 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
    });

    // Draw progress indicator
    const progressX = (currentTime / duration) * width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(progressX - 1, 0, 2, height);
  }, [waveformData, currentTime, duration]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;

    const rect = canvas.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    onSeek(newTime);
  };

  if (isLoading) {
    return (
      <div 
        className={`bg-dark-700 rounded-lg shimmer ${className}`}
        style={{ height }}
      />
    );
  }

  return (
    <motion.canvas
      ref={canvasRef}
      width={800}
      height={height * 2} // Higher resolution for crisp display
      onClick={handleClick}
      className={`w-full h-10 cursor-pointer rounded-lg ${className}`}
      style={{ height }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    />
  );
}
