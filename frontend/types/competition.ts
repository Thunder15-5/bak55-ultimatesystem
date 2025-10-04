// frontend/types/competition.ts
export interface Competition {
  id: string;
  title: string;
  description: string;
  theme: string;
  prizePool: number; // BAKCoins amount
  status: CompetitionStatus;
  startDate: Date;
  endDate: Date;
  votingEnd: Date;
  judgeWeight: number; // 30% expert weight
  fanWeight: number;   // 70% fan weight
  createdAt: Date;
  
  // Relations
  entries: CompetitionEntry[];
  judges: Judge[];
  creator: User;
}

export interface CompetitionEntry {
  id: string;
  competitionId: string;
  competition: Competition;
  artistId: string;
  artist: Artist;
  trackId: string;
  track: AudioTrack;
  
  // Scores
  expertScore?: number;
  fanScore?: number;
  aiScore?: number;
  finalScore?: number;
  
  // Status
  status: EntryStatus;
  rank?: number;
  
  // Engagement
  voteCount: number;
  tipCount: number;
  totalTips: number;
  
  // Timestamps
  submittedAt: Date;
}

export interface Vote {
  id: string;
  userId: string;
  user: User;
  entryId: string;
  entry: CompetitionEntry;
  cost: number; // BAKCoins spent
  createdAt: Date;
}

export interface Judge {
  id: string;
  userId: string;
  user: User;
  competitionId: string;
  competition: Competition;
  assignedAt: Date;
}

export enum CompetitionStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  VOTING = 'VOTING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum EntryStatus {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  DISQUALIFIED = 'DISQUALIFIED',
  WINNER = 'WINNER'
}

export interface CreateCompetitionData {
  title: string;
  description: string;
  theme: string;
  prizePool: number;
  startDate: Date;
  endDate: Date;
  votingEnd: Date;
  judgeWeight: number;
  fanWeight: number;
  judges: string[]; // User IDs
  entryFee?: number;
  maxEntries?: number;
  genres?: string[];
}

export interface CompetitionFilters {
  status?: CompetitionStatus;
  genre?: string;
  prizePoolMin?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
