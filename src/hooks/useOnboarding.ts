import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  actionUrl: string;
  icon: string;
  completed: boolean;
}

const FAN_STEPS: Omit<OnboardingStep, 'completed'>[] = [
  {
    id: 'discover',
    title: 'Discover Music',
    description: 'Listen to your first track',
    action: 'Browse Tracks',
    actionUrl: '/fan/discover',
    icon: 'music',
  },
  {
    id: 'follow',
    title: 'Follow an Artist',
    description: 'Support artists you love',
    action: 'Find Artists',
    actionUrl: '/catalog',
    icon: 'users',
  },
  {
    id: 'playlist',
    title: 'Create a Playlist',
    description: 'Organize your favorites',
    action: 'Create Playlist',
    actionUrl: '/playlists',
    icon: 'list-music',
  },
  {
    id: 'vote',
    title: 'Vote in a Competition',
    description: 'Support emerging talent',
    action: 'View Competitions',
    actionUrl: '/competitions/active',
    icon: 'trophy',
  },
];

const ARTIST_STEPS: Omit<OnboardingStep, 'completed'>[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add a bio and avatar',
    action: 'Edit Profile',
    actionUrl: '/profile',
    icon: 'user',
  },
  {
    id: 'upload',
    title: 'Upload Your First Track',
    description: 'Share your music with the world',
    action: 'Upload Track',
    actionUrl: '/upload',
    icon: 'upload',
  },
  {
    id: 'competition',
    title: 'Enter a Competition',
    description: 'Compete for prizes and exposure',
    action: 'View Competitions',
    actionUrl: '/competitions',
    icon: 'trophy',
  },
  {
    id: 'analytics',
    title: 'Check Your Analytics',
    description: 'See how your music performs',
    action: 'View Analytics',
    actionUrl: '/analytics',
    icon: 'bar-chart',
  },
];

export function useOnboarding() {
  const { user, userRole } = useAuth();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const checkStepCompletion = useCallback(async () => {
    if (!user) return;

    const completedSteps: Record<string, boolean> = {};
    const isArtist = userRole === 'artist';

    if (isArtist) {
      // Check profile completion
      const { data: profile } = await supabase
        .from('profiles')
        .select('bio, avatar_url')
        .eq('id', user.id)
        .single();
      completedSteps['profile'] = !!(profile?.bio && profile?.avatar_url);

      // Check track uploads
      const { count: trackCount } = await supabase
        .from('tracks')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', user.id);
      completedSteps['upload'] = (trackCount || 0) > 0;

      // Check competition entries
      const { count: submissionCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', user.id);
      completedSteps['competition'] = (submissionCount || 0) > 0;

      // Analytics is considered "done" once they have a track
      completedSteps['analytics'] = (trackCount || 0) > 0;
    } else {
      // Check listening history
      const { count: listenCount } = await supabase
        .from('listening_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      completedSteps['discover'] = (listenCount || 0) > 0;

      // Check follows
      const { count: followCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);
      completedSteps['follow'] = (followCount || 0) > 0;

      // Check playlists
      const { count: playlistCount } = await supabase
        .from('playlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      completedSteps['playlist'] = (playlistCount || 0) > 0;

      // Check votes
      const { count: voteCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('voter_id', user.id);
      completedSteps['vote'] = (voteCount || 0) > 0;
    }

    const baseSteps = isArtist ? ARTIST_STEPS : FAN_STEPS;
    const stepsWithCompletion = baseSteps.map(step => ({
      ...step,
      completed: completedSteps[step.id] || false,
    }));

    setSteps(stepsWithCompletion);
    
    // Find first incomplete step
    const firstIncomplete = stepsWithCompletion.findIndex(s => !s.completed);
    setCurrentStepIndex(firstIncomplete >= 0 ? firstIncomplete : 0);

    // Check if onboarding is complete
    const { data: profileData } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    const allComplete = stepsWithCompletion.every(s => s.completed);
    if (allComplete && !profileData?.onboarding_completed) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
    }

    setShowOnboarding(!profileData?.onboarding_completed && !allComplete);
    setLoading(false);
  }, [user, userRole]);

  useEffect(() => {
    if (user) {
      checkStepCompletion();
    }
  }, [user, checkStepCompletion]);

  const dismissOnboarding = async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);
    setShowOnboarding(false);
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return {
    steps,
    loading,
    showOnboarding,
    currentStepIndex,
    setCurrentStepIndex,
    dismissOnboarding,
    refreshSteps: checkStepCompletion,
    progress,
    completedCount,
    totalSteps: steps.length,
  };
}
