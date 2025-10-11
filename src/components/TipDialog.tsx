import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { tipSchema, mapDatabaseError } from "@/lib/validation";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistId: string;
  artistName: string;
  trackId?: string;
  onSuccess?: () => void;
}

export function TipDialog({ open, onOpenChange, artistId, artistName, trackId, onSuccess }: TipDialogProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendTip = async () => {
    setLoading(true);

    try {
      // Validate input
      const tipAmount = parseFloat(amount);
      const validated = tipSchema.parse({
        amount: tipAmount,
        message: message.trim() || undefined,
      });

      // Round to 2 decimal places to avoid floating point issues
      const normalizedAmount = Math.round(validated.amount * 100) / 100;

      const { data, error } = await supabase.functions.invoke('send-tip', {
        body: {
          to_artist_id: artistId,
          track_id: trackId,
          amount: normalizedAmount,
          message: validated.message,
        }
      });

      if (error) {
        toast.error(mapDatabaseError(error));
        return;
      }

      if (!data.success) {
        toast.error(data.error || 'Failed to send tip');
        return;
      }

      toast.success(`Tip of ${normalizedAmount} BAK sent to ${artistName}!`);
      onOpenChange(false);
      setAmount("");
      setMessage("");
      onSuccess?.();
    } catch (error: any) {
      if (error.errors) {
        // Zod validation error
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to send tip");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Send Tip to {artistName}
          </DialogTitle>
          <DialogDescription>
            Show your support for this artist by sending BAKCoins directly to them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (BAK)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.1"
              max="10000"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              Minimum: 0.1 BAK | Maximum: 10,000 BAK
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/200 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendTip}
            disabled={loading || !amount}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Heart className="mr-2 h-4 w-4" />
                Send Tip
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}