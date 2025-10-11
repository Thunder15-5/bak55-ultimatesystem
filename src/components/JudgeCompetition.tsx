import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Brain, Loader2 } from "lucide-react";

interface JudgeCompetitionProps {
  competitionId: string;
}

export function JudgeCompetition({ competitionId }: JudgeCompetitionProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleRunAIJudging = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-judge-submission", {
        body: { competition_id: competitionId },
      });

      if (error) throw error;

      setResults(data);
      toast.success("AI judging completed! Scores calculated: 70% fan votes + 30% AI analysis.");
    } catch (error: any) {
      toast.error(error.message || "Failed to run AI judging");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Judging System
        </CardTitle>
        <CardDescription>
          Apply 30% AI scoring to competition submissions (70% fan votes + 30% AI analysis)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleRunAIJudging} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running AI Judging...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Run AI Judging
            </>
          )}
        </Button>

        {results && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Judging Results:</p>
            <div className="space-y-1">
              {results.submissions?.slice(0, 5).map((sub: any, idx: number) => (
                <div key={sub.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <span>#{idx + 1}</span>
                  <span>Final Score: {sub.final_score.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">
                    (Fan: {sub.fan_score.toFixed(1)} + AI: {sub.ai_score.toFixed(1)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}