import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DollarSign, Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WithdrawalRequest {
  id: string;
  wallet_id: string;
  amount: number;
  description: string;
  metadata: {
    status: string;
    account_name: string;
    account_number: string;
    bank_name: string;
  };
  created_at: string;
  wallets: {
    user_id: string;
    profiles: {
      username: string;
      email: string;
    };
  };
}

export default function Admin() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchWithdrawalRequests();
  }, [userRole]);

  const fetchWithdrawalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          wallets (
            user_id,
            profiles:user_id (username, email)
          )
        `)
        .eq("type", "withdrawal")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter only pending requests
      const pendingRequests = (data || []).filter(
        (tx) => tx.metadata?.status === "pending"
      );

      setRequests(pendingRequests);
    } catch (error: any) {
      toast.error("Failed to load withdrawal requests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: WithdrawalRequest) => {
    setProcessing(request.id);

    try {
      // Update transaction metadata to mark as approved
      const { error } = await supabase
        .from("transactions")
        .update({
          metadata: {
            ...request.metadata,
            status: "approved",
            processed_at: new Date().toISOString(),
          },
        })
        .eq("id", request.id);

      if (error) throw error;

      toast.success("Withdrawal approved! Process payment manually via Pesapal.");
      fetchWithdrawalRequests();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve withdrawal");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: WithdrawalRequest) => {
    setProcessing(request.id);

    try {
      // Get wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance")
        .eq("id", request.wallet_id)
        .single();

      if (!walletData) throw new Error("Wallet not found");

      // Refund the amount
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: walletData.balance + Math.abs(request.amount) })
        .eq("id", request.wallet_id);

      if (updateError) throw updateError;

      // Update transaction metadata to mark as rejected
      const { error } = await supabase
        .from("transactions")
        .update({
          metadata: {
            ...request.metadata,
            status: "rejected",
            processed_at: new Date().toISOString(),
          },
        })
        .eq("id", request.id);

      if (error) throw error;

      toast.success("Withdrawal rejected and amount refunded");
      fetchWithdrawalRequests();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject withdrawal");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage withdrawal requests</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Withdrawal Requests</CardTitle>
            <CardDescription>
              Review and process artist withdrawal requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No pending withdrawal requests
              </p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <h3 className="text-xl font-bold">
                              {Math.abs(request.amount).toFixed(2)} BAK
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <strong>Artist:</strong>{" "}
                            {request.wallets.profiles.username} (
                            {request.wallets.profiles.email})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Account Name:</strong>{" "}
                            {request.metadata.account_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Account Number:</strong>{" "}
                            {request.metadata.account_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Bank:</strong> {request.metadata.bank_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Requested:{" "}
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(request)}
                            disabled={processing === request.id}
                          >
                            {processing === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(request)}
                            disabled={processing === request.id}
                          >
                            {processing === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
