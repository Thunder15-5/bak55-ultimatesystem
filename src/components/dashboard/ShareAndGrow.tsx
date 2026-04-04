import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Users, Gift } from "lucide-react";
import { toast } from "sonner";
import { getArtistShareUrl } from "@/lib/shareUrl";

interface ShareAndGrowProps {
  userId: string;
  referralCount?: number;
}

export function ShareAndGrow({ userId, referralCount = 0 }: ShareAndGrowProps) {
  const profileUrl = getArtistShareUrl(userId);

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied!");
  };

  const handleShare = () => {
    const text = "Check out my music on BAK55 Talent! 🎶🔥";
    if (navigator.share) {
      navigator.share({ title: "My BAK55 Profile", text, url: profileUrl });
    } else {
      handleCopy();
    }
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          Share & Grow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground truncate flex-1 font-mono">{profileUrl}</p>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button onClick={handleShare} className="w-full" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share Your Profile
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-semibold">{referralCount}</p>
              <p className="text-[10px] text-muted-foreground">Referrals</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
            <Gift className="h-4 w-4 text-accent" />
            <div>
              <p className="text-sm font-semibold">{referralCount * 5}</p>
              <p className="text-[10px] text-muted-foreground">BAK Earned</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Earn 5 BAKCoins for every friend who joins through your link
        </p>
      </CardContent>
    </Card>
  );
}
