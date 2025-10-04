// frontend/types/audio.ts
export interface AudioTrack {
  id: string;
  title: string;
  artistId: string;
  artist: {
    id: string;
    stageName: string;
    user: {
      username: string;
      avatar?: string;
    };
  };
  audioUrl: string;
  duration: number;
  genre: string;
  bpm?: number;
  key?: string;
  audioFeatures?: AudioFeatures;
  mood?: string;
  energyLevel?: number;
  playCount: number;
  likeCount: number;
  shareCount: number;
  tipCount: number;
  totalTips: number;
  createdAt: Date;
  status: 'PROCESSING' | 'READY' | 'FAILED';
}

export interface AudioFeatures {
  tempo: number;
  key: number;
  mode: number;
  timeSignature: number;
  danceability: number;
  energy: number;
  loudness: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
}

export interface UploadTrackRequest {
  title: string;
  genre: string;
  audioFile: File;
  bpm?: number;
  key?: string;
  isPublic: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  currentTrack: AudioTrack | null;
  queue: AudioTrack[];
  currentIndex: number;
}

export interface AudioAnalysis {
  waveform: number[];
  peaks: number[];
  duration: number;
}
