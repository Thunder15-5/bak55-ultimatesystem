import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroActionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionLink: string;
  gradient?: string;
}

export function HeroAction({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionLink,
  gradient = "from-primary/10 to-secondary/5",
}: HeroActionProps) {
  return (
    <Link to={actionLink} className="block">
      <Card className={`group border-primary/20 hover:border-primary/40 bg-gradient-to-r ${gradient} transition-all duration-300 hover:shadow-lg cursor-pointer`}>
        <CardContent className="flex items-center gap-4 p-5 sm:p-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-base sm:text-lg">{title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
          <Button variant="hero" size="sm" className="flex-shrink-0 group-hover:shadow-lg">
            {actionLabel}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
