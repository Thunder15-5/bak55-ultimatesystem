/**
 * Single source of truth for BAK55 money math and payment input validation.
 * Mirrors the server-side rules enforced in the request_withdrawal /
 * approve_deposit_request database functions. Keep both sides in sync.
 */

export const BAK_TO_USD = 0.16;
export const WITHDRAWAL_FEE_PERCENT = 5;
export const MIN_WITHDRAWAL_BAK = 250;
export const MAX_WITHDRAWAL_BAK = 50_000;
export const DAILY_WITHDRAWAL_LIMIT_BAK = 100_000;
export const MIN_DEPOSIT_KES = 28;
export const MAX_DEPOSIT_KES = 1_000_000;

/** Round to 2dp using half-up, avoiding binary float drift (e.g. 1.005). */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function withdrawalFee(amount: number, feePercent = WITHDRAWAL_FEE_PERCENT): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return round2((amount * feePercent) / 100);
}

export function withdrawalNet(amount: number, feePercent = WITHDRAWAL_FEE_PERCENT): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return round2(amount - withdrawalFee(amount, feePercent));
}

export function bakToUsd(bak: number): number {
  return round2((Number(bak) || 0) * BAK_TO_USD);
}

/**
 * Normalize a Kenyan mobile number to the 254XXXXXXXXX form.
 * Returns null when the input is not a valid Safaricom/Airtel MSISDN.
 */
export function normalizeKenyanPhone(input: string): string | null {
  const digits = (input ?? "").replace(/[\s-()]/g, "");
  const match = /^(?:\+?254|0)?([17]\d{8})$/.exec(digits);
  return match ? `254${match[1]}` : null;
}

export function isValidKenyanPhone(input: string): boolean {
  return normalizeKenyanPhone(input) !== null;
}

export type WithdrawalValidation =
  | { valid: true; amount: number; fee: number; net: number; phone: string }
  | { valid: false; code: string; error: string };

export function validateWithdrawal(params: {
  amount: number | string;
  phone: string;
  accountName: string;
  availableBalance: number;
  minWithdrawal?: number;
  feePercent?: number;
}): WithdrawalValidation {
  const min = params.minWithdrawal ?? MIN_WITHDRAWAL_BAK;
  const feePercent = params.feePercent ?? WITHDRAWAL_FEE_PERCENT;
  const amount = round2(Number(params.amount));

  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, code: "invalid_amount", error: "Enter a valid amount." };
  }
  if (amount < min) {
    return { valid: false, code: "below_minimum", error: `Minimum withdrawal is ${min} BAK.` };
  }
  if (amount > MAX_WITHDRAWAL_BAK) {
    return {
      valid: false,
      code: "above_maximum",
      error: `Maximum withdrawal is ${MAX_WITHDRAWAL_BAK.toLocaleString()} BAK.`,
    };
  }
  if (amount > round2(params.availableBalance)) {
    return { valid: false, code: "insufficient_funds", error: "Amount exceeds your available balance." };
  }

  const phone = normalizeKenyanPhone(params.phone);
  if (!phone) {
    return { valid: false, code: "invalid_phone", error: "Enter a valid M-Pesa number (07XX / 2547XX)." };
  }
  if ((params.accountName ?? "").trim().length < 2) {
    return { valid: false, code: "invalid_name", error: "Enter the account name as it appears on M-Pesa." };
  }

  return {
    valid: true,
    amount,
    fee: withdrawalFee(amount, feePercent),
    net: withdrawalNet(amount, feePercent),
    phone,
  };
}

/** Human-readable copy for server error codes returned by the money RPCs. */
export const MONEY_ERROR_COPY: Record<string, string> = {
  invalid_amount: "That amount isn't valid. Please check and try again.",
  below_minimum: "That amount is below the withdrawal minimum.",
  above_maximum: "That amount is above the single-withdrawal maximum.",
  insufficient_funds: "Your available balance is too low for this withdrawal.",
  not_eligible: "Your account isn't eligible for withdrawals yet.",
  pending_exists: "You already have a withdrawal in progress. Wait for it to complete.",
  daily_limit: "You've reached today's withdrawal limit. Try again tomorrow.",
  no_wallet: "We couldn't find your wallet. Contact support.",
  config_error: "Payouts are temporarily unavailable. Please try again later.",
  duplicate_receipt: "That M-Pesa receipt code has already been submitted.",
  already_processed: "This request has already been reviewed.",
  forbidden: "You don't have permission to do that.",
  rate_limited: "Too many attempts. Please wait a few minutes and try again.",
};

export function moneyErrorMessage(code?: string | null, fallback = "Something went wrong. Please try again."): string {
  if (!code) return fallback;
  return MONEY_ERROR_COPY[code] ?? fallback;
}
