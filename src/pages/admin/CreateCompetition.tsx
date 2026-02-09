import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Plus, Trash2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";

interface Stage {
  stage_number: number;
  stage_name: string;
  stage_type: string;
  description: string;
  challenge_theme?: string;
  start_date: string;
  end_date: string;
  voting_start_date: string;
  voting_end_date: string;
  max_participants: number;
  elimination_count: number;
}

const STAGE_TEMPLATES = {
  bak55_discovery: {
    name: "BAK55 Discovery (3 Stages)",
    stages: [
      { stage_name: "Auditions", stage_type: "audition", max_participants: 50, elimination_count: 25 },
      { stage_name: "Semifinals", stage_type: "performance", max_participants: 25, elimination_count: 15 },
      { stage_name: "Finals", stage_type: "finale", max_participants: 10, elimination_count: 7 }
    ]
  },
  classic: {
    name: "Classic Competition (2 Stages)",
    stages: [
      { stage_name: "Qualifiers", stage_type: "submission", max_participants: 100, elimination_count: 50 },
      { stage_name: "Finals", stage_type: "finale", max_participants: 50, elimination_count: 47 }
    ]
  },
  monthly_mini: {
    name: "Monthly Mini (1 Stage)",
    stages: [
      { stage_name: "Main Round", stage_type: "submission", max_participants: 30, elimination_count: 27 }
    ]
  }
};

