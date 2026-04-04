import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ActiveCompetitionCardProps {
  userId: string;
}

export function ActiveCompetitionCard({ userId }: ActiveCompetitionCardProps) {
  const navigate = useNavigate();
  const [comp, setComp] = useState<any>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: competition } = await supabase
        .from("competitions")
        .select("id, title, prize_amount, end_date, cover_image")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!competition) return;
      setComp(competition);

      const { count } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", userId)
        .eq("competition_id", competition.id);

      setHasSubmitted((count || 0) > 0);
    };
    fetch();
  }, [userId]);

  if (!comp) return null;

  const daysLeft = Math.max(0, Math.ceil((new Date(comp.end_date).getTime() - Date.now()) / 86400000));

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[10px]">
                <Clock className="w-2.5 h-2.5 mr-1" />
                {daysLeft} days left
              </Badge>
              {hasSubmitted && (
                <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-400">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                  Submitted
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm truncate">{comp.title}</h3>
            <p className="text-xs text-muted-foreground">
              {comp.prize_amount} BAKCoins prize pool
            </p>
            <Button
              size="sm"
              className="h-8 text-xs mt-1"
              onClick={() =>
                hasSubmitted
                  ? navigate(`/competitions/${comp.id}`)
                  : navigate(`/artist/upload?competition=${comp.id}`)
              }
            >
              {hasSubmitted ? "View Entry" : "Submit Track"}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
