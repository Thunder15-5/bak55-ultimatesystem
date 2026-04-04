import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Opportunity {
  id: string;
  title: string;
  prize_amount: number;
  end_date: string;
  status: string;
}

export function OpportunitiesFeed() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, prize_amount, end_date, status")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) setOpportunities(data);
    };
    fetch();
  }, []);

  if (opportunities.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-2">
            <Trophy className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">No open competitions right now</p>
            <p className="text-xs text-muted-foreground">Check back soon for new opportunities!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Opportunities
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/artist/competitions")}>
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {opportunities.map((opp) => {
          const daysLeft = Math.max(0, Math.ceil((new Date(opp.end_date).getTime() - Date.now()) / 86400000));
          return (
            <div
              key={opp.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/competitions/${opp.id}`)}
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{opp.title}</p>
                <p className="text-xs text-muted-foreground">{opp.prize_amount} BAK prize</p>
              </div>
              <Badge variant="outline" className="text-[10px] flex-shrink-0">
                {daysLeft}d left
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
