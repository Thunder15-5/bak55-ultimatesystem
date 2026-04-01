import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface SuccessStateProps {
  title: string;
  description: string;
  nextAction?: {
    label: string;
    link: string;
    icon?: LucideIcon;
  };
}

export function SuccessState({ title, description, nextAction }: SuccessStateProps) {
  return (
    <Card className="border-success/30 bg-gradient-to-br from-success/5 to-success/10">
      <CardContent className="flex flex-col items-center text-center py-10 px-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <div className="space-y-2">
          <h3 className="font-heading font-bold text-xl">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        </div>
        {nextAction && (
          <Link to={nextAction.link}>
            <Button variant="outline" size="sm" className="mt-2">
              {nextAction.icon && <nextAction.icon className="w-4 h-4 mr-1.5" />}
              {nextAction.label}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
