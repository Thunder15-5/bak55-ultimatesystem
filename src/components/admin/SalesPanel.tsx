import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, Download, TrendingUp, ShoppingBag, Settings, Loader2, Coins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/contexts/CurrencyContext";

interface SaleSummary {
  totalSales: number;
  totalRevenueBak: number;
  recentSales: any[];
}

export function SalesPanel() {
  const { formatFromKES } = useCurrency();
  const [stats, setStats] = useState<SaleSummary>({
    totalSales: 0,
    totalRevenueBak: 0,
    recentSales: [],
  });
  const [loading, setLoading] = useState(true);
  const [withdrawalFee, setWithdrawalFee] = useState("5");
  const [bakRate, setBakRate] = useState("1");
  const [savingFee, setSavingFee] = useState(false);
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    fetchSalesData();
    fetchConfig();
  }, []);

  const fetchSalesData = async () => {
    try {
      const { data: purchases, error } = await supabase
        .from('song_purchases')
        .select('id, created_at, status, track_id, buyer_id, artist_id')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch amount_bak separately using raw cast since types may lag migrations
      const purchasesWithBak: any[] = purchases || [];
      const totalRevenueBak = purchasesWithBak.reduce((sum, p) => sum + (Number((p as any).amount_bak) || 0), 0);

      setStats({
        totalSales: purchasesWithBak.length,
        totalRevenueBak,
        recentSales: purchasesWithBak,
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('sales_config')
      .select('config_key, config_value');

    if (data) {
      const fee = data.find(d => d.config_key === 'withdrawal_fee_percent');
      const rate = data.find(d => d.config_key === 'bak_to_kes_rate');
      if (fee) setWithdrawalFee(String(fee.config_value));
      if (rate) setBakRate(String(rate.config_value));
    }
  };

  const handleUpdateConfig = async (key: string, value: string, label: string, setter: (v: boolean) => void) => {
    setter(true);
    try {
      const { error } = await supabase
        .from('sales_config')
        .update({ config_value: parseFloat(value) })
        .eq('config_key', key);

      if (error) throw error;
      toast.success(`${label} updated successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setter(false);
    }
  };

  const handleExportCSV = () => {
    if (stats.recentSales.length === 0) {
      toast.error("No sales data to export");
      return;
    }

    const headers = ['Date', 'Track ID', 'Artist ID', 'Buyer ID', 'Amount (BAK)'];
    const rows = stats.recentSales.map(sale => [
      new Date(sale.created_at).toLocaleDateString(),
      sale.track_id,
      sale.artist_id,
      sale.buyer_id,
      sale.amount_bak,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bak55-sales-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const estKes = (stats.totalRevenueBak * Number(bakRate)).toLocaleString();
  const estFees = (stats.totalRevenueBak * Number(bakRate) * (Number(withdrawalFee) / 100)).toLocaleString();

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Song Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (BAK)</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenueBak.toFixed(2)} BAK</div>
            <p className="text-xs text-muted-foreground">≈ {formatFromKES(stats.totalRevenueBak * Number(bakRate))} • 100% to artists</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Withdrawal Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFromKES(stats.totalRevenueBak * Number(bakRate) * (Number(withdrawalFee) / 100))}</div>
            <p className="text-xs text-muted-foreground">Platform revenue at withdrawal ({withdrawalFee}%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Config Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" /> Withdrawal Fee
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="fee">Fee (%)</Label>
                <Input
                  id="fee"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={withdrawalFee}
                  onChange={(e) => setWithdrawalFee(e.target.value)}
                />
              </div>
              <Button
                onClick={() => handleUpdateConfig('withdrawal_fee_percent', withdrawalFee, 'Withdrawal fee', setSavingFee)}
                disabled={savingFee}
                size="sm"
              >
                {savingFee ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Deducted when artists withdraw earnings.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> BAK → USD Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="rate">1 BAK = X USD</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={bakRate}
                  onChange={(e) => setBakRate(e.target.value)}
                />
              </div>
              <Button
                onClick={() => handleUpdateConfig('bak_to_kes_rate', bakRate, 'BAK rate', setSavingRate)}
                disabled={savingRate}
                size="sm"
              >
                {savingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Used for withdrawal conversions.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4" /> Export Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportCSV} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Sales CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Latest song purchases across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentSales.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No sales yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      Track: {sale.track_id?.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="gap-1">
                      <Coins className="w-3 h-3" />
                      {Number(sale.amount_bak).toFixed(2)} BAK
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
