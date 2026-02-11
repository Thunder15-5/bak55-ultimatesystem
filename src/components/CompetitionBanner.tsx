import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Users, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface CompetitionBannerProps {
  competitionId: string;
  title: string;
  coverImage: string;
  prizeAmount: number;
  endDate: string;
  maxSubmissions?: number;
  currentSubmissions?: number;
  ctaText?: string;
  ctaLink?: string;
}

export const CompetitionBanner = ({
  competitionId,
  title,
  coverImage,
  prizeAmount,
  endDate,
  maxSubmissions = 55,
  currentSubmissions = 0,
  ctaText = "Enter Now",
  ctaLink = `/competition/${competitionId}`,
}: CompetitionBannerProps) => {
  const [timeRemaining, setTimeRemaining] = useState("");
  const imgSrc = coverImage || "/genesis-competition.png.jpeg";

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeRemaining("Competition Ended");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        setTimeRemaining(`${days} days remaining`);
      } else {
        setTimeRemaining(`${hours} hours remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background shadow-lg">
      <div className="grid md:grid-cols-2 gap-4 md:gap-6 p-4 sm:p-6">
        {/* Cover Image */}
        <div className="relative rounded-lg overflow-hidden aspect-video">
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-full object-contain bg-black/10"
          />
          <div className="absolute top-4 left-4">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
              FEATURED
            </span>
          </div>
        </div>

        {/* Competition Details */}
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Be part of history. Join the first 55 founding artists of BAK55.
            </p>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex flex-col items-center p-2 sm:p-3 bg-background/50 rounded-lg border">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Prize</span>
                <span className="font-bold text-xs sm:text-sm">{prizeAmount.toLocaleString()} BAK</span>
              </div>
              <div className="flex flex-col items-center p-2 sm:p-3 bg-background/50 rounded-lg border">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Spots</span>
                <span className="font-bold text-xs sm:text-sm">{currentSubmissions}/{maxSubmissions}</span>
              </div>
              <div className="flex flex-col items-center p-2 sm:p-3 bg-background/50 rounded-lg border">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Time</span>
                <span className="font-bold text-[10px] sm:text-xs leading-tight text-center">{timeRemaining}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={ctaLink} className="flex-1">
              <Button size="lg" className="w-full">
                {ctaText}
              </Button>
            </Link>
            <Link to={`/competition/${competitionId}`}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};
