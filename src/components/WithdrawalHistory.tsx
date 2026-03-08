import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Loader2, ArrowDownRight } from "lucide-react";

interface WithdrawalRequest {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  metadata: any;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-600", icon: Clock },
  pending_manual: { label: "Under Review", color: "bg-yellow-500/20 text-yellow-600", icon: Clock },
  processing: { label: "Processing", color: "bg-blue-500/20 text-blue-600", icon: Loader2 },
  approved: { label: "Approved", color: "bg-green-500/20 text-green-600", icon: CheckCircle2 },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-600", icon: CheckCircle2 },
  paid: { label: "Paid", color: "bg-green-500/20 text-green-600", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-destructive/20 text-destructive", icon: XCircle },
  failed: { label: "Failed", color: "bg-destructive/20 text-destructive", icon: XCircle },
};

export function WithdrawalHistory({ userId }: { userId: string }) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!wallet) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .eq("type", "withdrawal")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setWithdrawals(data);
      }
      setLoading(false);
    };

    fetchWithdrawals();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Withdrawal History</CardTitle>
          <CardDescription>Your past withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">No withdrawal requests yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowDownRight className="w-5 h-5 text-primary" />
          Withdrawal History
        </CardTitle>
        <CardDescription>Track your withdrawal requests and their status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {withdrawals.map((w) => {
          const status = (w.metadata as any)?.status || "pending";
          const config = statusConfig[status] || statusConfig.pending;
          const StatusIcon = config.icon;
          const fee = (w.metadata as any)?.fee_amount;
          const net = (w.metadata as any)?.net_amount;
          const phone = (w.metadata as any)?.phone_number;

          return (
            <div
              key={w.id}
              className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 flex-shrink-0 ${status === 'processing' ? 'animate-spin' : ''}`} />
                  <span className="font-medium text-sm truncate">{w.description}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs ${config.color} border-0`}>
                    {config.label}
                  </Badge>
                  {phone && (
                    <span className="text-xs text-muted-foreground">To: {phone}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(w.created_at).toLocaleDateString()} • {new Date(w.created_at).toLocaleTimeString()}
                </p>
                {fee && (
                  <p className="text-xs text-muted-foreground">
                    Fee: {fee} BAK • Net: {net} BAK
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="font-bold text-destructive">{Math.abs(w.amount).toFixed(2)} BAK</p>
              </div>
            </div>
          );
        })}

        {/* Status Legend */}
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">Status Flow:</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
            <span className="px-2 py-0.5 rounded bg-yellow-500/10">Pending</span>
            <span>→</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10">Processing</span>
            <span>→</span>
            <span className="px-2 py-0.5 rounded bg-green-500/10">Paid</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
