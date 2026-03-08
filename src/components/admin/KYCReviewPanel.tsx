import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, CheckCircle2, XCircle, Eye, Loader2, User } from "lucide-react";

interface KYCRecord {
  id: string;
  user_id: string;
  status: string;
  full_legal_name: string;
  id_type: string;
  document_url: string | null;
  selfie_url: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  profile?: {
    username: string;
    email: string;
    avatar_url: string | null;
  };
}

export function KYCReviewPanel() {
  const { user } = useAuth();
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("kyc_verifications")
        .select("*, profile:profiles!kyc_verifications_user_id_fkey(username, email, avatar_url)")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      setRecords((data || []).map((d: any) => ({
        ...d,
        profile: d.profile || { username: "Unknown", email: "", avatar_url: null },
      })));
    } catch (err) {
      console.error("Error fetching KYC records:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setProcessing(id);
    try {
      const updateData: any = {
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      };
      if (action === "rejected") {
        updateData.rejection_reason = rejectionReason || "Documents did not meet verification requirements";
      }

      const { error } = await supabase
        .from("kyc_verifications")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Get user_id for notification
      const record = records.find((r) => r.id === id);
      if (record) {
        await supabase.from("notifications").insert({
          user_id: record.user_id,
          type: action === "approved" ? "kyc_approved" : "kyc_rejected",
          title: action === "approved" ? "✅ KYC Approved!" : "❌ KYC Rejected",
          message: action === "approved"
            ? "Your identity has been verified. You can now request withdrawals."
            : `Your KYC was rejected: ${updateData.rejection_reason}`,
          link: "/profile",
        });
      }

      toast.success(`KYC ${action}`);
      setRejectionReason("");
      fetchRecords();
    } catch (err: any) {
      toast.error(err.message || "Failed to update KYC");
    } finally {
      setProcessing(null);
    }
  };

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("kyc_documents")
      .createSignedUrl(path, 300); // 5 min
    return data?.signedUrl;
  };

  const viewDocument = async (path: string) => {
    const url = await getSignedUrl(path);
    if (url) {
      setViewingDoc(url);
    } else {
      toast.error("Could not load document");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pending = records.filter((r) => r.status === "pending");
  const reviewed = records.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">KYC Verification Review</h2>
        {pending.length > 0 && (
          <Badge variant="destructive">{pending.length} pending</Badge>
        )}
      </div>

      {/* Pending Reviews */}
      {pending.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No pending KYC reviews
          </CardContent>
        </Card>
      ) : (
        pending.map((record) => (
          <Card key={record.id} className="border-yellow-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{record.full_legal_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      @{record.profile?.username} • {record.id_type?.replace("_", " ")} • Submitted{" "}
                      {record.submitted_at ? new Date(record.submitted_at).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                {record.document_url && (
                  <Button variant="outline" size="sm" onClick={() => viewDocument(record.document_url!)}>
                    <Eye className="h-4 w-4 mr-1" /> View ID
                  </Button>
                )}
                {record.selfie_url && (
                  <Button variant="outline" size="sm" onClick={() => viewDocument(record.selfie_url!)}>
                    <Eye className="h-4 w-4 mr-1" /> View Selfie
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleAction(record.id, "approved")}
                  disabled={processing === record.id}
                  className="flex-1"
                >
                  {processing === record.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  Approve
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject KYC for {record.full_legal_name}</DialogTitle>
                    </DialogHeader>
                    <Textarea
                      placeholder="Reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <Button
                      variant="destructive"
                      onClick={() => handleAction(record.id, "rejected")}
                      disabled={processing === record.id}
                    >
                      Confirm Rejection
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Document Viewer */}
      {viewingDoc && (
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
            </DialogHeader>
            <img src={viewingDoc} alt="KYC Document" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}

      {/* Reviewed History */}
      {reviewed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Review History</h3>
          {reviewed.slice(0, 10).map((record) => (
            <div key={record.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium">{record.full_legal_name}</p>
                <p className="text-xs text-muted-foreground">@{record.profile?.username}</p>
              </div>
              <Badge className={
                record.status === "approved"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }>
                {record.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
