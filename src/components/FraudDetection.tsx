import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ShieldAlert, Loader2, AlertTriangle } from "lucide-react";

interface FraudDetectionProps {
  competitionId: string;
  competitionTitle: string;
}

interface FraudAnalysis {
  fraud_detected: boolean;
  risk_level: "low" | "medium" | "high";
  flagged_items: Array<{ type: string; details: string }>;
  recommendations: string[];
}

export function FraudDetection({ competitionId, competitionTitle }: FraudDetectionProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FraudAnalysis | null>(null);

  const runFraudDetection = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('detect-fraud', {
        body: { competition_id: competitionId }
      });

      if (error) throw error;

      setAnalysis(data);

      if (data.fraud_detected) {
        toast.error(`Fraud detected! Risk level: ${data.risk_level}`, {
          description: `${data.flagged_items.length} suspicious patterns found`,
        });
      } else {
        toast.success('No fraud detected', {
          description: 'Voting patterns appear normal',
        });
      }
    } catch (error: any) {
      console.error('Fraud detection error:', error);
      toast.error(error.message || 'Failed to run fraud detection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Fraud Detection - {competitionTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runFraudDetection}
          disabled={loading}
          variant={analysis?.fraud_detected ? "destructive" : "default"}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <ShieldAlert className="mr-2 h-4 w-4" />
              Run Fraud Detection
            </>
          )}
        </Button>

        {analysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge
                variant={
                  analysis.risk_level === "high"
                    ? "destructive"
                    : analysis.risk_level === "medium"
                    ? "secondary"
                    : "default"
                }
              >
                {analysis.risk_level.toUpperCase()} RISK
              </Badge>
              {analysis.fraud_detected && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  FRAUD DETECTED
                </Badge>
              )}
            </div>

            {analysis.flagged_items.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm">Flagged Issues:</p>
                <div className="space-y-2">
                  {analysis.flagged_items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="font-medium text-sm text-destructive">{item.type}</p>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm">Recommendations:</p>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
