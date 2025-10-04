// frontend/store/competition-store.ts
import { create } from 'zustand';
import { Competition, CompetitionEntry, CreateCompetitionData, CompetitionFilters, Vote } from '@/types/competition';

interface CompetitionState {
  // State
  competitions: Competition[];
  currentCompetition: Competition | null;
  entries: CompetitionEntry[];
  userVotes: Map<string, number>; // entryId -> vote count
  isLoading: boolean;
  
  // Actions
  fetchCompetitions: (filters?: CompetitionFilters) => Promise<void>;
  fetchCompetition: (id: string) => Promise<void>;
  createCompetition: (data: CreateCompetitionData) => Promise<Competition>;
  enterCompetition: (competitionId: string, trackId: string) => Promise<CompetitionEntry>;
  voteForEntry: (entryId: string, votes: number) => Promise<Vote>;
  fetchEntries: (competitionId: string) => Promise<void>;
  fetchLeaderboard: (competitionId: string) => Promise<CompetitionEntry[]>;
  judgeEntry: (entryId: string, score: number) => Promise<void>;
  
  // Real-time updates
  subscribeToCompetition: (competitionId: string) => void;
  unsubscribeFromCompetition: (competitionId: string) => void;
}

export const useCompetitionStore = create<CompetitionState>((set, get) => ({
  // Initial state
  competitions: [],
  currentCompetition: null,
  entries: [],
  userVotes: new Map(),
  isLoading: false,

  // Fetch competitions with filters
  fetchCompetitions: async (filters?: CompetitionFilters) => {
    set({ isLoading: true });
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.genre) queryParams.append('genre', filters.genre);
      if (filters?.prizePoolMin) queryParams.append('prizePoolMin', filters.prizePoolMin.toString());

      const response = await fetch(`/api/competitions?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch competitions');

      const competitions = await response.json();
      set({ competitions, isLoading: false });
    } catch (error) {
      console.error('Error fetching competitions:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Fetch single competition
  fetchCompetition: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/competitions/${id}`);
      if (!response.ok) throw new Error('Failed to fetch competition');

      const competition = await response.json();
      set({ currentCompetition: competition, isLoading: false });
    } catch (error) {
      console.error('Error fetching competition:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Create new competition
  createCompetition: async (data: CreateCompetitionData): Promise<Competition> => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const competition = await response.json();
      set(state => ({ 
        competitions: [competition, ...state.competitions],
        isLoading: false 
      }));
      
      return competition;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Enter competition with a track
  enterCompetition: async (competitionId: string, trackId: string): Promise<CompetitionEntry> => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/competitions/${competitionId}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const entry = await response.json();
      set(state => ({ 
        entries: [...state.entries, entry],
        isLoading: false 
      }));
      
      return entry;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Vote for competition entry
  voteForEntry: async (entryId: string, votes: number): Promise<Vote> => {
    try {
      const response = await fetch(`/api/competitions/entries/${entryId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const vote = await response.json();
      
      // Update local state
      set(state => {
        const newUserVotes = new Map(state.userVotes);
        newUserVotes.set(entryId, (newUserVotes.get(entryId) || 0) + votes);
        
        const updatedEntries = state.entries.map(entry => 
          entry.id === entryId 
            ? { ...entry, voteCount: entry.voteCount + votes }
            : entry
        );

        return { 
          userVotes: newUserVotes,
          entries: updatedEntries
        };
      });

      return vote;
    } catch (error) {
      console.error('Error voting for entry:', error);
      throw error;
    }
  },

  // Fetch competition entries
  fetchEntries: async (competitionId: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/competitions/${competitionId}/entries`);
      if (!response.ok) throw new Error('Failed to fetch entries');

      const entries = await response.json();
      set({ entries, isLoading: false });
    } catch (error) {
      console.error('Error fetching entries:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Fetch leaderboard
  fetchLeaderboard: async (competitionId: string): Promise<CompetitionEntry[]> => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}/leaderboard`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const leaderboard = await response.json();
      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },

  // Judge entry (for judges only)
  judgeEntry: async (entryId: string, score: number) => {
    try {
      const response = await fetch(`/api/competitions/entries/${entryId}/judge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Update local state
      set(state => ({
        entries: state.entries.map(entry =>
          entry.id === entryId
            ? { ...entry, expertScore: score }
            : entry
        )
      }));
    } catch (error) {
      console.error('Error judging entry:', error);
      throw error;
    }
  },

  // Real-time subscription (placeholder for WebSocket implementation)
  subscribeToCompetition: (competitionId: string) => {
    console.log('Subscribing to competition updates:', competitionId);
    // WebSocket implementation would go here
  },

  unsubscribeFromCompetition: (competitionId: string) => {
    console.log('Unsubscribing from competition:', competitionId);
    // WebSocket cleanup would go here
  },
}));
