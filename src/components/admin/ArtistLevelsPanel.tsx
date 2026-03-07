import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Loader2, Save } from "lucide-react";

interface LevelConfig {
  id: string;
  level_number: number;
  level_name: string;
  min_streams: number;
  min_followers: number;
  requires_kyc: boolean;
  can_withdraw: boolean;
  badge_icon: string;
}

export function ArtistLevelsPanel() {
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { fetchLevels(); }, []);

  const fetchLevels = async () => {
    const { data } = await supabase
      .from('artist_level_config')
      .select('*')
      .order('level_number');
    setLevels((data as any[]) || []);
    setLoading(false);
  };

  const updateLevel = (id: string, field: string, value: any) => {
    setLevels(levels.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const saveLevel = async (level: LevelConfig) => {
    setSaving(level.id);
    const { error } = await supabase
      .from('artist_level_config')
      .update({
        level_name: level.level_name,
        min_streams: level.min_streams,
        min_followers: level.min_followers,
        requires_kyc: level.requires_kyc,
        can_withdraw: level.can_withdraw,
        badge_icon: level.badge_icon,
      })
      .eq('id', level.id);

    if (error) toast.error('Failed to save');
    else toast.success(`Level ${level.level_number} updated`);
    setSaving(null);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Artist Progression Levels
          </CardTitle>
          <CardDescription>Configure requirements for each artist level</CardDescription>
        </CardHeader>
      </Card>

      {levels.map(level => (
        <Card key={level.id} className="border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-xl">{level.badge_icon}</span>
              Level {level.level_number}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Level Name</Label>
                <Input value={level.level_name} onChange={e => updateLevel(level.id, 'level_name', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Badge Icon</Label>
                <Input value={level.badge_icon} onChange={e => updateLevel(level.id, 'badge_icon', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Min Streams</Label>
                <Input type="number" value={level.min_streams} onChange={e => updateLevel(level.id, 'min_streams', parseInt(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Min Followers</Label>
                <Input type="number" value={level.min_followers} onChange={e => updateLevel(level.id, 'min_followers', parseInt(e.target.value))} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={level.requires_kyc} onCheckedChange={v => updateLevel(level.id, 'requires_kyc', v)} />
                <Label className="text-xs">Requires KYC</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={level.can_withdraw} onCheckedChange={v => updateLevel(level.id, 'can_withdraw', v)} />
                <Label className="text-xs">Can Withdraw</Label>
              </div>
            </div>
            <Button size="sm" onClick={() => saveLevel(level)} disabled={saving === level.id}>
              {saving === level.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Save
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
