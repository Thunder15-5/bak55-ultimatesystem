import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
  ChevronUp, ChevronDown, Music, X, ListMusic, Shuffle, Repeat, Repeat1, Loader2
} from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { supabase } from "@/integrations/supabase/client";
import { FEATURES } from "@/lib/featureFlags";
import { cn } from "@/lib/utils";

export function PersistentMusicPlayer() {
  const {
    currentTrack,
    queue,
    isPlaying,
    isMinimized,
    shuffleEnabled,
    repeatMode,
    nextTrackUrl,
    playNext,
    playPrevious,
    setIsPlaying,
    toggleMinimized,
    removeFromQueue,
    toggleShuffle,
    cycleRepeatMode,
  } = useMusicPlayer();

  const [showQueue, setShowQueue] = useState(false);
  const hasIncrementedPlays = useRef(false);
  const lastTrackId = useRef<string | null>(null);

  // Use the Howler-based audio engine
  const audio = useAudioEngine({
    onEnd: () => {
      if (repeatMode === 'one' && FEATURES.REPEAT_MODE) {
        audio.seek(0);
        audio.play();
      } else if (queue.length > 0) {
        playNext();
      } else if (repeatMode === 'all' && FEATURES.REPEAT_MODE) {
        playNext();
      } else {
        setIsPlaying(false);
      }
    },
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onTimeUpdate: (time) => {
      if (!hasIncrementedPlays.current && time >= 30 && currentTrack) {
        hasIncrementedPlays.current = true;
        incrementPlayCount(currentTrack.id);
      }
    },
    preloadNext: nextTrackUrl,
  });

  const incrementPlayCount = async (trackId: string) => {
    try {
      const { data } = await supabase
        .from("tracks")
        .select("plays")
        .eq("id", trackId)
        .single();
      
      if (data) {
        await supabase
          .from("tracks")
          .update({ plays: (data.plays || 0) + 1 })
          .eq("id", trackId);
      }
    } catch (error) {
      console.error('Failed to increment play count:', error);
    }
  };

  // Load new track when currentTrack changes
  useEffect(() => {
    if (currentTrack && currentTrack.id !== lastTrackId.current) {
      lastTrackId.current = currentTrack.id;
      hasIncrementedPlays.current = false;
      audio.load(currentTrack.audio_url, isPlaying);
    }
  }, [currentTrack, isPlaying, audio]);

  // Sync play/pause state from context
  useEffect(() => {
    if (isPlaying && !audio.isPlaying && audio.isLoaded) {
      audio.play();
    } else if (!isPlaying && audio.isPlaying) {
      audio.pause();
    }
  }, [isPlaying, audio]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!FEATURES.KEYBOARD_SHORTCUTS || !currentTrack) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          audio.togglePlay();
          break;
        case 'ArrowLeft':
          audio.seek(Math.max(0, audio.currentTime - 10));
          break;
        case 'ArrowRight':
          audio.seek(Math.min(audio.duration, audio.currentTime + 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          audio.setVolume(Math.min(1, audio.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          audio.setVolume(Math.max(0, audio.volume - 0.1));
          break;
        case 'KeyN':
          playNext();
          break;
        case 'KeyP':
          playPrevious();
          break;
        case 'KeyM':
          audio.toggleMute();
          break;
        case 'KeyS':
          if (FEATURES.SHUFFLE_MODE) toggleShuffle();
          break;
        case 'KeyR':
          if (FEATURES.REPEAT_MODE) cycleRepeatMode();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, audio, playNext, playPrevious, toggleShuffle, cycleRepeatMode]);

  const handleSeek = (value: number[]) => {
    audio.seek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    audio.setVolume(value[0]);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getRepeatIcon = () => {
    if (repeatMode === 'one') {
      return <Repeat1 className="h-4 w-4 sm:h-5 sm:w-5" />;
    }
    return <Repeat className="h-4 w-4 sm:h-5 sm:w-5" />;
  };

  if (!currentTrack) return null;

  // EXPANDED PLAYER VIEW
  if (!isMinimized) {
    return (
      <Card className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-xl shadow-2xl safe-area-bottom">
        <div className="p-4 sm:p-6">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
              {/* Album Art */}
              <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-lg bg-muted flex-shrink-0 overflow-hidden shadow-lg mx-auto lg:mx-0 relative">
                {currentTrack.cover_image ? (
                  <img
                    src={currentTrack.cover_image}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <Music className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-muted-foreground" />
                  </div>
                )}
                {audio.isBuffering && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Track Details & Controls */}
              <div className="flex-1 space-y-3 sm:space-y-4 text-center lg:text-left">
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{currentTrack.title}</h3>
                  <p className="text-base sm:text-lg text-muted-foreground truncate">
                    {currentTrack.profiles.username}
                  </p>
                  {currentTrack.genre && (
                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm">
                      {currentTrack.genre}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <Slider
                    value={[audio.currentTime]}
                    max={audio.duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 sm:[&_[role=slider]]:h-5 sm:[&_[role=slider]]:w-5"
                  />
                  <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>{formatTime(audio.currentTime)}</span>
                    <span>{formatTime(audio.duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  {FEATURES.SHUFFLE_MODE && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleShuffle}
                      className={cn(
                        "h-10 w-10 transition-colors touch-manipulation",
                        shuffleEnabled && "text-primary bg-primary/10"
                      )}
                      title="Shuffle (S)"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={playPrevious}
                    className="h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 touch-manipulation"
                    title="Previous (P)"
                  >
                    <SkipBack className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>

                  {/* Large Central Play Button */}
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => audio.togglePlay()}
                    disabled={audio.isBuffering && !audio.isLoaded}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-full shadow-xl hover:scale-110 transition-all touch-manipulation bg-primary hover:bg-primary/90"
                    title="Play/Pause (Space)"
                  >
                    {audio.isBuffering && !audio.isPlaying ? (
                      <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin" />
                    ) : audio.isPlaying ? (
                      <Pause className="h-8 w-8 sm:h-10 sm:w-10 fill-current" />
                    ) : (
                      <Play className="h-8 w-8 sm:h-10 sm:w-10 ml-1 fill-current" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={playNext}
                    disabled={queue.length === 0 && repeatMode === 'off'}
                    className="h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 touch-manipulation"
                    title="Next (N)"
                  >
                    <SkipForward className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>

                  {FEATURES.REPEAT_MODE && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={cycleRepeatMode}
                      className={cn(
                        "h-10 w-10 transition-colors touch-manipulation",
                        repeatMode !== 'off' && "text-primary bg-primary/10"
                      )}
                      title="Repeat (R)"
                    >
                      {getRepeatIcon()}
                    </Button>
                  )}
                </div>

                {/* Volume Control */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => audio.toggleMute()}
                    className="h-10 w-10 touch-manipulation"
                  >
                    {audio.isMuted || audio.volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  <Slider
                    value={[audio.isMuted ? 0 : audio.volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-32 lg:w-40"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleMinimized}
                    className="h-10 w-10 touch-manipulation"
                    title="Minimize"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </Button>
                </div>

                {audio.error && (
                  <p className="text-sm text-destructive text-center">{audio.error}</p>
                )}
              </div>

              {/* Queue Panel - Desktop Only */}
              <div className="hidden lg:block w-80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <ListMusic className="h-4 w-4" />
                    Queue ({queue.length})
                  </h4>
                </div>
                <ScrollArea className="h-64">
                  {queue.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Queue is empty
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {queue.map((track, index) => (
                        <div
                          key={track.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 group"
                        >
                          <span className="text-xs text-muted-foreground w-6">
                            {index + 1}
                          </span>
                          <div className="w-10 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                            {track.cover_image ? (
                              <img
                                src={track.cover_image}
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {track.profiles.username}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            onClick={() => removeFromQueue(track.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>

        {FEATURES.KEYBOARD_SHORTCUTS && (
          <div className="text-center text-xs text-muted-foreground pb-2">
            Keyboard: Space (play/pause) • ←→ (seek) • ↑↓ (volume) • N/P (next/prev) • M (mute) • S (shuffle) • R (repeat)
          </div>
        )}
      </Card>
    );
  }

  // MINIMIZED PLAYER VIEW
  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-xl shadow-2xl safe-area-bottom">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-[35%] sm:max-w-none">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-muted flex-shrink-0 overflow-hidden shadow-md relative">
              {currentTrack.cover_image ? (
                <img
                  src={currentTrack.cover_image}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Music className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              {audio.isBuffering && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 hidden sm:block">
              <p className="font-semibold truncate text-sm">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.profiles.username}
              </p>
            </div>
          </div>

          {/* Center Controls */}
          <div className="flex flex-col items-center gap-1 flex-1 sm:flex-[2] sm:max-w-2xl">
            <div className="flex items-center gap-1 sm:gap-2">
              {FEATURES.SHUFFLE_MODE && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleShuffle}
                  className={cn(
                    "h-8 w-8 hidden sm:flex transition-colors",
                    shuffleEnabled && "text-primary"
                  )}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              )}

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={playPrevious}
                className="h-8 w-8 sm:h-9 sm:w-9 touch-manipulation"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button 
                variant="default" 
                size="icon" 
                onClick={() => audio.togglePlay()}
                disabled={audio.isBuffering && !audio.isLoaded}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg hover:scale-105 transition-all touch-manipulation"
              >
                {audio.isBuffering && !audio.isPlaying ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : audio.isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5 fill-current" />
                )}
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={playNext}
                disabled={queue.length === 0 && repeatMode === 'off'}
                className="h-8 w-8 sm:h-9 sm:w-9 touch-manipulation"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {FEATURES.REPEAT_MODE && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cycleRepeatMode}
                  className={cn(
                    "h-8 w-8 hidden sm:flex transition-colors",
                    repeatMode !== 'off' && "text-primary"
                  )}
                >
                  {getRepeatIcon()}
                </Button>
              )}
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground w-10 text-right hidden sm:block">
                {formatTime(audio.currentTime)}
              </span>
              <Slider
                value={[audio.currentTime]}
                max={audio.duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 hidden sm:block">
                {formatTime(audio.duration)}
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQueue(!showQueue)}
              className="relative h-8 w-8 touch-manipulation hidden sm:flex"
            >
              <ListMusic className="h-4 w-4" />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </Button>
            
            {/* Desktop Volume */}
            <div className="hidden md:flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => audio.toggleMute()}
                className="h-8 w-8 touch-manipulation"
              >
                {audio.isMuted || audio.volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[audio.isMuted ? 0 : audio.volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>
            
            {/* Mobile Volume Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => audio.toggleMute()}
              className="md:hidden h-8 w-8 touch-manipulation"
            >
              {audio.isMuted || audio.volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMinimized}
              className="h-8 w-8 touch-manipulation"
              title="Expand"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Queue Drawer */}
      {showQueue && (
        <div className="border-t bg-card p-4 sm:hidden">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold flex items-center gap-2">
              <ListMusic className="h-4 w-4" />
              Queue ({queue.length})
            </h4>
            <Button variant="ghost" size="icon" onClick={() => setShowQueue(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-48">
            {queue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Queue is empty</p>
            ) : (
              <div className="space-y-1">
                {queue.map((track, index) => (
                  <div key={track.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent/50">
                    <span className="text-xs text-muted-foreground w-5">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.title}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromQueue(track.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </Card>
  );
}
