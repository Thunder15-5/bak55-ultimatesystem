import { useArtistLevel } from "@/hooks/useArtistLevel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Lock, CheckCircle2, Crown } from "lucide-react";

interface ArtistLevelCardProps {
  userId: string;
  compact?: boolean;
}

export function ArtistLevelCard({ userId, compact = false }: ArtistLevelCardProps) {
  const { level, loading, getNextLevel, getProgress } = useArtistLevel(userId);

  if (loading || !level) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-20 bg-muted/20 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const nextLevel = getNextLevel();
  const progress = getProgress();

  if (compact) {
    return (
      <Badge variant="outline" className="gap-1 text-sm py-1 px-3">
        <span>{level.badge}</span>
        <span className="font-semibold">{level.name}</span>
        <span className="text-muted-foreground">Lv.{level.level}</span>
      </Badge>
    );
  }

  return (
    <Card className="border-primary/20 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{level.badge}</span>
            {level.name}
          </CardTitle>
          <Badge variant={level.level >= 3 ? "default" : "secondary"}>
            Level {level.level}
          </Badge>
        </div>
        <CardDescription>
          {nextLevel ? "Keep growing to unlock more perks!" : "You've reached the highest level!"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current perks */}
        <div className="grid grid-cols-2 gap-2">
          {level.perks.map((perk, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
              <span>{perk}</span>
            </div>
          ))}
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium flex items-center gap-1">
              <Zap className="w-4 h-4 text-primary" />
              Next: {nextLevel.badge_icon} {nextLevel.level_name}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Streams: {level.streams.toLocaleString()} / {nextLevel.min_streams.toLocaleString()}</span>
                <span>{Math.round(progress.streams)}%</span>
              </div>
              <Progress value={progress.streams} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Followers: {level.followers.toLocaleString()} / {nextLevel.min_followers.toLocaleString()}</span>
                <span>{Math.round(progress.followers)}%</span>
              </div>
              <Progress value={progress.followers} className="h-2" />
            </div>
            {nextLevel.requires_kyc && level.kyc_status !== 'approved' && (
              <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 p-2 rounded">
                <Lock className="w-3 h-3" />
                KYC verification required for Level {nextLevel.level_number}
              </div>
            )}
          </div>
        )}

        {/* Withdrawal status */}
        <div className={`flex items-center gap-2 text-xs p-2 rounded ${
          level.can_withdraw ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'
        }`}>
          {level.can_withdraw ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Withdrawals enabled
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              Reach the required level and complete verification to unlock withdrawals
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
