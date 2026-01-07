import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
  ChevronUp, ChevronDown, Music, X, ListMusic, Shuffle, Repeat, Repeat1
} from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
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
    playNext,
    playPrevious,
    togglePlay,
    setIsPlaying,
    toggleMinimized,
    removeFromQueue,
    toggleShuffle,
    cycleRepeatMode,
  } = useMusicPlayer();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const hasIncrementedPlays = useRef(false);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Track change handler
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
      hasIncrementedPlays.current = false;
    }
  }, [currentTrack]);

  // Play/pause sync
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!FEATURES.KEYBOARD_SHORTCUTS || !currentTrack) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
          }
          break;
        case 'ArrowRight':
          if (audioRef.current) {
            audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          setIsMuted(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'KeyN':
          playNext();
          break;
        case 'KeyP':
          playPrevious();
          break;
        case 'KeyM':
          toggleMuteHandler();
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
  }, [currentTrack, duration, togglePlay, playNext, playPrevious, toggleShuffle, cycleRepeatMode]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);

      // Increment play count after 30 seconds
      if (
        !hasIncrementedPlays.current &&
        audioRef.current.currentTime >= 30 &&
        currentTrack
      ) {
        hasIncrementedPlays.current = true;
        
        const updatePlays = async () => {
          try {
            const { data } = await supabase
              .from("tracks")
              .select("plays")
              .eq("id", currentTrack.id)
              .single();
            
            if (data) {
              await supabase
                .from("tracks")
                .update({ plays: (data.plays || 0) + 1 })
                .eq("id", currentTrack.id);
            }
          } catch (error) {
            console.error(error);
          }
        };
        
        updatePlays();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const toggleMuteHandler = useCallback(() => {
    if (isMuted) {
      setVolume(1);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted]);

  const handleEnded = () => {
    if (repeatMode === 'one' && FEATURES.REPEAT_MODE) {
      // Restart current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else if (queue.length > 0) {
      playNext();
    } else if (repeatMode === 'all' && FEATURES.REPEAT_MODE) {
      playNext(); // Will restart queue in context
    } else {
      setIsPlaying(false);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
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

  return (
    <>
      <Card className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-xl shadow-2xl safe-area-bottom">
        {/* Expanded Player */}
        {!isMinimized && (
          <div className="border-b border-border p-4 sm:p-6">
            <div className="container mx-auto">
              {/* Mobile: Stacked layout */}
              <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                {/* Album Art - Smaller on mobile */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-lg bg-muted flex-shrink-0 overflow-hidden shadow-lg mx-auto lg:mx-0">
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
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 sm:[&_[role=slider]]:h-5 sm:[&_[role=slider]]:w-5"
                    />
                    <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    {/* Shuffle Button */}
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
                    <Button
                      variant="default"
                      size="icon"
                      onClick={togglePlay}
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-xl hover:scale-110 transition-all touch-manipulation"
                      title="Play/Pause (Space)"
                    >
                      {isPlaying ? (
                        <Pause className="h-7 w-7 sm:h-8 sm:w-8 fill-current" />
                      ) : (
                        <Play className="h-7 w-7 sm:h-8 sm:w-8 ml-0.5 fill-current" />
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

                    {/* Repeat Button */}
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
                </div>

                {/* Queue Panel - Hidden on mobile */}
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
                              <p className="text-sm font-medium truncate">
                                {track.title}
                              </p>
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
        )}

        {/* Mini Player */}
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-14 h-14 rounded bg-muted flex-shrink-0 overflow-hidden shadow-md">
                {currentTrack.cover_image ? (
                  <img
                    src={currentTrack.cover_image}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <Music className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{currentTrack.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentTrack.profiles.username}
                </p>
              </div>
            </div>

            {/* Controls - Center */}
            <div className="flex flex-col items-center gap-2 flex-[2] max-w-2xl">
              <div className="flex items-center gap-1 sm:gap-3">
                {/* Shuffle - Mini */}
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
                  className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
                >
                  <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button 
                  variant="default" 
                  size="icon" 
                  onClick={togglePlay}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:scale-110 transition-all touch-manipulation"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 sm:h-7 sm:w-7 fill-current" />
                  ) : (
                    <Play className="h-6 w-6 sm:h-7 sm:w-7 ml-0.5 fill-current" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playNext}
                  disabled={queue.length === 0 && repeatMode === 'off'}
                  className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
                >
                  <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>

                {/* Repeat - Mini */}
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
              {isMinimized && (
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {formatTime(currentTime)}
                  </span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {formatTime(duration)}
                  </span>
                </div>
              )}
            </div>

            {/* Volume & Actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQueue(!showQueue)}
                className="relative h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
              >
                <ListMusic className="h-4 w-4 sm:h-5 sm:w-5" />
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                    {queue.length}
                  </span>
                )}
              </Button>
              
              {/* Desktop Volume Controls */}
              <div className="hidden md:flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMuteHandler}
                  className="h-10 w-10 touch-manipulation"
                  title="Mute (M)"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-20 lg:w-24"
                />
              </div>
              
              {/* Mobile Volume Toggle (tap to mute/unmute) */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMuteHandler}
                className="md:hidden h-9 w-9 touch-manipulation"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMinimized}
                className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
              >
                {isMinimized ? (
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        {FEATURES.KEYBOARD_SHORTCUTS && !isMinimized && (
          <div className="text-center text-xs text-muted-foreground pb-2">
            Keyboard: Space (play/pause) • ←→ (seek) • ↑↓ (volume) • N/P (next/prev) • M (mute) • S (shuffle) • R (repeat)
          </div>
        )}
      </Card>

      <audio
        ref={audioRef}
        src={currentTrack.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
    </>
  );
}
