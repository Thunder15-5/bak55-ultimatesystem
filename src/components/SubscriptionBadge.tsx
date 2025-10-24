import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles } from "lucide-react";

interface SubscriptionBadgeProps {
  planName: string;
  className?: string;
}

export function SubscriptionBadge({ planName, className }: SubscriptionBadgeProps) {
  const getBadgeVariant = () => {
    if (planName === 'Artist Premium') return 'default';
    if (planName === 'Artist Pro') return 'secondary';
    return 'outline';
  };

  const getIcon = () => {
    if (planName === 'Artist Premium') return <Crown className="w-3 h-3 mr-1" />;
    if (planName === 'Artist Pro') return <Sparkles className="w-3 h-3 mr-1" />;
    return null;
  };

  return (
    <Badge variant={getBadgeVariant()} className={className}>
      {getIcon()}
      {planName.replace('Artist ', '')}
    </Badge>
  );
}