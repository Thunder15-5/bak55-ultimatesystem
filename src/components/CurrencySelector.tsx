import { useCurrency } from "@/contexts/CurrencyContext";
import { CURRENCY_LIST, SupportedCurrency } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

interface CurrencySelectorProps {
  variant?: "compact" | "full";
  className?: string;
}

export function CurrencySelector({ variant = "compact", className = "" }: CurrencySelectorProps) {
  const { currency, setCurrency } = useCurrency();

  if (variant === "compact") {
    return (
      <Select value={currency} onValueChange={(v) => setCurrency(v as SupportedCurrency)}>
        <SelectTrigger className={`w-[80px] h-8 text-xs border-border/50 bg-background/50 ${className}`}>
          <Globe className="w-3 h-3 mr-1 flex-shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCY_LIST.map((c) => (
            <SelectItem key={c.code} value={c.code} className="text-xs">
              {c.flag} {c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={currency} onValueChange={(v) => setCurrency(v as SupportedCurrency)}>
      <SelectTrigger className={`w-full ${className}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_LIST.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="flex items-center gap-2">
              <span>{c.flag}</span>
              <span>{c.code}</span>
              <span className="text-muted-foreground text-xs">— {c.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
