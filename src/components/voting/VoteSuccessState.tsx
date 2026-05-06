import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Share2, Heart, Sparkles, ArrowRight, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { SupportShareCard } from "./SupportShareCard";
import { useToast } from "@/hooks/use-toast";

export interface VoteSuccessData {
  artistId: string;
  artistName: string;
  artistAvatar?: string;
  trackTitle: string;
  quantity: number;
  totalCost: number;
  artistEarned: number;
  newBalance: number;
  voterTotalVotes: number;
  totalVotes: number;
  voteId?: string;
  competitionTitle?: string;
}

interface Props {
  data: VoteSuccessData;
  onClose: () => void;
  onCheerAgain: () => void;
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export function VoteSuccessState({ data, onClose, onCheerAgain }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const [confettiBurst, setConfettiBurst] = useState(true);

  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([10, 30, 10, 30, 60]);
    const t = setTimeout(() => setConfettiBurst(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const supporterRank = ordinal(data.voterTotalVotes);
  const shareUrl = `${window.location.origin}/artist/${data.artistId}?ref=vote`;

  const handleNativeShare = async () => {
    const text = `I just backed ${data.artistName} in BAK55 ${data.competitionTitle || "Rising Stars"} 🏆 Vote with me 👇`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Backing ${data.artistName} on BAK55`, text, url: shareUrl });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    toast({ title: "Link copied", description: "Share it to bring more support." });
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const png = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = png;
      a.download = `bak55-support-${data.artistName.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
      toast({ title: "Saved!", description: "Share your support card anywhere." });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative flex flex-col px-5 pt-6 pb-5">
      {/* Confetti / glow */}
      {confettiBurst && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-accent/10 to-transparent animate-pulse" />
        </div>
      )}

      <div className="relative text-center space-y-3 mb-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg animate-scale-in">
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold leading-tight">
            You backed {data.artistName}! 🚀
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            +{data.quantity} vote{data.quantity > 1 ? "s" : ""} sent · {data.artistEarned.toFixed(2)} BAK to artist
          </p>
        </div>
      </div>

      {/* Identity card */}
      <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/5 p-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-primary/40">
            <AvatarImage src={data.artistAvatar} />
            <AvatarFallback>{data.artistName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">Your supporter rank</div>
            <div className="text-lg font-bold">
              You're their {supporterRank} biggest backer
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Vote logged on public ledger{data.voteId ? ` · ${data.voteId.slice(0, 8)}` : ""}</span>
        </div>
      </div>

      {/* Hidden share card for download */}
      <div className="absolute -left-[9999px] top-0">
        <SupportShareCard
          ref={cardRef}
          artistName={data.artistName}
          artistAvatar={data.artistAvatar}
          trackTitle={data.trackTitle}
          quantity={data.quantity}
          supporterRank={supporterRank}
          competitionTitle={data.competitionTitle}
          shareUrl={shareUrl}
        />
      </div>

      {/* CTAs */}
      <div className="space-y-2">
        <Button size="lg" className="w-full h-12 font-semibold" onClick={handleNativeShare}>
          <Share2 className="h-4 w-4 mr-2" /> Tell fans you backed them
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={downloading}>
            <Download className="h-4 w-4 mr-2" /> Save card
          </Button>
          <Button variant="outline" onClick={onCheerAgain}>
            <Heart className="h-4 w-4 mr-2" /> Cheer again
          </Button>
        </div>
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Done <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <p className="text-[10px] text-center text-muted-foreground mt-3">
        New balance: {data.newBalance.toFixed(2)} BAK
      </p>
    </div>
  );
}
