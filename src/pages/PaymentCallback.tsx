import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentStatusScreen, PaymentStatus } from "@/components/mobile/PaymentStatusScreen";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Post-checkout landing screen.
 * Polls the wallet balance to detect webhook credit, then routes to /wallet.
 */
const PaymentCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [amount, setAmount] = useState<number>(0);
  const startBalance = useRef<number | null>(null);
  const attempts = useRef(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const poll = async () => {
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      const current = Number(data?.balance ?? 0);
      if (startBalance.current === null) startBalance.current = current;
      const delta = current - (startBalance.current ?? current);
      if (delta > 0) {
        if (cancelled) return;
        setAmount(delta);
        setStatus("success");
        return;
      }
      attempts.current += 1;
      if (attempts.current >= 20) {
        if (cancelled) return;
        setStatus("failed");
        return;
      }
      setTimeout(() => { if (!cancelled) poll(); }, 3000);
    };
    poll();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 pb-safe">
      <Card className="card-base w-full max-w-md">
        <CardContent className="p-0">
          <PaymentStatusScreen
            status={status}
            amount={amount}
            currency="BAK"
            errorMessage="We haven't seen the payment confirmation yet. It may still complete — check your wallet in a moment."
            onDone={() => navigate("/wallet")}
            onRetry={() => navigate("/buy-coins")}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;
