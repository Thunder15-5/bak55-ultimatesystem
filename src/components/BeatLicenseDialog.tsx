import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Check, Loader2, Music2, Crown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FeeSplitBadge } from "@/components/monetization/FeeSplitBadge";

interface BeatLicenseDialogProps {
  beat: {
    id: string;
    title: string;
    producer_id: string;
    price_lease_bak: number | null;
    price_lease_kes: number | null;
    price_premium_bak: number | null;
    price_premium_kes: number | null;
    price_exclusive_bak: number | null;
    price_exclusive_kes: number | null;
    is_free: boolean | null;
  };
  producerName: string;
  children: React.ReactNode;
}

const LICENSE_TIERS = [
  {
    type: "lease",
    label: "Basic Lease",
    icon: Music2,
    features: ["MP3 download", "Non-exclusive rights", "Up to 5,000 streams", "1 year license"],
    priceKey: "price_lease",
  },
  {
    type: "premium",
    label: "Premium Lease",
    icon: Zap,
    features: ["WAV + MP3 download", "Non-exclusive rights", "Unlimited streams", "2 year license", "Keep 100% royalties"],
    priceKey: "price_premium",
  },
  {
    type: "exclusive",
    label: "Exclusive Rights",
    icon: Crown,
    features: ["WAV + Stems download", "Full exclusive ownership", "Unlimited usage forever", "Beat removed from store", "Keep 100% royalties"],
    priceKey: "price_exclusive",
  },
];

export function BeatLicenseDialog({ beat, producerName, children }: BeatLicenseDialogProps) {
  const { user } = useAuth();
  const { formatFromKES } = useCurrency();
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const getPrice = (tier: typeof LICENSE_TIERS[0]) => {
    const bakKey = `${tier.priceKey}_bak` as keyof typeof beat;
    const kesKey = `${tier.priceKey}_kes` as keyof typeof beat;
    return {
      bak: (beat[bakKey] as number | null) || 0,
      kes: (beat[kesKey] as number | null) || 0,
    };
  };

  const handlePurchase = async (licenseType: string) => {
    if (!user) {
      toast.error("Please log in to purchase a license");
      navigate("/login");
      return;
    }

    if (user.id === beat.producer_id) {
      toast.error("You cannot purchase your own beat");
      return;
    }

    setPurchasing(licenseType);

    try {
      const tier = LICENSE_TIERS.find((t) => t.type === licenseType)!;
      const price = getPrice(tier);

      if (price.bak <= 0) {
        toast.error("This license tier is not available");
        return;
      }

      // Check balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!wallet || wallet.balance < price.bak) {
        toast.error(`Insufficient balance. You need ${price.bak} BAK.`);
        navigate("/buy-coins");
        return;
      }

      // Use transfer_funds to move BAK from buyer to producer
      const { data: transferred, error: transferError } = await supabase.rpc("transfer_funds", {
        sender_id: user.id,
        recipient_id: beat.producer_id,
        transfer_amount: price.bak,
      });

      if (transferError) throw transferError;

      // Record the license
      const producerShare = 0.85;
      const platformShare = 0.15;
      const { error: licenseError } = await supabase.from("beat_licenses").insert({
        beat_id: beat.id,
        buyer_id: user.id,
        producer_id: beat.producer_id,
        license_type: licenseType,
        price_paid: price.bak,
        producer_earnings: price.bak * producerShare,
        producer_share: producerShare,
        platform_earnings: price.bak * platformShare,
        platform_share: platformShare,
      });

      if (licenseError) throw licenseError;

      toast.success(`${tier.label} purchased successfully! Check your downloads.`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Purchase failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  if (beat.is_free) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Free Beat</DialogTitle>
            <DialogDescription>
              "{beat.title}" by {producerName} is free to use. Download and create!
            </DialogDescription>
          </DialogHeader>
          <Button variant="hero" className="w-full" onClick={() => toast.success("Download started!")}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Download Free
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">License "{beat.title}"</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Choose a license tier from {producerName}.
          </DialogDescription>
          <div className="pt-2">
            <FeeSplitBadge
              artistShare={85}
              platformShare={15}
              label="85% to producer"
              title="Beat license revenue split"
              lines={[
                "85% to the producer",
                "15% platform fee (hosting, payouts, support)",
                "100% royalties on your release stay with you",
              ]}
              footnote="Same split on every tier. Disclosed before checkout."
            />
          </div>
        </DialogHeader>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {LICENSE_TIERS.map((tier) => {
            const price = getPrice(tier);
            const isAvailable = price.bak > 0;
            const Icon = tier.icon;

            return (
              <Card
                key={tier.type}
                className={`relative ${!isAvailable ? "opacity-50" : "hover:border-primary/50"} transition-all`}
              >
                {tier.type === "premium" && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]">
                    Popular
                  </Badge>
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="text-center">
                    <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-bold text-sm">{tier.label}</h3>
                  </div>

                  {isAvailable && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{price.bak} BAK</div>
                      {price.kes > 0 && (
                        <div className="text-xs text-muted-foreground">≈ {formatFromKES(price.kes)}</div>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Producer earns {(price.bak * 0.85).toFixed(0)} BAK
                      </div>
                    </div>
                  )}

                  <ul className="space-y-1">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={tier.type === "premium" ? "hero" : "outline"}
                    size="sm"
                    className="w-full"
                    disabled={!isAvailable || purchasing !== null}
                    onClick={() => handlePurchase(tier.type)}
                  >
                    {purchasing === tier.type ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : !isAvailable ? (
                      "Not Available"
                    ) : (
                      <>
                        <ShoppingCart className="mr-1 h-3 w-3" />
                        Purchase
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}