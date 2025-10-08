import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Wallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    // Fetch wallet balance
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user!.id)
      .single();
    setWallet(walletData);

    // Fetch transactions
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setTransactions(transactionsData || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-gradient mb-8">My Wallet</h1>

        <Card className="p-6 mb-8 text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Balance</h2>
          <p className="text-5xl font-bold text-gradient">{wallet?.balance || 0} BAKCoins</p>
        </Card>

        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold text-secondary mb-4">Top Up</h2>
          <div className="flex gap-4">
            <Input
              type="number"
              placeholder="Amount (KES)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button>Pay with Paystack</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Paystack integration pending API key
          </p>
        </Card>

        <h2 className="text-2xl font-bold text-accent mb-4">Transaction History</h2>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <Card key={tx.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-foreground">{tx.type}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(tx.created_at).toLocaleString()}
                </p>
              </div>
              <p className={`font-bold ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {tx.amount >= 0 ? '+' : ''}{tx.amount} BAKCoins
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
