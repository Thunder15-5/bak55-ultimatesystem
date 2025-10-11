import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function EditCompetition() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prize_amount: "",
    entry_fee: "",
    max_submissions: "",
    genres: "",
    start_date: "",
    end_date: "",
    voting_start_date: "",
    voting_end_date: "",
  });

  useEffect(() => {
    fetchCompetition();
  }, [id]);

  const fetchCompetition = async () => {
    try {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title,
          description: data.description || "",
          prize_amount: data.prize_amount.toString(),
          entry_fee: data.entry_fee?.toString() || "0",
          max_submissions: data.max_submissions?.toString() || "",
          genres: data.genres?.join(", ") || "",
          start_date: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : "",
          end_date: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : "",
          voting_start_date: data.voting_start_date ? new Date(data.voting_start_date).toISOString().slice(0, 16) : "",
          voting_end_date: data.voting_end_date ? new Date(data.voting_end_date).toISOString().slice(0, 16) : "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching competition:", error);
      toast.error("Failed to load competition");
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const genresArray = formData.genres
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g);

      const { error } = await supabase
        .from("competitions")
        .update({
          title: formData.title,
          description: formData.description,
          prize_amount: parseFloat(formData.prize_amount),
          entry_fee: parseFloat(formData.entry_fee || "0"),
          max_submissions: formData.max_submissions ? parseInt(formData.max_submissions) : null,
          genres: genresArray,
          start_date: formData.start_date,
          end_date: formData.end_date,
          voting_start_date: formData.voting_start_date || null,
          voting_end_date: formData.voting_end_date || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Competition updated successfully!");
      navigate("/admin");
    } catch (error: any) {
      console.error("Error updating competition:", error);
      toast.error(error.message || "Failed to update competition");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Competition</CardTitle>
            <CardDescription>Update competition details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Competition Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prize_amount">Prize Amount (BAK) *</Label>
                  <Input
                    id="prize_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prize_amount}
                    onChange={(e) => setFormData({ ...formData, prize_amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry_fee">Entry Fee (BAK)</Label>
                  <Input
                    id="entry_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_submissions">Max Submissions (optional)</Label>
                <Input
                  id="max_submissions"
                  type="number"
                  min="1"
                  value={formData.max_submissions}
                  onChange={(e) => setFormData({ ...formData, max_submissions: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genres">Genres (comma-separated)</Label>
                <Input
                  id="genres"
                  value={formData.genres}
                  onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                  placeholder="e.g., Hip Hop, Afrobeat, R&B"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Submission Start Date *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Submission End Date *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voting_start_date">Voting Start Date</Label>
                  <Input
                    id="voting_start_date"
                    type="datetime-local"
                    value={formData.voting_start_date}
                    onChange={(e) => setFormData({ ...formData, voting_start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voting_end_date">Voting End Date</Label>
                  <Input
                    id="voting_end_date"
                    type="datetime-local"
                    value={formData.voting_end_date}
                    onChange={(e) => setFormData({ ...formData, voting_end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Competition
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}