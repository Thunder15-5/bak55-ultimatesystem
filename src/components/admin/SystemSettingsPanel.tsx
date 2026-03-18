import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Coins, Vote, Shield, Zap, Loader2, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlatformConfig {
  vote_cost_bak: number;
  artist_share_percent: number;
  platform_share_percent: number;
  self_vote_limit_per_day: number;
  max_votes_per_submission_per_hour: number;
  min_withdrawal_bak: number;
  withdrawal_fee_percent: number;
  escrow_hold_days: number;
  bak_to_usd_rate: number;
}

const DEFAULT_CONFIG: PlatformConfig = {
  vote_cost_bak: 1,
  artist_share_percent: 65,
  platform_share_percent: 35,
  self_vote_limit_per_day: 10,
  max_votes_per_submission_per_hour: 50,
  min_withdrawal_bak: 250,
  withdrawal_fee_percent: 5,
  escrow_hold_days: 7,
  bak_to_usd_rate: 0.16,
};

export function SystemSettingsPanel() {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [featureFlags, setFeatureFlags] = useState({
    likes_enabled: true,
    comments_enabled: true,
    shuffle_mode: true,
    repeat_mode: true,
    merch_store_enabled: true,
    referral_system_enabled: true,
    competitions_enabled: true,
    blog_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // Load from platform_config table if exists, otherwise use defaults
      const { data } = await supabase
        .from('withdrawal_config')
        .select('config_key, config_value');

      if (data) {
        const min = data.find(d => d.config_key === 'min_withdrawal');
        const escrow = data.find(d => d.config_key === 'escrow_period');
        const thresholds = data.find(d => d.config_key === 'activity_thresholds');

        setConfig(prev => ({
          ...prev,
          min_withdrawal_bak: (min?.config_value as any)?.amount || prev.min_withdrawal_bak,
          escrow_hold_days: (escrow?.config_value as any)?.days || prev.escrow_hold_days,
        }));
      }

      // Load sales config
      const { data: salesData } = await supabase
        .from('sales_config')
        .select('config_key, config_value');

      if (salesData) {
        const fee = salesData.find(d => d.config_key === 'withdrawal_fee_percent');
        const rate = salesData.find(d => d.config_key === 'bak_to_kes_rate');
        setConfig(prev => ({
          ...prev,
          withdrawal_fee_percent: fee ? Number(fee.config_value) : prev.withdrawal_fee_percent,
          bak_to_usd_rate: rate ? Number(rate.config_value) : prev.bak_to_usd_rate,
        }));
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVotingRules = async () => {
    setSaving(true);
    try {
      // Validate shares add up to 100
      if (config.artist_share_percent + config.platform_share_percent !== 100) {
        toast.error("Artist + Platform share must equal 100%");
        return;
      }

      // Log the configuration change
      await supabase.from('admin_activity_log').insert([{
        event_type: 'config_update', event_category: 'system',
        description: `Voting rules updated: cost=${config.vote_cost_bak} BAK, artist=${config.artist_share_percent}%, self-limit=${config.self_vote_limit_per_day}/day`,
        metadata: { voting_rules: config },
      }]);

      toast.success("Voting rules saved. Note: Edge function constants must be redeployed for changes to take effect.");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFinancial = async () => {
    setSaving(true);
    try {
      await Promise.all([
        supabase.from('withdrawal_config')
          .update({ config_value: { amount: config.min_withdrawal_bak }, updated_at: new Date().toISOString() })
          .eq('config_key', 'min_withdrawal'),
        supabase.from('withdrawal_config')
          .update({ config_value: { days: config.escrow_hold_days }, updated_at: new Date().toISOString() })
          .eq('config_key', 'escrow_period'),
        supabase.from('sales_config')
          .update({ config_value: config.withdrawal_fee_percent })
          .eq('config_key', 'withdrawal_fee_percent'),
        supabase.from('sales_config')
          .update({ config_value: config.bak_to_usd_rate })
          .eq('config_key', 'bak_to_kes_rate'),
      ]);

      await supabase.from('admin_activity_log').insert({
        event_type: 'config_update', event_category: 'financial',
        description: `Financial config updated: min withdrawal=${config.min_withdrawal_bak} BAK, fee=${config.withdrawal_fee_percent}%`,
        metadata: { financial_config: config },
      });

      toast.success("Financial settings saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Tabs defaultValue="voting" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="voting">Voting Rules</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="features">Feature Toggles</TabsTrigger>
      </TabsList>

      {/* Voting Rules */}
      <TabsContent value="voting" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Vote className="h-5 w-5 text-primary" /> Voting Rules</CardTitle>
            <CardDescription>Configure how voting works across competitions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vote Cost (BAK per vote)</Label>
                <Input type="number" min={0.1} step={0.1} value={config.vote_cost_bak}
                  onChange={e => setConfig(p => ({ ...p, vote_cost_bak: parseFloat(e.target.value) || 1 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Self-Vote Limit (per day)</Label>
                <Input type="number" min={0} value={config.self_vote_limit_per_day}
                  onChange={e => setConfig(p => ({ ...p, self_vote_limit_per_day: parseInt(e.target.value) || 10 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Votes per Submission per Hour</Label>
                <Input type="number" min={1} value={config.max_votes_per_submission_per_hour}
                  onChange={e => setConfig(p => ({ ...p, max_votes_per_submission_per_hour: parseInt(e.target.value) || 50 }))} />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Artist Share (%)</Label>
                <Input type="number" min={0} max={100} value={config.artist_share_percent}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 65;
                    setConfig(p => ({ ...p, artist_share_percent: v, platform_share_percent: 100 - v }));
                  }} />
              </div>
              <div className="space-y-1.5">
                <Label>Platform Share (%)</Label>
                <Input type="number" value={config.platform_share_percent} disabled className="bg-muted" />
                <p className="text-[10px] text-muted-foreground">Auto-calculated (100% - Artist Share)</p>
              </div>
            </div>

            <Button onClick={handleSaveVotingRules} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save Voting Rules
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Financial */}
      <TabsContent value="financial" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /> Financial Settings</CardTitle>
            <CardDescription>Configure pricing, withdrawal limits, and exchange rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Minimum Withdrawal (BAK)</Label>
                <Input type="number" min={1} value={config.min_withdrawal_bak}
                  onChange={e => setConfig(p => ({ ...p, min_withdrawal_bak: parseInt(e.target.value) || 250 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Withdrawal Fee (%)</Label>
                <Input type="number" min={0} max={50} step={0.5} value={config.withdrawal_fee_percent}
                  onChange={e => setConfig(p => ({ ...p, withdrawal_fee_percent: parseFloat(e.target.value) || 5 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Competition Escrow Hold (Days)</Label>
                <Input type="number" min={1} value={config.escrow_hold_days}
                  onChange={e => setConfig(p => ({ ...p, escrow_hold_days: parseInt(e.target.value) || 7 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>BAK to USD Rate</Label>
                <Input type="number" min={0.01} step={0.01} value={config.bak_to_usd_rate}
                  onChange={e => setConfig(p => ({ ...p, bak_to_usd_rate: parseFloat(e.target.value) || 0.16 }))} />
                <p className="text-[10px] text-muted-foreground">1 BAK = ${config.bak_to_usd_rate} USD</p>
              </div>
            </div>

            <Button onClick={handleSaveFinancial} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save Financial Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Feature Toggles */}
      <TabsContent value="features" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Feature Toggles</CardTitle>
            <CardDescription>Enable or disable platform modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'likes_enabled', label: 'Track Likes', desc: 'Allow fans to like tracks' },
              { key: 'comments_enabled', label: 'Comments', desc: 'Allow comments on tracks' },
              { key: 'merch_store_enabled', label: 'Merch Store', desc: 'Born African Royalty merch shop' },
              { key: 'referral_system_enabled', label: 'Referral System', desc: 'Core Puller referral tracking' },
              { key: 'competitions_enabled', label: 'Competitions', desc: 'Music competitions & voting' },
              { key: 'blog_enabled', label: 'Blog', desc: 'Platform blog & content' },
              { key: 'shuffle_mode', label: 'Shuffle Mode', desc: 'Music player shuffle' },
              { key: 'repeat_mode', label: 'Repeat Mode', desc: 'Music player repeat' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={(featureFlags as any)[item.key]}
                  onCheckedChange={v => setFeatureFlags(p => ({ ...p, [item.key]: v }))}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-2">
              Note: Feature toggles are stored locally and require a code deployment to take effect globally via <code>src/lib/featureFlags.ts</code>.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
