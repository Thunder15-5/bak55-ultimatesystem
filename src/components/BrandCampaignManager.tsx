import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, BarChart3, Target, Loader2, TrendingUp, DollarSign } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  budget: number;
  spent: number;
  status: string;
  target_genres: string[] | null;
  start_date: string | null;
  end_date: string | null;
  metrics: any;
  created_at: string;
}

export function BrandCampaignManager() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    target_genres: "",
  });

  useEffect(() => {
    if (user) fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from("brand_campaigns")
      .select("*")
      .eq("brand_id", user!.id)
      .order("created_at", { ascending: false });

    if (!error) setCampaigns(data || []);
    setLoading(false);
  };

  const createCampaign = async () => {
    if (!form.title || !form.budget) {
      toast.error("Title and budget are required");
      return;
    }
    setSaving(true);
    try {
      const genres = form.target_genres
        .split(",")
        .map(g => g.trim())
        .filter(Boolean);

      const { error } = await supabase.from("brand_campaigns").insert({
        brand_id: user!.id,
        title: form.title,
        description: form.description || null,
        budget: parseFloat(form.budget),
        target_genres: genres.length ? genres : null,
        status: "draft",
      });

      if (error) throw error;
      toast.success("Campaign created!");
      setDialogOpen(false);
      setForm({ title: "", description: "", budget: "", target_genres: "" });
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  const activateCampaign = async (id: string) => {
    await supabase.from("brand_campaigns").update({ status: "active", start_date: new Date().toISOString() }).eq("id", id);
    toast.success("Campaign activated!");
    fetchCampaigns();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "default";
      case "completed": return "secondary";
      case "draft": return "outline";
      default: return "outline" as const;
    }
  };

  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ROI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <div className="text-xs text-muted-foreground">Total Campaigns</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <div className="text-2xl font-bold">{totalBudget.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Total Budget (BAK)</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto mb-1 text-secondary" />
            <div className="text-2xl font-bold">{totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%</div>
            <div className="text-xs text-muted-foreground">Budget Used</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Campaigns
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Campaign title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
                <Input
                  type="number"
                  placeholder="Budget (BAKCoins)"
                  value={form.budget}
                  onChange={e => setForm({ ...form, budget: e.target.value })}
                />
                <Input
                  placeholder="Target genres (comma-separated)"
                  value={form.target_genres}
                  onChange={e => setForm({ ...form, target_genres: e.target.value })}
                />
                <Button onClick={createCampaign} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No campaigns yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{c.title}</h4>
                      <Badge variant={statusColor(c.status) as any}>{c.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Budget: {c.budget} BAK • Spent: {c.spent} BAK
                      {c.target_genres?.length ? ` • Genres: ${c.target_genres.join(", ")}` : ""}
                    </p>
                  </div>
                  {c.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => activateCampaign(c.id)}>
                      Activate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
