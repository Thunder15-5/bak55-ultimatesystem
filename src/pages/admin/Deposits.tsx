import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Receipt, Check, X, Loader2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DepositRequest {
  id: string;
  user_id: string;
  amount_kes: number;
  expected_bak: number;
  receipt_code: string;
  screenshot_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  profiles: {
    username: string;
    email: string;
  };
}

const Deposits = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; deposit: DepositRequest | null; action: 'approve' | 'reject' }>({
    open: false,
    deposit: null,
    action: 'approve'
  });
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
    fetchDeposits();
  }, [userRole]);

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from('deposit_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(d => d.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const enrichedData = data.map(deposit => ({
          ...deposit,
          profiles: profileMap.get(deposit.user_id) || { username: 'Unknown', email: 'Unknown' }
        })) as DepositRequest[];

        setDeposits(enrichedData);
      }
    } catch (error: any) {
      console.error('Error fetching deposits:', error);
      toast({
        title: "Error",
        description: "Failed to load deposit requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewDialog.deposit) return;

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('deposit-review', {
        body: {
          request_id: reviewDialog.deposit.id,
          action: reviewDialog.action,
          notes: reviewNotes.trim() || null
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: `Deposit ${reviewDialog.action === 'approve' ? 'Approved' : 'Rejected'}`,
          description: data.message,
        });
        fetchDeposits();
        setReviewDialog({ open: false, deposit: null, action: 'approve' });
        setReviewNotes("");
      }
    } catch (error: any) {
      console.error('Error reviewing deposit:', error);
      toast({
        title: "Review Failed",
        description: error.message || 'Failed to process deposit',
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = deposits.filter(d => d.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Deposit Requests</h1>
          <p className="text-muted-foreground">Review and approve manual M-Pesa deposits</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{pendingCount}</CardTitle>
              <CardDescription>Pending Review</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {deposits.filter(d => d.status === 'approved').length}
              </CardTitle>
              <CardDescription>Approved</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {deposits.filter(d => d.status === 'rejected').length}
              </CardTitle>
              <CardDescription>Rejected</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Deposit Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : deposits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No deposit requests yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount (KSh)</TableHead>
                    <TableHead>BAKCoins</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deposit.profiles.username}</div>
                          <div className="text-sm text-muted-foreground">{deposit.profiles.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{deposit.amount_kes} KSh</TableCell>
                      <TableCell className="text-primary font-bold">{deposit.expected_bak.toFixed(2)} BAK</TableCell>
                      <TableCell className="font-mono text-sm">{deposit.receipt_code}</TableCell>
                      <TableCell>
                        <Badge variant={
                          deposit.status === 'pending' ? 'default' :
                          deposit.status === 'approved' ? 'secondary' : 'destructive'
                        }>
                          {deposit.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(deposit.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {deposit.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setReviewDialog({ open: true, deposit, action: 'approve' });
                                setReviewNotes("");
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setReviewDialog({ open: true, deposit, action: 'reject' });
                                setReviewNotes("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog({ ...reviewDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === 'approve' ? 'Approve' : 'Reject'} Deposit Request
            </DialogTitle>
            <DialogDescription>
              {reviewDialog.deposit && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span>User:</span>
                    <span className="font-medium">{reviewDialog.deposit.profiles.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">{reviewDialog.deposit.amount_kes} KSh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BAKCoins:</span>
                    <span className="font-medium text-primary">{reviewDialog.deposit.expected_bak.toFixed(2)} BAK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Receipt:</span>
                    <span className="font-mono text-sm">{reviewDialog.deposit.receipt_code}</span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {reviewDialog.action === 'approve' ? 'Approval Notes (optional)' : 'Rejection Reason (optional)'}
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={reviewDialog.action === 'approve' 
                  ? "Add any notes about this approval..." 
                  : "Explain why this deposit is being rejected..."
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog({ ...reviewDialog, open: false })}>
              Cancel
            </Button>
            <Button 
              variant={reviewDialog.action === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {reviewDialog.action === 'approve' ? <Check className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
                  {reviewDialog.action === 'approve' ? 'Approve' : 'Reject'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Deposits;