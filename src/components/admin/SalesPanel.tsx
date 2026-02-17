import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, Download, TrendingUp, ShoppingBag, Settings, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaleSummary {
  totalSales: number;
  totalRevenue: number;
  totalWithdrawalFees: number;
  recentSales: any[];
}

export function SalesPanel() {
  const [stats, setStats] = useState<SaleSummary>({
    totalSales: 0,
    totalRevenue: 0,
    totalWithdrawalFees: 0,
    recentSales: [],
  });
  const [loading, setLoading] = useState(true);
  const [withdrawalFee, setWithdrawalFee] = useState("5");
  const [savingFee, setSavingFee] = useState(false);

  useEffect(() => {
    fetchSalesData();
    fetchConfig();
  }, []);

  const fetchSalesData = async () => {
    try {
      // Fetch all completed purchases
      const { data: purchases, error } = await supabase
        .from('song_purchases')
        .select('*, tracks(title), profiles!song_purchases_buyer_id_fkey(username, email), artist:profiles!song_purchases_artist_id_fkey(username)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const totalRevenue = (purchases || []).reduce((sum, p) => sum + (p.amount_kes || 0), 0);

      setStats({
        totalSales: purchases?.length || 0,
        totalRevenue,
        totalWithdrawalFees: totalRevenue * 0.05, // Estimated based on 5% at withdrawal
        recentSales: purchases || [],
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
      .select('config_value')
      .eq('config_key', 'withdrawal_fee_percent')
      .single();
    if (data) {
      setWithdrawalFee(String(data.config_value));
    }
  };

  const handleUpdateFee = async () => {
    setSavingFee(true);
    try {
      const { error } = await supabase
        .from('sales_config')
        .update({ config_value: parseFloat(withdrawalFee), updated_at: new Date().toISOString() })
        .eq('config_key', 'withdrawal_fee_percent');

      if (error) throw error;
      toast.success(`Withdrawal fee updated to ${withdrawalFee}%`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setSavingFee(false);
    }
  };

  const handleExportCSV = () => {
    if (stats.recentSales.length === 0) {
      toast.error("No sales data to export");
      return;
    }

    const headers = ['Date', 'Track', 'Artist', 'Buyer', 'Amount (KES)', 'Payment Method'];
    const rows = stats.recentSales.map(sale => [
      new Date(sale.created_at).toLocaleDateString(),
      sale.tracks?.title || 'Unknown',
      sale.artist?.username || 'Unknown',
      sale.profiles?.username || sale.profiles?.email || 'Unknown',
      sale.amount_kes,
      sale.payment_method,
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
            <CardTitle className="text-sm font-medium">Total Revenue (KES)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">100% credited to artists</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Withdrawal Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.totalWithdrawalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Platform revenue at withdrawal</p>
          </CardContent>
        </Card>
      </div>

      {/* Config + Export */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" /> Withdrawal Fee Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="fee">Fee Percentage (%)</Label>
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
              <Button onClick={handleUpdateFee} disabled={savingFee} size="sm">
                {savingFee ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This fee is deducted when artists withdraw their song sale earnings.
            </p>
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

      {/* Recent Sales Table */}
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
                    <p className="font-medium text-sm truncate">{sale.tracks?.title || 'Unknown Track'}</p>
                    <p className="text-xs text-muted-foreground">
                      by {sale.artist?.username || 'Unknown'} • bought by {sale.profiles?.username || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.created_at).toLocaleDateString()} • {sale.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">KES {sale.amount_kes}</Badge>
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
