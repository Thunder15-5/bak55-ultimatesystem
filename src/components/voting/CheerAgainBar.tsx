import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  artistName: string;
  artistAvatar?: string | null;
  lastQuantity: number;
  onCheer: () => void;
}

export function CheerAgainBar({ artistName, artistAvatar, lastQuantity, onCheer }: Props) {
  return (
    <div className="fixed left-0 right-0 bottom-16 z-40 px-3 pb-2 pointer-events-none">
      <div className="mx-auto max-w-md pointer-events-auto animate-slide-in-up">
        <div className="rounded-full bg-card/95 backdrop-blur shadow-lg border border-primary/40 pl-2 pr-2 py-1.5 flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-1 ring-primary/40">
            <AvatarImage src={artistAvatar || undefined} />
            <AvatarFallback className="text-[10px]">{artistName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-muted-foreground leading-tight">Keep momentum</div>
            <div className="text-xs font-semibold truncate">Cheer {artistName} again</div>
          </div>
          <Button size="sm" className="h-9 rounded-full px-4" onClick={onCheer}>
            <Heart className="h-3.5 w-3.5 mr-1" /> {lastQuantity} BAK
          </Button>
        </div>
      </div>
    </div>
  );
}
