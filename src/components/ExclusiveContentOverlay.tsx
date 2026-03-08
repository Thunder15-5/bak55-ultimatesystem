import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ExclusiveContentOverlayProps {
  artistId: string;
  requiredTierLevel: number;
  artistName?: string;
}

export function ExclusiveContentOverlay({ artistId, requiredTierLevel, artistName }: ExclusiveContentOverlayProps) {
  const navigate = useNavigate();

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl">
      <div className="text-center space-y-4 p-6 max-w-sm">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Exclusive Content</h3>
        <p className="text-sm text-muted-foreground">
          This track is exclusive to {artistName ? `${artistName}'s` : "this artist's"} Fan Club
          {requiredTierLevel > 1 && ` (Tier ${requiredTierLevel}+)`}.
        </p>
        <Button
          onClick={() => navigate(`/artist/${artistId}`)}
          className="w-full"
        >
          <Crown className="mr-2 h-4 w-4" />
          Join Fan Club to Listen
        </Button>
      </div>
    </div>
  );
}
