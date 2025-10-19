import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
  ChevronUp, ChevronDown, Music, X, ListMusic
} from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function PersistentMusicPlayer() {
  const {
    currentTrack,
    queue,
    isPlaying,
    isMinimized,
    playNext,
    playPrevious,
    togglePlay,
    setIsPlaying,
    toggleMinimized,
    removeFromQueue,
  } = useMusicPlayer();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const hasIncrementedPlays = useRef(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
      hasIncrementedPlays.current = false;
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

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
        
        // Get current plays and increment
        const updatePlays = async () => {
          try {
            const { data } = await supabase
              .from("tracks")
              .select("plays")
              .eq("id", currentTrack.id)
              .single();
            
            if (data) {
              // Update play count for analytics
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

  const toggleMuteHandler = () => {
    if (isMuted) {
      setVolume(1);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleEnded = () => {
    if (queue.length > 0) {
      playNext();
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

  if (!currentTrack) return null;

  return (
    <>
      <Card className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-xl shadow-2xl">
        {/* Expanded Player */}
        {!isMinimized && (
          <div className="border-b border-border p-6">
            <div className="container mx-auto">
              <div className="flex items-start gap-6">
                {/* Large Album Art */}
                <div className="w-48 h-48 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {currentTrack.cover_image ? (
                    <img
                      src={currentTrack.cover_image}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-20 w-20 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Track Details & Controls */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{currentTrack.title}</h3>
                    <p className="text-lg text-muted-foreground">
                      {currentTrack.profiles.username}
                    </p>
                    {currentTrack.genre && (
                      <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
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
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={playPrevious}
                      className="h-12 w-12"
                    >
                      <SkipBack className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={togglePlay}
                      className="h-16 w-16 rounded-full"
                    >
                      {isPlaying ? (
                        <Pause className="h-8 w-8" />
                      ) : (
                        <Play className="h-8 w-8 ml-1" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={playNext}
                      disabled={queue.length === 0}
                      className="h-12 w-12"
                    >
                      <SkipForward className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                {/* Queue Panel */}
                <div className="w-80 space-y-2">
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
              <div className="w-14 h-14 rounded bg-muted flex-shrink-0 overflow-hidden">
                {currentTrack.cover_image ? (
                  <img
                    src={currentTrack.cover_image}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
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
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={playPrevious}>
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={togglePlay}>
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playNext}
                  disabled={queue.length === 0}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
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
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQueue(!showQueue)}
                className="relative"
              >
                <ListMusic className="h-5 w-5" />
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {queue.length}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleMuteHandler}>
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
                className="w-24 hidden lg:block"
              />
              <Button variant="ghost" size="icon" onClick={toggleMinimized}>
                {isMinimized ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
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
