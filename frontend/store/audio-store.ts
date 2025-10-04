// frontend/store/audio-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AudioTrack, PlaybackState, UploadTrackRequest } from '@/types/audio';

interface AudioState extends PlaybackState {
  // Actions
  play: (track: AudioTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: AudioTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  
  // Upload
  uploadTrack: (data: UploadTrackRequest, onProgress?: (progress: number) => void) => Promise<AudioTrack>;
  
  // Analytics
  recordPlay: (trackId: string) => Promise<void>;
  recordLike: (trackId: string) => Promise<void>;
  recordShare: (trackId: string) => Promise<void>;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      // Initial state
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      playbackRate: 1,
      isMuted: false,
      currentTrack: null,
      queue: [],
      currentIndex: -1,

      // Playback actions
      play: (track: AudioTrack) => {
        const { currentTrack, queue } = get();
        
        if (currentTrack?.id === track.id) {
          set({ isPlaying: true });
          return;
        }

        // Add to queue if not already there
        const trackIndex = queue.findIndex(t => t.id === track.id);
        if (trackIndex === -1) {
          set({
            currentTrack: track,
            currentIndex: queue.length,
            queue: [...queue, track],
            isPlaying: true,
            currentTime: 0,
          });
        } else {
          set({
            currentTrack: track,
            currentIndex: trackIndex,
            isPlaying: true,
            currentTime: 0,
          });
        }
      },

      pause: () => {
        set({ isPlaying: false });
      },

      resume: () => {
        set({ isPlaying: true });
      },

      stop: () => {
        set({ 
          isPlaying: false, 
          currentTime: 0,
          currentTrack: null,
          currentIndex: -1,
        });
      },

      seek: (time: number) => {
        set({ currentTime: Math.max(0, Math.min(time, get().duration)) });
      },

      setVolume: (volume: number) => {
        set({ volume: Math.max(0, Math.min(1, volume)) });
      },

      setPlaybackRate: (rate: number) => {
        set({ playbackRate: Math.max(0.5, Math.min(4, rate)) });
      },

      toggleMute: () => {
        set({ isMuted: !get().isMuted });
      },

      nextTrack: () => {
        const { queue, currentIndex } = get();
        if (currentIndex < queue.length - 1) {
          const nextIndex = currentIndex + 1;
          set({
            currentTrack: queue[nextIndex],
            currentIndex: nextIndex,
            currentTime: 0,
            isPlaying: true,
          });
        }
      },

      previousTrack: () => {
        const { currentIndex, currentTime } = get();
        if (currentTime > 3) {
          // If more than 3 seconds in, restart current track
          set({ currentTime: 0 });
        } else if (currentIndex > 0) {
          // Otherwise go to previous track
          const prevIndex = currentIndex - 1;
          set({
            currentTrack: get().queue[prevIndex],
            currentIndex: prevIndex,
            currentTime: 0,
            isPlaying: true,
          });
        }
      },

      addToQueue: (track: AudioTrack) => {
        const { queue } = get();
        set({ queue: [...queue, track] });
      },

      removeFromQueue: (index: number) => {
        const { queue, currentIndex } = get();
        const newQueue = queue.filter((_, i) => i !== index);
        
        let newCurrentIndex = currentIndex;
        if (index < currentIndex) {
          newCurrentIndex--;
        } else if (index === currentIndex) {
          newCurrentIndex = -1;
          set({ currentTrack: null, isPlaying: false });
        }
        
        set({ queue: newQueue, currentIndex: newCurrentIndex });
      },

      clearQueue: () => {
        set({ 
          queue: [], 
          currentIndex: -1, 
          currentTrack: null, 
          isPlaying: false,
          currentTime: 0,
        });
      },

      // Upload track with progress tracking
      uploadTrack: async (data: UploadTrackRequest, onProgress?: (progress: number) => void): Promise<AudioTrack> => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('genre', data.genre);
        formData.append('audioFile', data.audioFile);
        formData.append('isPublic', data.isPublic.toString());
        
        if (data.bpm) formData.append('bpm', data.bpm.toString());
        if (data.key) formData.append('key', data.key);

        try {
          const response = await fetch('/api/tracks/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          const track = await response.json();
          return track;
        } catch (error) {
          console.error('Upload failed:', error);
          throw error;
        }
      },

      // Analytics
      recordPlay: async (trackId: string) => {
        try {
          await fetch('/api/tracks/' + trackId + '/play', {
            method: 'POST',
          });
        } catch (error) {
          console.error('Failed to record play:', error);
        }
      },

      recordLike: async (trackId: string) => {
        try {
          await fetch('/api/tracks/' + trackId + '/like', {
            method: 'POST',
          });
        } catch (error) {
          console.error('Failed to record like:', error);
        }
      },

      recordShare: async (trackId: string) => {
        try {
          await fetch('/api/tracks/' + trackId + '/share', {
            method: 'POST',
          });
        } catch (error) {
          console.error('Failed to record share:', error);
        }
      },
    }),
    {
      name: 'audio-storage',
      partialize: (state) => ({
        volume: state.volume,
        playbackRate: state.playbackRate,
        isMuted: state.isMuted,
        queue: state.queue,
      }),
    }
  )
);
