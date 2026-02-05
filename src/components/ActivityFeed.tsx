import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { 
  Music, 
  Users, 
  Trophy, 
  Heart, 
  Zap,
  Upload
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'upload' | 'follow' | 'vote' | 'like' | 'competition';
  message: string;
  userName: string;
  userAvatar: string | null;
  timestamp: string;
  metadata?: any;
}

export function ActivityFeed({ limit = 5 }: { limit?: number }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tracks'
      }, () => fetchRecentActivity())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'followers'
      }, () => fetchRecentActivity())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'submissions'
      }, () => fetchRecentActivity())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  const fetchRecentActivity = async () => {
    try {
      const activities: Activity[] = [];

      // Fetch recent track uploads (only approved tracks)
      const { data: tracks } = await supabase
        .from('tracks')
        .select('id, title, created_at, moderation_status, artist_id')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tracks && tracks.length > 0) {
        const artistIds = [...new Set(tracks.map(t => t.artist_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', artistIds);

        tracks.forEach(track => {
          const profile = profiles?.find(p => p.id === track.artist_id);
          activities.push({
            id: `track-${track.id}`,
            type: 'upload',
            message: `uploaded "${track.title}"`,
            userName: profile?.display_name || 'An artist',
            userAvatar: profile?.avatar_url,
            timestamp: track.created_at,
          });
        });
      }

      // Fetch recent follows
      const { data: follows } = await supabase
        .from('followers')
        .select(`
          id,
          created_at,
          follower:profiles!followers_follower_id_fkey (
            display_name,
            avatar_url
          ),
          artist:profiles!followers_artist_id_fkey (
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      follows?.forEach(follow => {
        const follower = follow.follower as any;
        const artist = follow.artist as any;
        activities.push({
          id: `follow-${follow.id}`,
          type: 'follow',
          message: `started following ${artist?.display_name || 'an artist'}`,
          userName: follower?.display_name || 'Someone',
          userAvatar: follower?.avatar_url,
          timestamp: follow.created_at,
        });
      });

      // Fetch recent competition submissions (only approved)
      const { data: submissions } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          created_at,
          moderation_status,
          profiles!submissions_artist_id_fkey (
            display_name,
            avatar_url
          ),
          competitions (
            title
          )
        `)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      submissions?.forEach(sub => {
        const profile = sub.profiles as any;
        const competition = sub.competitions as any;
        activities.push({
          id: `submission-${sub.id}`,
          type: 'competition',
          message: `entered "${competition?.title || 'a competition'}"`,
          userName: profile?.display_name || 'An artist',
          userAvatar: profile?.avatar_url,
          timestamp: sub.created_at,
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(activities.slice(0, limit));
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'upload': return <Upload className="w-3 h-3" />;
      case 'follow': return <Users className="w-3 h-3" />;
      case 'vote': return <Trophy className="w-3 h-3" />;
      case 'like': return <Heart className="w-3 h-3" />;
      case 'competition': return <Trophy className="w-3 h-3" />;
      default: return <Zap className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'upload': return 'bg-primary/20 text-primary';
      case 'follow': return 'bg-blue-500/20 text-blue-500';
      case 'vote': return 'bg-yellow-500/20 text-yellow-500';
      case 'like': return 'bg-red-500/20 text-red-500';
      case 'competition': return 'bg-purple-500/20 text-purple-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity yet. Be the first!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <CardTitle className="text-lg">Live Activity</CardTitle>
        </div>
        <CardDescription>What's happening on BAK55</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity, index) => (
          <div 
            key={activity.id} 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={activity.userAvatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {activity.userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.userName}</span>
                {' '}
                <span className="text-muted-foreground">{activity.message}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>

            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${getTypeColor(activity.type)}`}>
              {getIcon(activity.type)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
