import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Award, Plus, Loader2, Edit, Users } from "lucide-react";

interface FanBadge {
  id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_type: string;
  rarity: string;
  unlock_criteria: any;
  created_at: string;
}

interface BadgeStats {
  badge_id: string;
  earned_count: number;
}

export function BadgeManagementPanel() {
  const [badges, setBadges] = useState<FanBadge[]>([]);
  const [badgeStats, setBadgeStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBadge, setNewBadge] = useState({
    badge_name: "",
    badge_description: "",
    badge_icon: "🏆",
    badge_type: "mega_fan",
    rarity: "common",
    unlock_criteria: "{}",
  });

  useEffect(() => {
    fetchBadges();
    fetchBadgeStats();
  }, []);

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('fan_badges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast.error('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  const fetchBadgeStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id');

      if (error) throw error;

      const stats: Record<string, number> = {};
      data?.forEach((item) => {
        stats[item.badge_id] = (stats[item.badge_id] || 0) + 1;
      });

      setBadgeStats(stats);
    } catch (error) {
      console.error('Error fetching badge stats:', error);
    }
  };

  const handleCreateBadge = async () => {
    try {
      let criteria;
      try {
        criteria = JSON.parse(newBadge.unlock_criteria);
      } catch {
        toast.error('Invalid JSON in unlock criteria');
        return;
      }

      const { error } = await supabase
        .from('fan_badges')
        .insert({
          badge_name: newBadge.badge_name,
          badge_description: newBadge.badge_description,
          badge_icon: newBadge.badge_icon,
          badge_type: newBadge.badge_type,
          rarity: newBadge.rarity,
          unlock_criteria: criteria,
        });

      if (error) throw error;

      toast.success('Badge created successfully!');
      setCreateDialogOpen(false);
      setNewBadge({
        badge_name: "",
        badge_description: "",
        badge_icon: "🏆",
        badge_type: "mega_fan",
        rarity: "common",
        unlock_criteria: "{}",
      });
      fetchBadges();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create badge');
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-500 to-orange-500';
      case 'epic':
        return 'from-purple-500 to-pink-500';
      case 'rare':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-500/50';
      case 'epic':
        return 'border-purple-500/50';
      case 'rare':
        return 'border-blue-500/50';
      default:
        return 'border-gray-400/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Badge Management</h3>
          <p className="text-muted-foreground">Create and manage fan badges</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Badge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Badge</DialogTitle>
              <DialogDescription>Define a new fan badge with unlock criteria</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="badge_name">Badge Name</Label>
                <Input
                  id="badge_name"
                  value={newBadge.badge_name}
                  onChange={(e) => setNewBadge({ ...newBadge, badge_name: e.target.value })}
                  placeholder="Mega Fan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge_icon">Badge Icon (Emoji)</Label>
                <Input
                  id="badge_icon"
                  value={newBadge.badge_icon}
                  onChange={(e) => setNewBadge({ ...newBadge, badge_icon: e.target.value })}
                  placeholder="🏆"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge_description">Description</Label>
                <Textarea
                  id="badge_description"
                  value={newBadge.badge_description}
                  onChange={(e) => setNewBadge({ ...newBadge, badge_description: e.target.value })}
                  placeholder="Cast 50 votes in a single competition"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="badge_type">Badge Type</Label>
                  <Select
                    value={newBadge.badge_type}
                    onValueChange={(value) => setNewBadge({ ...newBadge, badge_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mega_fan">Mega Fan</SelectItem>
                      <SelectItem value="early_supporter">Early Supporter</SelectItem>
                      <SelectItem value="loyal_voter">Loyal Voter</SelectItem>
                      <SelectItem value="talent_scout">Talent Scout</SelectItem>
                      <SelectItem value="first_blood">First Blood</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rarity">Rarity</Label>
                  <Select
                    value={newBadge.rarity}
                    onValueChange={(value) => setNewBadge({ ...newBadge, rarity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unlock_criteria">Unlock Criteria (JSON)</Label>
                <Textarea
                  id="unlock_criteria"
                  value={newBadge.unlock_criteria}
                  onChange={(e) => setNewBadge({ ...newBadge, unlock_criteria: e.target.value })}
                  placeholder='{"votes_required": 50}'
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={handleCreateBadge} className="w-full">
                Create Badge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <Card key={badge.id} className={`${getRarityBorder(badge.rarity)} border-2`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center text-3xl mb-3`}>
                  {badge.badge_icon}
                </div>
                <Badge variant="outline" className="capitalize">
                  {badge.rarity}
                </Badge>
              </div>
              <CardTitle className="text-lg">{badge.badge_name}</CardTitle>
              <CardDescription>{badge.badge_description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="secondary" className="text-xs">
                    {badge.badge_type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Earned by
                  </span>
                  <span className="font-semibold">{badgeStats[badge.id] || 0} users</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
