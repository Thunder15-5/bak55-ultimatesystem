import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

const FREE_FEE_THRESHOLD = 50; // 0% fee under 50 BAK
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
      toast.error("Slow down!", { description: "You can only send 5 tips per minute" });
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
        toast.error(mapDatabaseError(error));
        return;
      }
      if (!data?.success) {
        toast.error(data?.error || "Failed to send tip");
        return;
      }

      toast.success(`Sent ${normalizedAmount} BAK to ${artistName} 💖`, {
        description: isFreeOfFee
          ? "0% platform fee — they receive every coin."
          : `${PLATFORM_FEE_PCT}% platform fee applied. Disclosed before you paid.`,
      });
      onOpenChange(false);
      setAmount("");
      setMessage("");
      onSuccess?.();
    } catch (error: any) {
      if (error?.errors) toast.error(error.errors[0].message);
      else toast.error("Failed to send tip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Send love to {artistName}
          </DialogTitle>
          <DialogDescription>
            100% of your tip moves directly to the artist's wallet. No surprises.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Preset cards */}
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setAmount(String(p.value))}
                className={cn(
                  "rounded-xl border p-3 text-center transition-all hover:scale-[1.02] active:scale-[0.98]",
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
            />
          </div>

          {/* Transparent fee preview */}
          {numericAmount > 0 && (
            <div className="rounded-xl border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Artist receives</span>
                <span className="font-semibold">{artistReceives.toFixed(2)} BAK</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Platform fee</span>
                <span className={cn("font-medium", isFreeOfFee && "text-emerald-600")}>
                  {isFreeOfFee ? "0% — free under 50 BAK" : `${PLATFORM_FEE_PCT}% (${platformFee.toFixed(2)} BAK)`}
                </span>
              </div>
              {isFreeOfFee && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 pt-1 border-t border-emerald-500/20">
                  <Sparkles className="h-3 w-3" />
                  Artist-friendly: tips under 50 BAK have no fees
                </div>
              )}
            </div>
          )}

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

          <div className="flex items-center justify-between">
            <FeeSplitBadge
              artistShare={isFreeOfFee ? 100 : 100 - PLATFORM_FEE_PCT}
              platformShare={isFreeOfFee ? 0 : PLATFORM_FEE_PCT}
              label={isFreeOfFee ? "100% to artist" : `${100 - PLATFORM_FEE_PCT}% to artist`}
            />
            <span className="text-[11px] text-muted-foreground">Min 0.1 · Max 10,000 BAK</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1 sm:flex-initial">
            Cancel
          </Button>
          <Button
            onClick={handleSendTip}
            disabled={loading || numericAmount <= 0}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0"
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
