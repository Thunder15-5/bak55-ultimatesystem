import { useMemo } from 'react';

export type CompetitionPhase = 
  | 'opening_soon' 
  | 'submissions_open' 
  | 'voting_soon' 
  | 'voting_open' 
  | 'completed' 
  | 'closed';

interface Competition {
  start_date: string;
  end_date: string;
  voting_start_date?: string | null;
  voting_end_date?: string | null;
  status?: string;
}

interface CompetitionPhaseResult {
  phase: CompetitionPhase;
  label: string;
  description: string;
  color: string;
  canSubmit: boolean;
  canVote: boolean;
}

export function useCompetitionPhase(competition: Competition | null): CompetitionPhaseResult {
  return useMemo(() => {
    if (!competition) {
      return {
        phase: 'closed' as CompetitionPhase,
        label: 'Unknown',
        description: 'Competition status unavailable',
        color: 'bg-muted',
        canSubmit: false,
        canVote: false,
      };
    }

    const now = new Date();
    const startDate = new Date(competition.start_date);
    const endDate = new Date(competition.end_date);
    const votingStartDate = competition.voting_start_date ? new Date(competition.voting_start_date) : null;
    const votingEndDate = competition.voting_end_date ? new Date(competition.voting_end_date) : null;

    // Check explicit status first
    if (competition.status === 'completed' || competition.status === 'closed') {
      return {
        phase: 'completed' as CompetitionPhase,
        label: 'Completed',
        description: 'This competition has ended',
        color: 'bg-muted',
        canSubmit: false,
        canVote: false,
      };
    }

    // Opening soon (before start date)
    if (now < startDate) {
      return {
        phase: 'opening_soon' as CompetitionPhase,
        label: 'Opening Soon',
        description: `Submissions open ${startDate.toLocaleDateString()}`,
        color: 'bg-blue-500',
        canSubmit: false,
        canVote: false,
      };
    }

    // Voting is open
    if (votingStartDate && votingEndDate && now >= votingStartDate && now <= votingEndDate) {
      return {
        phase: 'voting_open' as CompetitionPhase,
        label: 'Voting Open',
        description: 'Cast your votes now!',
        color: 'bg-secondary',
        canSubmit: false,
        canVote: true,
      };
    }

    // Voting soon (submissions ended, voting not yet started)
    if (now > endDate && votingStartDate && now < votingStartDate) {
      return {
        phase: 'voting_soon' as CompetitionPhase,
        label: 'Voting Soon',
        description: `Voting starts ${votingStartDate.toLocaleDateString()}`,
        color: 'bg-amber-500',
        canSubmit: false,
        canVote: false,
      };
    }

    // Submissions open (between start and end date)
    if (now >= startDate && now <= endDate) {
      return {
        phase: 'submissions_open' as CompetitionPhase,
        label: 'Submissions Open',
        description: 'Submit your track now!',
        color: 'bg-primary',
        canSubmit: true,
        canVote: false,
      };
    }

    // Competition has ended (past voting end date or no voting dates set)
    if (votingEndDate && now > votingEndDate) {
      return {
        phase: 'completed' as CompetitionPhase,
        label: 'Completed',
        description: 'This competition has ended',
        color: 'bg-muted',
        canSubmit: false,
        canVote: false,
      };
    }

    // Default: ended without voting phase
    if (now > endDate) {
      return {
        phase: 'completed' as CompetitionPhase,
        label: 'Completed',
        description: 'This competition has ended',
        color: 'bg-muted',
        canSubmit: false,
        canVote: false,
      };
    }

    // Fallback
    return {
      phase: 'closed' as CompetitionPhase,
      label: 'Closed',
      description: 'This competition is not available',
      color: 'bg-muted',
      canSubmit: false,
      canVote: false,
    };
  }, [competition]);
}

export function getCompetitionPhase(competition: Competition | null): CompetitionPhaseResult {
  if (!competition) {
    return {
      phase: 'closed',
      label: 'Unknown',
      description: 'Competition status unavailable',
      color: 'bg-muted',
      canSubmit: false,
      canVote: false,
    };
  }

  const now = new Date();
  const startDate = new Date(competition.start_date);
  const endDate = new Date(competition.end_date);
  const votingStartDate = competition.voting_start_date ? new Date(competition.voting_start_date) : null;
  const votingEndDate = competition.voting_end_date ? new Date(competition.voting_end_date) : null;

  if (competition.status === 'completed' || competition.status === 'closed') {
    return {
      phase: 'completed',
      label: 'Completed',
      description: 'This competition has ended',
      color: 'bg-muted',
      canSubmit: false,
      canVote: false,
    };
  }

  if (now < startDate) {
    return {
      phase: 'opening_soon',
      label: 'Opening Soon',
      description: `Submissions open ${startDate.toLocaleDateString()}`,
      color: 'bg-blue-500',
      canSubmit: false,
      canVote: false,
    };
  }

  if (votingStartDate && votingEndDate && now >= votingStartDate && now <= votingEndDate) {
    return {
      phase: 'voting_open',
      label: 'Voting Open',
      description: 'Cast your votes now!',
      color: 'bg-secondary',
      canSubmit: false,
      canVote: true,
    };
  }

  if (now > endDate && votingStartDate && now < votingStartDate) {
    return {
      phase: 'voting_soon',
      label: 'Voting Soon',
      description: `Voting starts ${votingStartDate.toLocaleDateString()}`,
      color: 'bg-amber-500',
      canSubmit: false,
      canVote: false,
    };
  }

  if (now >= startDate && now <= endDate) {
    return {
      phase: 'submissions_open',
      label: 'Submissions Open',
      description: 'Submit your track now!',
      color: 'bg-primary',
      canSubmit: true,
      canVote: false,
    };
  }

  return {
    phase: 'completed',
    label: 'Completed',
    description: 'This competition has ended',
    color: 'bg-muted',
    canSubmit: false,
    canVote: false,
  };
}
