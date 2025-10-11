import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
    const tipAmount = parseFloat(amount);
    
    if (!tipAmount || tipAmount <= 0) {
      toast.error("Please enter a valid tip amount");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-tip', {
        body: {
          to_artist_id: artistId,
          track_id: trackId,
          amount: tipAmount,
          message: message || undefined,
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to send tip');
      }

      toast.success(`Tip of ${tipAmount} BAK sent to ${artistName}!`);
      onOpenChange(false);
      setAmount("");
      setMessage("");
      onSuccess?.();
    } catch (error: any) {
      console.error('Tip error:', error);
      toast.error(error.message || "Failed to send tip");
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
              step="0.1"
            />
            <p className="text-xs text-muted-foreground">
              Minimum: 0.1 BAK
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