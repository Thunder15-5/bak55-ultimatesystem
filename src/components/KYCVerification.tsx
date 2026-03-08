import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Upload, Camera, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from "lucide-react";

interface KYCData {
  id: string;
  status: string;
  full_legal_name: string;
  id_type: string;
  document_url: string | null;
  selfie_url: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
}

export function KYCVerification() {
  const { user } = useAuth();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [idType, setIdType] = useState("national_id");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) fetchKYC();
  }, [user]);

  const fetchKYC = async () => {
    try {
      const { data } = await supabase
        .from("kyc_verifications")
        .select("id, status, full_legal_name, id_type, document_url, selfie_url, rejection_reason, submitted_at")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (data) {
        setKycData(data);
        setFullName(data.full_legal_name || "");
        setIdType(data.id_type || "national_id");
      }
    } catch (err) {
      console.error("Error fetching KYC:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${folder}_${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage
      .from("kyc_documents")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    // Return the path (not public URL since bucket is private)
    return path;
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full legal name");
      return;
    }
    if (!idFile) {
      toast.error("Please upload your ID document");
      return;
    }
    if (!selfieFile) {
      toast.error("Please upload a selfie");
      return;
    }

    setSubmitting(true);
    try {
      const [docPath, selfiePath] = await Promise.all([
        uploadFile(idFile, "id_document"),
        uploadFile(selfieFile, "selfie"),
      ]);

      const kycRecord = {
        user_id: user!.id,
        full_legal_name: fullName.trim(),
        id_type: idType,
        document_url: docPath,
        selfie_url: selfiePath,
        status: "pending",
        submitted_at: new Date().toISOString(),
      };

      if (kycData?.id) {
        const { error } = await supabase
          .from("kyc_verifications")
          .update(kycRecord)
          .eq("id", kycData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("kyc_verifications")
          .insert(kycRecord);
        if (error) throw error;
      }

      toast.success("KYC documents submitted for review!");
      fetchKYC();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit KYC");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    approved: { icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Verified" },
    pending: { icon: <Clock className="h-5 w-5" />, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Under Review" },
    rejected: { icon: <XCircle className="h-5 w-5" />, color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Rejected" },
  };

  const status = kycData?.status ? statusConfig[kycData.status] : null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>KYC Verification</CardTitle>
          </div>
          {status && (
            <Badge className={status.color}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </Badge>
          )}
        </div>
        <CardDescription>
          Verify your identity to unlock withdrawals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {kycData?.status === "approved" ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-foreground">Identity Verified</p>
            <p className="text-sm text-muted-foreground">
              Verified as {kycData.full_legal_name}
            </p>
          </div>
        ) : (
          <>
            {kycData?.status === "rejected" && kycData.rejection_reason && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                  <p className="text-sm text-muted-foreground">{kycData.rejection_reason}</p>
                </div>
              </div>
            )}

            {kycData?.status === "pending" ? (
              <div className="text-center py-6">
                <Clock className="h-16 w-16 text-yellow-400 mx-auto mb-3" />
                <p className="text-lg font-semibold text-foreground">Under Review</p>
                <p className="text-sm text-muted-foreground">
                  Your documents are being reviewed. This usually takes 24-48 hours.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Legal Name</Label>
                  <Input
                    id="fullName"
                    placeholder="As it appears on your ID"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ID Type</Label>
                  <Select value={idType} onValueChange={setIdType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idDoc">ID Document Photo</Label>
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="idDoc"
                      className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {idFile ? idFile.name : "Upload ID photo"}
                      </span>
                    </Label>
                    <Input
                      id="idDoc"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selfie">Selfie Photo</Label>
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="selfie"
                      className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {selfieFile ? selfieFile.name : "Take a selfie"}
                      </span>
                    </Label>
                    <Input
                      id="selfie"
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><Shield className="h-4 w-4 mr-2" /> Submit for Verification</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
