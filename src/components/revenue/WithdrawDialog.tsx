import { useEffect, useMemo, useState } from "react";
import { ResponsiveModal } from "@/components/mobile/ResponsiveModal";
import { PressableButton } from "@/components/PressableButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowDownToLine, Loader2, ShieldCheck, AlertTriangle, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { actionToast } from "@/lib/actionToast";
import { useWithdrawalEligibility } from "@/hooks/useWithdrawalEligibility";
import { Link } from "react-router-dom";

import {
  MIN_WITHDRAWAL_BAK,
  WITHDRAWAL_FEE_PERCENT,
  moneyErrorMessage,
  round2,
  validateWithdrawal,
  withdrawalFee,
  withdrawalNet,
} from "@/lib/money";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}

export function WithdrawDialog({ open, onOpenChange, onSuccess }: WithdrawDialogProps) {
  const { user } = useAuth();
  const { eligibility, refetch } = useWithdrawalEligibility(user?.id);

  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [accountName, setAccountName] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const available = round2(eligibility?.available_balance ?? 0);
  const minWithdraw = eligibility?.min_withdrawal ?? MIN_WITHDRAWAL_BAK;
  const numericAmount = Number(amount) || 0;
  const fee = useMemo(() => withdrawalFee(numericAmount), [numericAmount]);
  const net = useMemo(() => withdrawalNet(numericAmount), [numericAmount]);

  const validation = useMemo(
    () =>
      validateWithdrawal({
        amount: numericAmount,
        phone,
        accountName,
        availableBalance: available,
        minWithdrawal: minWithdraw,
      }),
    [numericAmount, phone, accountName, available, minWithdraw],
  );

  const tooLow = numericAmount > 0 && numericAmount < minWithdraw;
  const tooHigh = numericAmount > available;
  const canSubmit = !!eligibility?.eligible && validation.valid && agree && !submitting;

  useEffect(() => {
    if (open) refetch();
  }, [open]);

  const handleWithdraw = async () => {
    if (!canSubmit || !user || !validation.valid) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        actionToast.error("Session expired", "Please sign in again.");
        return;
      }
      const { data, error } = await supabase.functions.invoke("process-withdrawal", {
        body: {
          amount: validation.amount,
          phone_number: validation.phone,
          bank_details: {
            accountName: accountName.trim(),
            accountNumber: validation.phone,
            bankName: "M-Pesa",
          },
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error || data?.success === false) {
        throw new Error(moneyErrorMessage(data?.code, data?.error));
      }

      actionToast.success(
        "Payout requested",
        `${Number(data?.net_amount ?? net).toFixed(2)} BAK queued · Ref ${data?.reference ?? "pending"}. ETA 24–72h.`,
      );
      setAmount(""); setPhone(""); setAccountName(""); setAgree(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      actionToast.error("Payout failed", e?.message || "Try again.");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      desktopMaxWidth="max-w-md"
      title={
        <span className="flex items-center gap-2">
          <ArrowDownToLine className="h-4 w-4 text-primary" />
          Request payout
        </span>
      }
      description="Withdraw BAKCoins to your M-Pesa. 5% network fee · ETA 24–72h."
    >
      {!eligibility?.eligible ? (
        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-300">
              <Lock className="h-4 w-4" /> Not eligible yet
            </div>
            <ul className="text-xs text-yellow-700/90 dark:text-yellow-200/90 space-y-0.5 ml-6 list-disc">
              {(eligibility?.issues ?? ["Loading eligibility…"]).map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>
          {eligibility?.level?.requires_kyc && eligibility.level.kyc_status !== "approved" && (
            <Link to="/profile?tab=kyc" onClick={() => onOpenChange(false)}>
              <Button variant="outline" className="w-full">Complete KYC</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4 py-1">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border/50 px-3 py-2.5">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Available</p>
              <p className="text-lg font-bold tabular-nums">{available.toFixed(2)} BAK</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">Min {minWithdraw}</Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount" className="text-xs">Amount (BAK)</Label>
              <button
                type="button"
                className="text-[11px] text-primary hover:underline"
                onClick={() => setAmount(String(Math.floor(available)))}
              >
                Max
              </button>
            </div>
            <Input
              id="amount" type="number" inputMode="decimal" placeholder={`${minWithdraw}`}
              value={amount} onChange={(e) => setAmount(e.target.value)}
            />
            {tooLow && <p className="text-[11px] text-destructive">Minimum is {minWithdraw} BAK.</p>}
            {tooHigh && <p className="text-[11px] text-destructive">Exceeds available balance.</p>}
          </div>

          <div className="rounded-lg border border-border/50 bg-card p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Requested</span>
              <span className="tabular-nums">{numericAmount.toFixed(2)} BAK</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Network fee (5%)</span>
              <span className="tabular-nums text-muted-foreground">−{fee.toFixed(2)} BAK</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-medium">You receive</span>
              <span className="text-base font-bold text-primary tabular-nums">{net.toFixed(2)} BAK</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs">M-Pesa phone</Label>
              <Input id="phone" inputMode="tel" autoComplete="tel" placeholder="2547XXXXXXXX"
                value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">Account name</Label>
              <Input id="name" autoComplete="name" placeholder="As on M-Pesa"
                value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </div>
          </div>

          <label className="flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer">
            <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
            <span>
              I confirm these payout details are mine and understand the 5% fee. Funds are non-refundable once processed.
            </span>
          </label>

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-success" />
            Encrypted · KYC-verified · Audit logged
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 pt-4">
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
          Cancel
        </Button>
        {eligibility?.eligible && (
          <PressableButton onClick={handleWithdraw} disabled={!canSubmit} hapticPattern="success">
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Processing…</>
            ) : tooHigh ? (
              <><AlertTriangle className="h-4 w-4 mr-1.5" /> Reduce amount</>
            ) : (
              <>Send {net.toFixed(2)} BAK</>
            )}
          </PressableButton>
        )}
      </div>
    </ResponsiveModal>
  );
}
