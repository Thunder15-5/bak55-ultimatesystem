import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Ticket, Plus, Download, Copy, Loader2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Voucher {
  id: string;
  code: string;
  bak_coins: number;
  status: string;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
}

const Vouchers = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [numberOfCodes, setNumberOfCodes] = useState("10");
  const [bakCoins, setBakCoins] = useState("100");

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
    fetchVouchers();
  }, [userRole]);

  const fetchVouchers = async () => {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setVouchers(data || []);
    } catch (error: any) {
      console.error('Error fetching vouchers:', error);
      toast({
        title: "Error",
        description: "Failed to load vouchers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    const count = parseInt(numberOfCodes);
    const amount = parseFloat(bakCoins);

    if (!count || count < 1 || count > 100) {
      toast({
        title: "Invalid Input",
        description: "Number of codes must be between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Input",
        description: "BAKCoin amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('voucher-create', {
        body: {
          number_of_codes: count,
          bak_coins: amount
        }
      });

      if (error) throw error;

      if (data?.success) {
        // Log activity
        await supabase.from('admin_activity_log').insert({
          user_id: user?.id,
          event_type: 'voucher_created',
          event_category: 'payment',
          description: `Created ${data.count} vouchers worth ${amount} BAK each`,
          metadata: { count: data.count, bak_coins: amount, total_value: data.count * amount }
        });

        toast({
          title: "Vouchers Generated!",
          description: `Created ${data.count} voucher codes`,
        });
        fetchVouchers();
        setNumberOfCodes("10");
        setBakCoins("100");
      }
    } catch (error: any) {
      console.error('Error generating vouchers:', error);
      toast({
        title: "Generation Failed",
        description: error.message || 'Failed to generate vouchers',
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Voucher code copied to clipboard",
    });
  };

  const downloadCSV = () => {
    const csv = [
      ['Code', 'BAKCoins', 'Status', 'Created', 'Expires', 'Used At'].join(','),
      ...vouchers.map(v => [
        v.code,
        v.bak_coins,
        v.status,
        new Date(v.created_at).toLocaleDateString(),
        v.expires_at ? new Date(v.expires_at).toLocaleDateString() : 'Never',
        v.used_at ? new Date(v.used_at).toLocaleDateString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Voucher Management</h1>
          <p className="text-muted-foreground">Generate and manage BAKCoin voucher codes</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Generate Vouchers
              </CardTitle>
              <CardDescription>
                Create new voucher codes for distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="count">Number of Codes</Label>
                <Input
                  id="count"
                  type="number"
                  value={numberOfCodes}
                  onChange={(e) => setNumberOfCodes(e.target.value)}
                  min={1}
                  max={100}
                  disabled={generating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">BAKCoins per Voucher</Label>
                <Input
                  id="amount"
                  type="number"
                  value={bakCoins}
                  onChange={(e) => setBakCoins(e.target.value)}
                  min={1}
                  disabled={generating}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Ticket className="mr-2 h-4 w-4" />
                    Generate Vouchers
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold">
                    {vouchers.filter(v => v.status === 'unused').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Unused</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {vouchers.filter(v => v.status === 'used').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Used</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{vouchers.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={downloadCSV}
                disabled={vouchers.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Vouchers</CardTitle>
            <CardDescription>Latest 100 voucher codes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Used At</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-mono">{voucher.code}</TableCell>
                      <TableCell>{voucher.bak_coins} BAK</TableCell>
                      <TableCell>
                        <Badge variant={
                          voucher.status === 'unused' ? 'default' :
                          voucher.status === 'used' ? 'secondary' : 'destructive'
                        }>
                          {voucher.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(voucher.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {voucher.used_at ? new Date(voucher.used_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(voucher.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Vouchers;