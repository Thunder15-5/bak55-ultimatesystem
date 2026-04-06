import { Trophy, Medal, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PrizeBreakdownProps {
  totalPrize: number;
  currency?: string;
}

export function PrizeBreakdown({ totalPrize, currency = "BAK" }: PrizeBreakdownProps) {
  const prizes = [
    { place: "1st", icon: Trophy, share: 0.5, color: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30", iconColor: "text-yellow-500" },
    { place: "2nd", icon: Medal, share: 0.3, color: "from-muted to-muted/50 border-muted-foreground/20", iconColor: "text-muted-foreground" },
    { place: "3rd", icon: Award, share: 0.2, color: "from-orange-500/20 to-orange-500/5 border-orange-500/30", iconColor: "text-orange-500" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {prizes.map((prize) => {
        const amount = Math.round(totalPrize * prize.share);
        const Icon = prize.icon;
        return (
          <Card
            key={prize.place}
            className={`p-3 sm:p-4 text-center bg-gradient-to-b ${prize.color} border`}
          >
            <Icon className={`h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 ${prize.iconColor}`} />
            <div className="text-xs font-medium text-muted-foreground">{prize.place} Place</div>
            <div className="text-sm sm:text-lg font-bold mt-0.5">
              {amount.toLocaleString()} {currency}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
