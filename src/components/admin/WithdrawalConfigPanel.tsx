import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Shield, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WithdrawalConfigItem {
  id: string;
  config_key: string;
  config_value: any;
  description: string;
}

interface FraudFlag {
  id: string;
  user_id: string;
  flag_type: string;
  severity: string;
  description: string;
  status: string;
  created_at: string;
  metadata: any;
}

interface EscrowItem {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  hold_until: string;
  fraud_review_status: string;
  competition_id: string;
}

interface KYCItem {
  id: string;
  user_id: string;
  status: string;
  full_legal_name: string;
  id_type: string;
  submitted_at: string;
}

export function WithdrawalConfigPanel() {
  const [configs, setConfigs] = useState<WithdrawalConfigItem[]>([]);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [escrowItems, setEscrowItems] = useState<EscrowItem[]>([]);
  const [kycItems, setKYCItems] = useState<KYCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [configRes, fraudRes, escrowRes, kycRes] = await Promise.all([
      supabase.from('withdrawal_config').select('*'),
      supabase.from('fraud_flags').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('competition_escrow').select('*').eq('status', 'held').order('created_at', { ascending: false }),
      supabase.from('kyc_verifications').select('*').order('submitted_at', { ascending: false }).limit(50),
    ]);

    setConfigs((configRes.data as any[]) || []);
    setFraudFlags((fraudRes.data as any[]) || []);
    setEscrowItems((escrowRes.data as any[]) || []);
    setKYCItems((kycRes.data as any[]) || []);

    const values: Record<string, any> = {};
    (configRes.data || []).forEach((c: any) => {
      values[c.config_key] = c.config_value;
    });
    setEditValues(values);
    setLoading(false);
  };

  const saveConfig = async (key: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('withdrawal_config')
      .update({ config_value: editValues[key], updated_at: new Date().toISOString() })
      .eq('config_key', key);

    if (error) toast.error('Failed to save');
    else toast.success('Configuration saved');
    setSaving(false);
  };

  const resolveFraudFlag = async (flagId: string, notes: string) => {
    await supabase
      .from('fraud_flags')
      .update({ status: 'resolved', resolution_notes: notes, resolved_at: new Date().toISOString() })
      .eq('id', flagId);
    toast.success('Flag resolved');
    fetchAll();
  };

  const approveKYC = async (kycId: string) => {
    await supabase
      .from('kyc_verifications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', kycId);
    toast.success('KYC approved');
    fetchAll();
  };

  const rejectKYC = async (kycId: string, reason: string) => {
    await supabase
      .from('kyc_verifications')
      .update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() })
      .eq('id', kycId);
    toast.success('KYC rejected');
    fetchAll();
  };

  const releaseEscrow = async (escrowId: string) => {
    const escrow = escrowItems.find(e => e.id === escrowId);
    if (!escrow) return;

    // Credit wallet
    await supabase.rpc('transfer_funds', {
      sender_id: 'b2a31558-e58a-466f-99b8-7ba636bcf6be', // platform wallet
      recipient_id: escrow.user_id,
      transfer_amount: escrow.amount,
    });

    await supabase
      .from('competition_escrow')
      .update({ status: 'released', released_at: new Date().toISOString() })
      .eq('id', escrowId);

    toast.success('Escrow released');
    fetchAll();
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Tabs defaultValue="config" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="config">Thresholds</TabsTrigger>
        <TabsTrigger value="kyc">
          KYC ({kycItems.filter(k => k.status === 'pending').length})
        </TabsTrigger>
        <TabsTrigger value="escrow">
          Escrow ({escrowItems.length})
        </TabsTrigger>
        <TabsTrigger value="fraud">
          Fraud ({fraudFlags.filter(f => f.status === 'pending').length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="config" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Withdrawal Configuration
            </CardTitle>
            <CardDescription>Modify thresholds and requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Min Withdrawal */}
            <div className="space-y-2">
              <Label>Minimum Withdrawal Amount (BAK)</Label>
              <Input
                type="number"
                value={editValues['min_withdrawal']?.amount || 250}
                onChange={e => setEditValues({
                  ...editValues,
                  min_withdrawal: { amount: parseInt(e.target.value) }
                })}
              />
              <Button size="sm" onClick={() => saveConfig('min_withdrawal')} disabled={saving}>Save</Button>
            </div>

            {/* Activity Thresholds */}
            <div className="space-y-2">
              <Label>Activity Thresholds</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Min Followers</Label>
                  <Input
                    type="number"
                    value={editValues['activity_thresholds']?.min_followers || 100}
                    onChange={e => setEditValues({
                      ...editValues,
                      activity_thresholds: {
                        ...editValues['activity_thresholds'],
                        min_followers: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Min Streams</Label>
                  <Input
                    type="number"
                    value={editValues['activity_thresholds']?.min_streams || 1000}
                    onChange={e => setEditValues({
                      ...editValues,
                      activity_thresholds: {
                        ...editValues['activity_thresholds'],
                        min_streams: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
              <Button size="sm" onClick={() => saveConfig('activity_thresholds')} disabled={saving}>Save</Button>
            </div>

            {/* Escrow Period */}
            <div className="space-y-2">
              <Label>Competition Escrow Hold (Days)</Label>
              <Input
                type="number"
                value={editValues['escrow_period']?.days || 7}
                onChange={e => setEditValues({
                  ...editValues,
                  escrow_period: { days: parseInt(e.target.value) }
                })}
              />
              <Button size="sm" onClick={() => saveConfig('escrow_period')} disabled={saving}>Save</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="kyc" className="space-y-3">
        {kycItems.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No KYC submissions</CardContent></Card>
        ) : kycItems.map(kyc => (
          <Card key={kyc.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{kyc.full_legal_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {kyc.id_type} • Submitted {new Date(kyc.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={kyc.status === 'approved' ? 'default' : kyc.status === 'rejected' ? 'destructive' : 'secondary'}>
                  {kyc.status}
                </Badge>
              </div>
              {kyc.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => approveKYC(kyc.id)}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectKYC(kyc.id, 'Documents insufficient')}>
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="escrow" className="space-y-3">
        {escrowItems.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No held escrow</CardContent></Card>
        ) : escrowItems.map(escrow => (
          <Card key={escrow.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{escrow.amount.toFixed(2)} BAK</p>
                  <p className="text-xs text-muted-foreground">
                    Hold until: {new Date(escrow.hold_until).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={escrow.fraud_review_status === 'cleared' ? 'default' : 'secondary'}>
                    {escrow.fraud_review_status}
                  </Badge>
                  <Button size="sm" onClick={() => releaseEscrow(escrow.id)}>Release</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="fraud" className="space-y-3">
        {fraudFlags.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No fraud flags</CardContent></Card>
        ) : fraudFlags.map(flag => (
          <Card key={flag.id} className={flag.severity === 'high' ? 'border-red-500/30' : ''}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${flag.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <span className="font-medium text-sm">{flag.flag_type}</span>
                </div>
                <Badge variant={flag.status === 'resolved' ? 'default' : flag.severity === 'high' ? 'destructive' : 'secondary'}>
                  {flag.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{flag.description}</p>
              <p className="text-xs text-muted-foreground">{new Date(flag.created_at).toLocaleString()}</p>
              {flag.status === 'pending' && (
                <Button size="sm" variant="outline" className="mt-2" onClick={() => resolveFraudFlag(flag.id, 'Reviewed and cleared')}>
                  Resolve
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}
