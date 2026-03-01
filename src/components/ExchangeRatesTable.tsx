import { useCurrency } from "@/contexts/CurrencyContext";
import { CURRENCY_LIST } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, RefreshCw } from "lucide-react";

const BAK_USD_RATE = 0.16;

interface ExchangeRatesTableProps {
  variant?: "full" | "compact";
  className?: string;
}

export function ExchangeRatesTable({ variant = "full", className = "" }: ExchangeRatesTableProps) {
  const { rates, ratesLoaded } = useCurrency();

  const getBAKValue = (currencyCode: string) => {
    const rate = rates[currencyCode];
    if (!rate) return null;
    return BAK_USD_RATE * rate;
  };

  if (variant === "compact") {
    return (
      <Card className={`border-primary/10 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            BAKCoin Rates
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {CURRENCY_LIST.slice(0, 5).map((c) => {
              const val = getBAKValue(c.code);
              return (
                <div key={c.code} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{c.flag} {c.code}</span>
                  <span className="font-medium">{c.symbol} {val ? val.toFixed(c.decimals) : "—"}</span>
                </div>
              );
            })}
          </div>
          {!ratesLoaded && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Loading rates...
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-primary/10 bg-card/50 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          1 BAKCoin Exchange Rates
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Base rate: 1 BAK = $0.16 USD • Rates update automatically
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {CURRENCY_LIST.map((c) => {
            const val = getBAKValue(c.code);
            return (
              <div
                key={c.code}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <span className="text-xl">{c.flag}</span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{c.code}</div>
                  <div className="font-semibold text-sm truncate">
                    {c.symbol} {val ? val.toFixed(c.decimals) : "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {!ratesLoaded && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Loading live rates...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
