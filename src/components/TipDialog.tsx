import { useState } from "react";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { PressableButton } from "@/components/PressableButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { actionToast } from "@/lib/actionToast";
import { tipSchema, mapDatabaseError, sanitizeText } from "@/lib/validation";
import { rateLimiter, RATE_LIMITS } from "@/lib/rateLimiter";
import { FeeSplitBadge } from "@/components/monetization/FeeSplitBadge";
import { cn } from "@/lib/utils";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistId: string;
  artistName: string;
  trackId?: string;
  onSuccess?: () => void;
}

const PRESETS = [
  { value: 5, label: "Cheer", emoji: "👏" },
  { value: 15, label: "Show love", emoji: "💖" },
  { value: 50, label: "Big fan", emoji: "🔥" },
];

const FREE_FEE_THRESHOLD = 50;
const PLATFORM_FEE_PCT = 5;

export function TipDialog({ open, onOpenChange, artistId, artistName, trackId, onSuccess }: TipDialogProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const isFreeOfFee = numericAmount > 0 && numericAmount <= FREE_FEE_THRESHOLD;
  const platformFee = isFreeOfFee ? 0 : Math.round(numericAmount * (PLATFORM_FEE_PCT / 100) * 100) / 100;
  const artistReceives = Math.max(0, numericAmount - platformFee);

  const handleSendTip = async () => {
    if (!rateLimiter.check(`tip_${artistId}`, RATE_LIMITS.TIP)) {
      actionToast.error("Slow down!", "You can only send 5 tips per minute");
      return;
    }

    setLoading(true);
    try {
      const tipAmount = parseFloat(amount);
      const validated = tipSchema.parse({
        amount: tipAmount,
        message: message.trim() ? sanitizeText(message.trim()) : undefined,
      });
      const normalizedAmount = Math.round(validated.amount * 100) / 100;

      const { data, error } = await supabase.functions.invoke("send-tip", {
        body: {
          to_artist_id: artistId,
          track_id: trackId,
          amount: normalizedAmount,
          message: validated.message,
        },
      });

      if (error) {
        actionToast.error("Tip failed", mapDatabaseError(error));
        return;
      }
      if (!data?.success) {
        actionToast.error("Tip failed", data?.error || "Please try again");
        return;
      }

      actionToast.success(
        `Sent ${normalizedAmount} BAK to ${artistName} 💖`,
        isFreeOfFee
          ? "0% platform fee — they receive every coin."
          : `${PLATFORM_FEE_PCT}% platform fee applied. Disclosed before you paid.`,
      );
      onOpenChange(false);
      setAmount("");
      setMessage("");
      onSuccess?.();
    } catch (error: any) {
      if (error?.errors) actionToast.error("Check your amount", error.errors[0].message);
      else actionToast.error("Tip failed", "Please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          Send love to {artistName}
        </span>
      }
      description="100% of your tip moves directly to the artist's wallet. No surprises."
    >
      <div className="space-y-5 px-4 pb-6">
        {/* Preset cards */}
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setAmount(String(p.value))}
              className={cn(
                "press-scale rounded-xl border p-3 text-center transition-all",
                numericAmount === p.value
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div className="text-xl mb-0.5">{p.emoji}</div>
              <div className="text-[11px] font-medium text-muted-foreground">{p.label}</div>
              <div className="text-sm font-bold mt-0.5">{p.value} BAK</div>
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-xs uppercase tracking-wider text-muted-foreground">
            Or enter a custom amount
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="e.g. 10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.1"
            max="10000"
            step="0.01"
            inputMode="decimal"
            className="h-12"
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-xs uppercase tracking-wider text-muted-foreground">
            Add a note (optional)
          </Label>
          <Textarea
            id="message"
            placeholder="Say something kind..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={140}
          />
          <p className="text-[11px] text-muted-foreground text-right">{message.length}/140</p>
        </div>

        {/* Final review — fee transparency before paying */}
        {numericAmount > 0 && (
          <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-rose-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                Final review
              </span>
              <FeeSplitBadge
                artistShare={isFreeOfFee ? 100 : 100 - PLATFORM_FEE_PCT}
                platformShare={isFreeOfFee ? 0 : PLATFORM_FEE_PCT}
                title="Your tip breakdown"
                lines={[
                  `You pay: ${numericAmount.toFixed(2)} BAK`,
                  `Artist receives: ${artistReceives.toFixed(2)} BAK`,
                  isFreeOfFee
                    ? "Platform fee: 0% (free under 50 BAK)"
                    : `Platform fee: ${PLATFORM_FEE_PCT}% (${platformFee.toFixed(2)} BAK)`,
                ]}
                footnote="Disclosed before payment. No hidden fees."
                label={isFreeOfFee ? "100% to artist" : `${100 - PLATFORM_FEE_PCT}% to artist`}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You pay</span>
                <span className="font-medium">{numericAmount.toFixed(2)} BAK</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Platform fee</span>
                <span className={cn("font-medium", isFreeOfFee && "text-emerald-600")}>
                  {isFreeOfFee ? "0% — free under 50 BAK" : `${PLATFORM_FEE_PCT}% (${platformFee.toFixed(2)} BAK)`}
                </span>
              </div>
              <div className="flex items-center justify-between text-base pt-2 border-t border-primary/15">
                <span className="font-semibold">Artist receives</span>
                <span className="font-bold text-primary">{artistReceives.toFixed(2)} BAK</span>
              </div>
            </div>

            {isFreeOfFee && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 pt-1">
                <Sparkles className="h-3 w-3" />
                Artist-friendly: tips under 50 BAK have zero platform fees
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end">
          <span className="text-[11px] text-muted-foreground">Min 0.1 · Max 10,000 BAK</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 h-12"
          >
            Cancel
          </Button>
          <PressableButton
            onClick={handleSendTip}
            disabled={loading || numericAmount <= 0}
            hapticPattern="success"
            className="flex-1 h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Heart className="mr-2 h-4 w-4" />
                Send {numericAmount > 0 ? `${numericAmount} BAK` : "love"}
              </>
            )}
          </PressableButton>
        </div>
      </div>
    </BottomSheet>
  );
}
