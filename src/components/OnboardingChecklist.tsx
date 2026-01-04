import { useOnboarding } from '@/hooks/useOnboarding';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Circle, 
  Music, 
  Users, 
  ListMusic, 
  Trophy, 
  User, 
  Upload, 
  BarChart, 
  X,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  music: Music,
  users: Users,
  'list-music': ListMusic,
  trophy: Trophy,
  user: User,
  upload: Upload,
  'bar-chart': BarChart,
};

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const {
    steps,
    loading,
    showOnboarding,
    dismissOnboarding,
    progress,
    completedCount,
    totalSteps,
  } = useOnboarding();

  if (loading || !showOnboarding || steps.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Getting Started</CardTitle>
              <CardDescription className="text-xs">Complete these steps to unlock all features</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={dismissOnboarding}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <Badge variant="secondary" className="font-semibold">
              {completedCount}/{totalSteps} Complete
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="relative space-y-2 pt-0">
        {steps.map((step, index) => {
          const Icon = ICON_MAP[step.icon] || Circle;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                step.completed 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                step.completed 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${step.completed ? 'text-green-600 dark:text-green-400' : ''}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>

              {!step.completed && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0 h-8 px-2 text-xs"
                  onClick={() => navigate(step.actionUrl)}
                >
                  {step.action}
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
