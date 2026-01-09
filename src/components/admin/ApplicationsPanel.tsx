import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Loader2, User, Music, MapPin, Phone, Mail, ExternalLink } from "lucide-react";

interface Application {
  id: string;
  user_id: string;
  full_name: string;
  stage_name: string;
  email: string;
  phone_number: string;
  city: string;
  age: number;
  primary_genres: string[];
  why_join: string;
  what_makes_unique: string;
  years_experience: number | null;
  demo_track_url: string | null;
  portfolio_link: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  status: string;
  created_at: string;
  review_notes: string | null;
}

export function ApplicationsPanel() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("artist_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast.error("Failed to load applications");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (applicationId: string, action: "approved" | "rejected") => {
    setProcessing(applicationId);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const application = applications.find(a => a.id === applicationId);

      const { error } = await supabase
        .from("artist_applications")
        .update({
          status: action,
          review_notes: notes[applicationId] || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: userData.user?.id,
        })
        .eq("id", applicationId);

      if (error) throw error;

      // If approved, upgrade user to artist role
      if (action === "approved" && application) {
        // Add artist role
        await supabase.from("user_roles").insert({
          user_id: application.user_id,
          role: "artist",
        });

        // Create artist profile
        await supabase.from("artist_profiles").insert({
          user_id: application.user_id,
          stage_name: application.stage_name,
          genres: application.primary_genres,
        });

        // Send notification
        await supabase.from("notifications").insert({
          user_id: application.user_id,
          title: "Application Approved! 🎉",
          message: "Congratulations! Your artist application has been approved. You can now upload music and enter competitions.",
          type: "success",
          link: "/upload",
        });
      } else if (action === "rejected" && application) {
        // Send rejection notification
        await supabase.from("notifications").insert({
          user_id: application.user_id,
          title: "Application Update",
          message: notes[applicationId] || "Your application was not approved at this time. You can apply again later.",
          type: "info",
        });
      }

      // Log activity
      await supabase.from('admin_activity_log').insert({
        user_id: userData.user?.id,
        event_type: `application_${action}`,
        event_category: 'user',
        description: `${action === 'approved' ? 'Approved' : 'Rejected'} artist application from ${application?.stage_name}`,
        metadata: { 
          application_id: applicationId,
          applicant_id: application?.user_id,
          notes: notes[applicationId] || null 
        }
      });

      toast.success(`Application ${action}`);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || "Failed to process application");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const pendingApplications = applications.filter(a => a.status === "pending");
  const reviewedApplications = applications.filter(a => a.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Pending Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Pending Applications
            {pendingApplications.length > 0 && (
              <Badge variant="destructive">{pendingApplications.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Review artist applications</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingApplications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pending applications
            </p>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((app) => (
                <Card key={app.id} className="border-2">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{app.stage_name}</h3>
                        <p className="text-sm text-muted-foreground">{app.full_name}</p>
                      </div>
                      <Badge variant="secondary">{app.status}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {app.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {app.phone_number}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {app.city}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Age: {app.age} • Experience: {app.years_experience || 0} years
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {app.primary_genres.map((genre) => (
                        <Badge key={genre} variant="outline">{genre}</Badge>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Why they want to join:</p>
                      <p className="text-sm text-muted-foreground">{app.why_join}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">What makes them unique:</p>
                      <p className="text-sm text-muted-foreground">{app.what_makes_unique}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {app.demo_track_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={app.demo_track_url} target="_blank" rel="noopener noreferrer">
                            <Music className="h-4 w-4 mr-2" />
                            Demo Track
                          </a>
                        </Button>
                      )}
                      {app.portfolio_link && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={app.portfolio_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Portfolio
                          </a>
                        </Button>
                      )}
                      {app.instagram && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`https://instagram.com/${app.instagram}`} target="_blank" rel="noopener noreferrer">
                            Instagram
                          </a>
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add review notes (visible to applicant if rejected)..."
                        value={notes[app.id] || ""}
                        onChange={(e) => setNotes({ ...notes, [app.id]: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReview(app.id, "approved")}
                        disabled={processing === app.id}
                        className="flex-1"
                      >
                        {processing === app.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReview(app.id, "rejected")}
                        disabled={processing === app.id}
                        className="flex-1"
                      >
                        {processing === app.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      {reviewedApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviewedApplications.slice(0, 10).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{app.stage_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={app.status === "approved" ? "default" : "destructive"}>
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
