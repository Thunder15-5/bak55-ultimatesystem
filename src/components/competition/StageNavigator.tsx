import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock, Users, CheckCircle2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface Stage {
  id: string;
  stage_number: number;
  stage_name: string;
  stage_type: string;
  description: string | null;
  start_date: string;
  end_date: string;
  voting_start_date: string | null;
  voting_end_date: string | null;
  max_participants: number | null;
  elimination_count: number | null;
  challenge_theme: string | null;
  status: string;
}

interface StageNavigatorProps {
  competitionId: string;
}

export function StageNavigator({ competitionId }: StageNavigatorProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStages();
  }, [competitionId]);

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('competition_stages')
        .select('*')
        .eq('competition_id', competitionId)
        .order('stage_number', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageProgress = () => {
    const completedStages = stages.filter(s => s.status === 'completed').length;
    return (completedStages / stages.length) * 100;
  };

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-primary';
      case 'voting': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  const getTimeRemaining = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return 'Ended';
    if (days === 0) return 'Today';
    return `${days}d remaining`;
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Competition Journey</h3>
          <Badge variant="secondary">
            Stage {stages.filter(s => s.status === 'completed').length + 1} of {stages.length}
          </Badge>
        </div>
        <Progress value={getStageProgress()} className="h-2" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage, index) => (
          <Card
            key={stage.id}
            className={`p-4 transition-all hover:shadow-md ${
              stage.status === 'active' ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Stage {stage.stage_number}
                    </span>
                    {stage.status === 'completed' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <h4 className="font-semibold">{stage.stage_name}</h4>
                </div>
                <div className={`h-2 w-2 rounded-full ${getStageStatusColor(stage.status)}`} />
              </div>

              {stage.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {stage.description}
                </p>
              )}

              {stage.challenge_theme && (
                <Badge variant="outline" className="text-xs">
                  {stage.challenge_theme}
                </Badge>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                {stage.max_participants && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{stage.max_participants} artists</span>
                  </div>
                )}
                {stage.elimination_count && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    <span>-{stage.elimination_count} elim</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {stage.status === 'upcoming' 
                    ? `Starts ${format(new Date(stage.start_date), 'MMM d')}`
                    : stage.status === 'completed'
                    ? `Ended ${format(new Date(stage.end_date), 'MMM d')}`
                    : getTimeRemaining(stage.end_date)
                  }
                </span>
              </div>

              <div className="pt-2 border-t">
                <Badge
                  variant={
                    stage.status === 'active' ? 'default' :
                    stage.status === 'completed' ? 'secondary' :
                    'outline'
                  }
                  className="text-xs"
                >
                  {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}