export default function CreateCompetition() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [multiStageEnabled, setMultiStageEnabled] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prize_amount: "",
    entry_fee: "0",
    max_submissions: "",
    genres: "",
    start_date: "",
    end_date: "",
    voting_start_date: "",
    voting_end_date: "",
  });

  const [stages, setStages] = useState<Stage[]>([{
    stage_number: 1,
    stage_name: "Main Stage",
    stage_type: "submission",
    description: "",
    challenge_theme: "",
    start_date: "",
    end_date: "",
    voting_start_date: "",
    voting_end_date: "",
    max_participants: 50,
    elimination_count: 0
  }]);

  const [coverImage, setCoverImage] = useState<File | null>(null);

  const applyTemplate = (templateKey: string) => {
    if (templateKey === "custom") return;
    
    const template = STAGE_TEMPLATES[templateKey as keyof typeof STAGE_TEMPLATES];
    const baseDate = new Date();
    
    const newStages: Stage[] = template.stages.map((stage, index) => {
      const stageStart = new Date(baseDate);
      stageStart.setDate(stageStart.getDate() + (index * 14)); // 2 weeks per stage
      
      const stageEnd = new Date(stageStart);
      stageEnd.setDate(stageEnd.getDate() + 10);
      
      const votingStart = new Date(stageEnd);
      votingStart.setDate(votingStart.getDate() - 3);
      
      return {
        stage_number: index + 1,
        stage_name: stage.stage_name,
        stage_type: stage.stage_type,
        description: "",
        challenge_theme: "",
        start_date: stageStart.toISOString().split('T')[0],
        end_date: stageEnd.toISOString().split('T')[0],
        voting_start_date: votingStart.toISOString().split('T')[0],
        voting_end_date: stageEnd.toISOString().split('T')[0],
        max_participants: stage.max_participants,
        elimination_count: stage.elimination_count
      };
    });
    
    setStages(newStages);
  };

  const addStage = () => {
    const lastStage = stages[stages.length - 1];
    const newStageStart = lastStage.end_date ? new Date(lastStage.end_date) : new Date();
    newStageStart.setDate(newStageStart.getDate() + 1);
    
    setStages([...stages, {
      stage_number: stages.length + 1,
      stage_name: `Stage ${stages.length + 1}`,
      stage_type: "submission",
      description: "",
      challenge_theme: "",
      start_date: newStageStart.toISOString().split('T')[0],
      end_date: "",
      voting_start_date: "",
      voting_end_date: "",
      max_participants: lastStage.max_participants - lastStage.elimination_count,
      elimination_count: 0
    }]);
  };

  const removeStage = (index: number) => {
    if (stages.length === 1) {
      toast({
        title: "Error",
        description: "Competition must have at least one stage",
        variant: "destructive",
      });
      return;
    }
    setStages(stages.filter((_, i) => i !== index));
  };

  const updateStage = (index: number, field: keyof Stage, value: any) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const validateStages = () => {
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      
      if (new Date(stage.start_date) >= new Date(stage.end_date)) {
        toast({
          title: "Validation Error",
          description: `Stage ${i + 1}: Start date must be before end date`,
          variant: "destructive",
        });
        return false;
      }
      
      if (new Date(stage.voting_start_date) >= new Date(stage.voting_end_date)) {
        toast({
          title: "Validation Error",
          description: `Stage ${i + 1}: Voting start must be before voting end`,
          variant: "destructive",
        });
        return false;
      }
      
      if (stage.elimination_count >= stage.max_participants) {
        toast({
          title: "Validation Error",
          description: `Stage ${i + 1}: Elimination count must be less than max participants`,
          variant: "destructive",
        });
        return false;
      }
      
      if (i > 0) {
        const prevStage = stages[i - 1];
        if (new Date(stage.start_date) <= new Date(prevStage.end_date)) {
          toast({
            title: "Validation Error",
            description: `Stage ${i + 1} start date must be after Stage ${i} end date`,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (multiStageEnabled && !validateStages()) {
      return;
    }

    setLoading(true);
    try {
      let coverImageUrl = null;

      // Upload cover image if provided
      if (coverImage) {
        const fileExt = coverImage.name.split(".").pop()?.toLowerCase() || "png";
        const safeExt = fileExt.replace(/[^a-z0-9]/g, "") || "png";
        const randomPart =
          (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) +
          "-" +
          Date.now().toString(36);

        // Storage policy requires first path segment to be the user's id (folder)
        const filePath = `${user.id}/${randomPart}.${safeExt}`;

        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(filePath, coverImage, { upsert: false });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("covers").getPublicUrl(filePath);

        coverImageUrl = publicUrl;
      }

      // Prepare competition data
      const competitionData = {
        title: formData.title,
        description: formData.description || null,
        prize_amount: parseFloat(formData.prize_amount),
        entry_fee: parseFloat(formData.entry_fee) || 0,
        max_submissions: formData.max_submissions ? parseInt(formData.max_submissions) : null,
        genres: formData.genres ? formData.genres.split(',').map(g => g.trim()).filter(Boolean) : null,
        start_date: multiStageEnabled ? stages[0].start_date : formData.start_date,
        end_date: multiStageEnabled ? stages[stages.length - 1].end_date : formData.end_date,
        voting_start_date: multiStageEnabled ? (stages[0].voting_start_date || null) : (formData.voting_start_date || null),
        voting_end_date: multiStageEnabled ? (stages[stages.length - 1].voting_end_date || null) : (formData.voting_end_date || null),
        cover_image: coverImageUrl,
        created_by: user.id,
        status: 'active' as const
      };

      // Insert competition
      const { data: competition, error: compError } = await supabase
        .from('competitions')
        .insert([competitionData])
        .select()
        .single();

      if (compError) throw compError;

      // Insert stages if multi-stage enabled
      if (multiStageEnabled) {
        const stageInserts = stages.map(stage => ({
          competition_id: competition.id,
          stage_number: stage.stage_number,
          stage_name: stage.stage_name,
          stage_type: stage.stage_type,
          description: stage.description,
          challenge_theme: stage.challenge_theme || null,
          start_date: stage.start_date,
          end_date: stage.end_date,
          voting_start_date: stage.voting_start_date,
          voting_end_date: stage.voting_end_date,
          max_participants: stage.max_participants,
          elimination_count: stage.elimination_count,
          status: stage.stage_number === 1 ? 'active' : 'upcoming'
        }));

        const { error: stagesError } = await supabase
          .from('competition_stages')
          .insert(stageInserts);

        if (stagesError) throw stagesError;
      }

      toast({
        title: "Competition created!",
        description: multiStageEnabled 
          ? `Competition with ${stages.length} stages created successfully`
          : "Your competition is now live.",
      });

      navigate('/competitions/active');
    } catch (error: any) {
      console.error('Error creating competition:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create competition",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle>Create Competition</CardTitle>
            </div>
            <CardDescription>Set up a new music competition for artists</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Multi-Stage Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="multi-stage" className="text-base font-semibold">
                    Multi-Stage Competition
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable multiple elimination rounds with progressive stages
                  </p>
                </div>
                <Switch
                  id="multi-stage"
                  checked={multiStageEnabled}
                  onCheckedChange={(checked) => {
                    setMultiStageEnabled(checked);
                    if (!checked) {
                      setStages([stages[0]]);
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Competition Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Best Afrobeat Track 2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the competition rules and requirements..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prize_amount">Prize Amount (BAKCoins)</Label>
                  <Input
                    id="prize_amount"
                    type="number"
                    value={formData.prize_amount}
                    onChange={(e) => setFormData({ ...formData, prize_amount: e.target.value })}
                    placeholder="10000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry_fee">Entry Fee (BAKCoins)</Label>
                  <Input
                    id="entry_fee"
                    type="number"
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_submissions">Max Submissions (optional)</Label>
                  <Input
                    id="max_submissions"
                    type="number"
                    value={formData.max_submissions}
                    onChange={(e) => setFormData({ ...formData, max_submissions: e.target.value })}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genres">Genres (comma-separated)</Label>
                  <Input
                    id="genres"
                    value={formData.genres}
                    onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                    placeholder="Afrobeat, Hip Hop, Reggae"
                  />
                </div>
              </div>

              {/* Single Stage Dates - Only show if multi-stage disabled */}
              {!multiStageEnabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Submission Start Date</Label>
                      <Input
                        id="start_date"
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date">Submission End Date</Label>
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
                </>
              )}

              {/* Multi-Stage Builder */}
              {multiStageEnabled && (
                <div className="space-y-4">
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Competition Stages</h3>
                    <div className="flex gap-2">
                      <Select value={selectedTemplate} onValueChange={(value) => {
                        setSelectedTemplate(value);
                        applyTemplate(value);
                      }}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Choose template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          {Object.entries(STAGE_TEMPLATES).map(([key, template]) => (
                            <SelectItem key={key} value={key}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={addStage} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Stage
                      </Button>
                    </div>
                  </div>

                  {stages.map((stage, index) => (
                    <Card key={index} className="p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Stage {stage.stage_number}</h4>
                        {stages.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Stage Name</Label>
                          <Input
                            value={stage.stage_name}
                            onChange={(e) => updateStage(index, 'stage_name', e.target.value)}
                            placeholder="e.g., Auditions"
                            required
                          />
                        </div>

                        <div>
                          <Label>Stage Type</Label>
                          <Select
                            value={stage.stage_type}
                            onValueChange={(value) => updateStage(index, 'stage_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="audition">Audition</SelectItem>
                              <SelectItem value="submission">Submission</SelectItem>
                              <SelectItem value="performance">Performance</SelectItem>
                              <SelectItem value="finale">Finale</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={stage.start_date}
                            onChange={(e) => updateStage(index, 'start_date', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={stage.end_date}
                            onChange={(e) => updateStage(index, 'end_date', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <Label>Voting Start</Label>
                          <Input
                            type="date"
                            value={stage.voting_start_date}
                            onChange={(e) => updateStage(index, 'voting_start_date', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <Label>Voting End</Label>
                          <Input
                            type="date"
                            value={stage.voting_end_date}
                            onChange={(e) => updateStage(index, 'voting_end_date', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <Label>Max Participants</Label>
                          <Input
                            type="number"
                            value={stage.max_participants}
                            onChange={(e) => updateStage(index, 'max_participants', parseInt(e.target.value))}
                            min="1"
                            required
                          />
                        </div>

                        <div>
                          <Label>Elimination Count</Label>
                          <Input
                            type="number"
                            value={stage.elimination_count}
                            onChange={(e) => updateStage(index, 'elimination_count', parseInt(e.target.value))}
                            min="0"
                            max={stage.max_participants - 1}
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Challenge Theme (Optional)</Label>
                          <Input
                            value={stage.challenge_theme}
                            onChange={(e) => updateStage(index, 'challenge_theme', e.target.value)}
                            placeholder="e.g., Best Love Song"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Stage Description</Label>
                          <Textarea
                            value={stage.description}
                            onChange={(e) => updateStage(index, 'description', e.target.value)}
                            placeholder="Describe this stage's requirements..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cover_image">Cover Image</Label>
                <Input
                  id="cover_image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Competition"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
