import { forwardRef } from "react";
import { Trophy, Flame } from "lucide-react";

interface Props {
  artistName: string;
  artistAvatar?: string;
  trackTitle: string;
  quantity: number;
  supporterRank: string;
  competitionTitle?: string;
  shareUrl: string;
}

export const SupportShareCard = forwardRef<HTMLDivElement, Props>(
  ({ artistName, artistAvatar, trackTitle, quantity, supporterRank, competitionTitle, shareUrl }, ref) => {
    return (
      <div
        ref={ref}
        style={{ width: 1080, height: 1350 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-background text-foreground"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="relative h-full w-full flex flex-col justify-between p-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">B55</span>
              </div>
              <div>
                <p className="text-2xl font-bold">BAK55 Talent</p>
                <p className="text-sm text-muted-foreground">{competitionTitle || "Rising Stars"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm">
              <Flame className="h-5 w-5" /> I Backed Them
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="rounded-full p-2 bg-gradient-to-br from-primary via-accent to-primary mb-8">
              <div className="h-64 w-64 rounded-full overflow-hidden border-8 border-background bg-muted">
                {artistAvatar ? (
                  <img src={artistAvatar} alt={artistName} crossOrigin="anonymous" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl font-bold">
                    {artistName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-7xl font-extrabold tracking-tight mb-4">{artistName}</h1>
            <p className="text-3xl text-muted-foreground mb-8 max-w-2xl">"{trackTitle}"</p>
            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary/20 border-2 border-primary">
              <Trophy className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold">+{quantity} vote{quantity > 1 ? "s" : ""} sent</span>
            </div>
            <p className="text-2xl mt-6 text-primary font-semibold">I'm their {supporterRank} biggest backer</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="text-3xl font-bold">Vote with me 👇</p>
            <p className="text-xl text-muted-foreground break-all max-w-3xl text-center">{shareUrl}</p>
          </div>
        </div>
      </div>
    );
  }
);
SupportShareCard.displayName = "SupportShareCard";
