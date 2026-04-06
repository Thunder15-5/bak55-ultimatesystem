import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Share2, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface Winner {
  id: string;
  artist_id: string;
  artist_name: string;
  track_title: string;
  avatar_url: string | null;
  cover_image: string | null;
  vote_count: number;
  placement: number;
  prize_amount: number;
}

interface WinnerRevealProps {
  winners: Winner[];
  competitionTitle: string;
  onShare?: (winner: Winner) => void;
}

export function WinnerReveal({ winners, competitionTitle, onShare }: WinnerRevealProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (winners.length === 0) return null;

  const champion = winners[0];
  const runnersUp = winners.slice(1, 3);

  return (
    <div className="space-y-6">
      {/* Champion Card */}
      <Card className={`relative overflow-hidden border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 via-background to-yellow-500/5 transition-all duration-1000 ${
        revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-primary to-yellow-500" />
        <div className="p-6 sm:p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-4">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-bold text-yellow-500">Champion</span>
          </div>

          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-yellow-500/50 bg-muted">
            {champion.avatar_url ? (
              <img src={champion.avatar_url} alt={champion.artist_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🏆</div>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold mb-1">{champion.artist_name}</h3>
          <p className="text-muted-foreground mb-3">"{champion.track_title}"</p>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge variant="secondary" className="text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              {champion.vote_count} votes
            </Badge>
            <Badge className="text-sm bg-yellow-500 text-black hover:bg-yellow-500">
              <Trophy className="h-3 w-3 mr-1" />
              {champion.prize_amount.toLocaleString()} BAK
            </Badge>
          </div>

          <div className="flex justify-center gap-3">
            <Link to={`/artist/${champion.artist_id}`}>
              <Button size="sm">View Profile</Button>
            </Link>
            {onShare && (
              <Button size="sm" variant="outline" onClick={() => onShare(champion)}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Runners Up */}
      {runnersUp.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {runnersUp.map((winner) => (
            <Card key={winner.id} className="p-4 bg-card/50 border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {winner.avatar_url ? (
                    <img src={winner.avatar_url} alt={winner.artist_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {winner.placement === 2 ? "🥈" : "🥉"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{winner.artist_name}</span>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                      {winner.placement === 2 ? "2nd" : "3rd"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">"{winner.track_title}"</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium">{winner.vote_count} votes</span>
                    <span className="text-xs text-primary font-semibold">{winner.prize_amount.toLocaleString()} BAK</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
