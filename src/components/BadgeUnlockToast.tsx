import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Share2 } from "lucide-react";
import confetti from "canvas-confetti";

interface BadgeUnlockToastProps {
  badge: {
    badge_name: string;
    badge_description: string;
    badge_icon: string;
    rarity: string;
  };
  onClose: () => void;
}

export function BadgeUnlockToast({ badge, onClose }: BadgeUnlockToastProps) {
  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-500 to-orange-500';
      case 'epic':
        return 'from-purple-500 to-pink-500';
      case 'rare':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const handleShare = () => {
    const text = `🎉 I just unlocked the "${badge.badge_name}" badge on BAK55! ${badge.badge_description}`;
    if (navigator.share) {
      navigator.share({
        title: 'Badge Unlocked!',
        text: text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="max-w-md w-full border-2 border-primary shadow-2xl animate-in zoom-in-95 duration-300">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Badge Unlocked!</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center text-4xl shadow-lg`}>
              {badge.badge_icon}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{badge.badge_name}</CardTitle>
              <Badge variant="outline" className="mt-1 capitalize">
                {badge.rarity}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription className="text-base">
            {badge.badge_description}
          </CardDescription>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={onClose}
            >
              Awesome!
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
