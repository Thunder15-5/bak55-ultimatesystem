import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShieldCheck, KeyRound, MailCheck, MonitorSmartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AccountSecurityCard() {
  const { user, emailVerified, sendPasswordReset, resendVerification, signOutAllDevices } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const handleReset = async () => {
    if (!user?.email) return;
    setResetting(true);
    const { error } = await sendPasswordReset(user.email);
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email");
    setResetting(false);
  };

  const handleResendVerification = async () => {
    setVerifying(true);
    const { error } = await resendVerification();
    if (error) toast.error(error.message);
    else toast.success("Verification email sent");
    setVerifying(false);
  };

  const handleRevoke = async () => {
    setRevoking(true);
    const { error } = await signOutAllDevices();
    if (error) {
      toast.error(error.message);
      setRevoking(false);
    } else {
      toast.success("Signed out everywhere");
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Account security
        </CardTitle>
        <CardDescription className="text-xs">
          Manage how you sign in and keep your account protected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/40 p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-[11px] text-muted-foreground">Sign-in email</p>
          </div>
          <Badge variant={emailVerified ? "default" : "destructive"} className="shrink-0">
            {emailVerified ? "Verified" : "Unverified"}
          </Badge>
        </div>

        {!emailVerified && (
          <Button
            variant="outline"
            className="w-full h-11 justify-start"
            onClick={handleResendVerification}
            disabled={verifying}
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MailCheck className="h-4 w-4 mr-2" />
            )}
            Resend verification email
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full h-11 justify-start"
          onClick={handleReset}
          disabled={resetting}
        >
          {resetting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4 mr-2" />
          )}
          Change password
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full h-11 justify-start text-destructive hover:text-destructive">
              <MonitorSmartphone className="h-4 w-4 mr-2" />
              Sign out of all devices
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-h-[90vh]">
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out everywhere?</AlertDialogTitle>
              <AlertDialogDescription>
                This ends every active session — including this one — on all phones, tablets and
                browsers. You'll need to log in again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevoke} disabled={revoking}>
                {revoking ? "Signing out..." : "Sign out everywhere"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
