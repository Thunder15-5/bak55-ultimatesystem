import { Crown, Music, Briefcase, Heart, Headphones } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: "admin" | "artist" | "brand" | "fan" | "producer";
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const getRoleIcon = () => {
    switch (role) {
      case "admin":
        return <Crown className="w-3 h-3" />;
      case "artist":
        return <Music className="w-3 h-3" />;
      case "brand":
        return <Briefcase className="w-3 h-3" />;
      case "fan":
        return <Heart className="w-3 h-3" />;
      case "producer":
        return <Headphones className="w-3 h-3" />;
    }
  };

  const getRoleVariant = (): "default" | "secondary" | "outline" => {
    switch (role) {
      case "admin":
        return "default";
      case "artist":
        return "secondary";
      case "brand":
        return "outline";
      case "fan":
        return "secondary";
      case "producer":
        return "default";
    }
  };

  const formatRole = () => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <Badge variant={getRoleVariant()} className={cn("flex items-center gap-1 w-fit", className)}>
      {getRoleIcon()}
      {formatRole()}
    </Badge>
  );
}
