import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Trophy, PlayCircle, FastForward, Edit, BarChart3, Loader2, AlertCircle } from "lucide-react";
import { StageNavigator } from "@/components/competition/StageNavigator";

interface Competition {
  id: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface Stage {
  id: string;
  stage_number: number;
  stage_name: string;
  status: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  elimination_count: number;
}

export function CompetitionStageManager() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressing, setProgressing] = useState<string | null>(null);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    if (selectedCompetition) {
      fetchStages(selectedCompetition);
    }
  }, [selectedCompetition]);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, title, status, start_date, end_date')
        .in('status', ['active', 'draft'])
        .order('start_date', { ascending: false });

      if (error) throw error;
      setCompetitions(data || []);
      if (data && data.length > 0) {
        setSelectedCompetition(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
      toast.error('Failed to load competitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async (competitionId: string) => {
    try {
      const { data, error } = await supabase
        .from('competition_stages')
        .select('*')
        .eq('competition_id', competitionId)
        .order('stage_number', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
      toast.error('Failed to load stages');
    }
  };

  const handleProgressStage = async (stageId: string) => {
    setProgressing(stageId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('progress-competition-stage', {
        body: { stageId },
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      });

      if (error) throw error;

      toast.success(`Stage progressed! ${data.advancing_count} advanced, ${data.eliminated_count} eliminated`);
      fetchStages(selectedCompetition!);
    } catch (error: any) {
      toast.error(error.message || 'Failed to progress stage');
    } finally {
      setProgressing(null);
    }
  };

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'upcoming':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No active competitions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Stage Management</h3>
          <p className="text-muted-foreground">Manage competition stages and progression</p>
        </div>
      </div>

      <Accordion type="single" collapsible value={selectedCompetition || undefined} onValueChange={setSelectedCompetition}>
        {competitions.map((competition) => (
          <AccordionItem key={competition.id} value={competition.id}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <Trophy className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">{competition.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(competition.start_date).toLocaleDateString()} - {new Date(competition.end_date).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={competition.status === 'active' ? 'default' : 'secondary'}>
                  {competition.status}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pt-4">
                {/* Stage Timeline View */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Stage Timeline</CardTitle>
                    <CardDescription>Visual overview of all competition stages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StageNavigator competitionId={competition.id} />
                  </CardContent>
                </Card>

                {/* Stage Management Cards */}
                <div className="grid gap-4">
                  {stages.map((stage) => (
                    <Card key={stage.id} className={stage.status === 'active' ? 'ring-2 ring-primary' : ''}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                              {stage.stage_number}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{stage.stage_name}</CardTitle>
                              <CardDescription>
                                {new Date(stage.start_date).toLocaleDateString()} - {new Date(stage.end_date).toLocaleDateString()}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant={getStageStatusColor(stage.status)}>
                            {stage.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Max Participants</div>
                              <div className="font-semibold">{stage.max_participants || 'Unlimited'}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Elimination Count</div>
                              <div className="font-semibold">{stage.elimination_count || 'None'}</div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {stage.status === 'active' && (
                              <Button
                                onClick={() => handleProgressStage(stage.id)}
                                disabled={progressing === stage.id}
                                size="sm"
                              >
                                {progressing === stage.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <FastForward className="mr-2 h-4 w-4" />
                                    Progress Stage
                                  </>
                                )}
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Analytics
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
