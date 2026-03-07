import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WithdrawalEligibility {
  eligible: boolean;
  issues: string[];
  balance: number;
  escrow_held: number;
  available_balance: number;
  min_withdrawal: number;
  level: {
    level: number;
    name: string;
    badge: string;
    can_withdraw: boolean;
    requires_kyc: boolean;
    kyc_status: string;
  };
}

export function useWithdrawalEligibility(userId?: string) {
  const [eligibility, setEligibility] = useState<WithdrawalEligibility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchEligibility();
  }, [userId]);

  const fetchEligibility = async () => {
    try {
      const { data, error } = await supabase.rpc('check_withdrawal_eligibility', { p_user_id: userId });
      if (error) throw error;
      setEligibility(data as unknown as WithdrawalEligibility);
    } catch (err) {
      console.error('Error checking withdrawal eligibility:', err);
    } finally {
      setLoading(false);
    }
  };

  return { eligibility, loading, refetch: fetchEligibility };
}
