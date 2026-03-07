import { useWithdrawalEligibility } from "@/hooks/useWithdrawalEligibility";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface WithdrawalEligibilityCardProps {
  userId: string;
}

export function WithdrawalEligibilityCard({ userId }: WithdrawalEligibilityCardProps) {
  const { eligibility, loading } = useWithdrawalEligibility(userId);

  if (loading || !eligibility) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-16 bg-muted/20 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${eligibility.eligible ? 'border-green-500/30' : 'border-yellow-500/30'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-primary" />
            Withdrawal Status
          </CardTitle>
          <Badge variant={eligibility.eligible ? "default" : "secondary"}>
            {eligibility.eligible ? "Eligible" : "Not Eligible"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 rounded bg-muted/50">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="font-bold">{eligibility.balance.toFixed(2)} BAK</p>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <p className="text-xs text-muted-foreground">In Escrow</p>
            <p className="font-bold">{eligibility.escrow_held.toFixed(2)} BAK</p>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="font-bold text-primary">{eligibility.available_balance.toFixed(2)} BAK</p>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <p className="text-xs text-muted-foreground">Min Withdrawal</p>
            <p className="font-bold">{eligibility.min_withdrawal} BAK</p>
          </div>
        </div>

        {!eligibility.eligible && eligibility.issues.length > 0 && (
          <div className="space-y-2">
            {eligibility.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{issue}</span>
              </div>
            ))}
            {eligibility.level.requires_kyc && eligibility.level.kyc_status !== 'approved' && (
              <Link to="/profile?tab=kyc">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Lock className="w-3 h-3 mr-1" />
                  Complete KYC Verification
                </Button>
              </Link>
            )}
          </div>
        )}

        {eligibility.eligible && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            You can withdraw up to {eligibility.available_balance.toFixed(2)} BAK
          </div>
        )}
      </CardContent>
    </Card>
  );
}
