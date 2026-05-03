import { forwardRef } from "react";
import { Vote, Flame, CheckCircle2 } from "lucide-react";

interface ShareCardProps {
  artistName: string;
  username: string;
  avatarUrl?: string;
  bannerUrl?: string;
  competitionTitle?: string;
  votes?: number;
  daysLeft?: number | null;
  verified?: boolean;
  shareUrl: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ artistName, username, avatarUrl, bannerUrl, competitionTitle, votes, daysLeft, verified, shareUrl }, ref) => {
    return (
      <div
        ref={ref}
        style={{ width: 1080, height: 1350 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-background text-foreground"
      >
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

        <div className="relative h-full w-full flex flex-col justify-between p-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">B55</span>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">BAK55 Talent</p>
                <p className="text-sm text-muted-foreground">Africa's Music Discovery Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm">
              <Flame className="h-5 w-5" />Live Competition
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="rounded-full p-2 bg-gradient-to-br from-primary via-accent to-primary">
                <div className="h-64 w-64 rounded-full overflow-hidden border-8 border-background bg-muted">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={artistName} crossOrigin="anonymous" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl font-bold">
                      {artistName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              {verified && (
                <div className="absolute bottom-4 right-4 bg-primary rounded-full p-3 border-4 border-background">
                  <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
                </div>
              )}
            </div>

            <h1 className="text-7xl font-black tracking-tight mb-2">{artistName}</h1>
            <p className="text-2xl text-muted-foreground mb-8">@{username}</p>

            {competitionTitle && (
              <p className="text-3xl font-semibold text-foreground/90 max-w-2xl">
                Competing in <span className="text-primary">{competitionTitle}</span>
              </p>
            )}

            <div className="flex items-center gap-8 mt-8">
              {typeof votes === "number" && (
                <div className="text-center">
                  <div className="text-5xl font-black text-primary">{votes.toLocaleString()}</div>
                  <div className="text-sm uppercase tracking-wider text-muted-foreground">Votes</div>
                </div>
              )}
              {daysLeft !== null && daysLeft !== undefined && (
                <div className="text-center">
                  <div className="text-5xl font-black text-accent">{daysLeft}</div>
                  <div className="text-sm uppercase tracking-wider text-muted-foreground">Day{daysLeft !== 1 ? "s" : ""} Left</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="px-10 py-5 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-3xl shadow-2xl flex items-center gap-3">
              <Vote className="h-8 w-8" />Vote Now on BAK55
            </div>
            <p className="text-lg text-muted-foreground font-mono">{shareUrl.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";
