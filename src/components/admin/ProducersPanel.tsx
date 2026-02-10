import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Music2, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Search, 
  ShieldCheck, 
  ShieldX,
  Eye,
  Star,
  DollarSign,
  Users
} from "lucide-react";

interface Producer {
  id: string;
  user_id: string;
  producer_name: string;
  verified: boolean;
  genres: string[];
  producer_tier: string;
  total_earnings: number;
  total_beats_sold: number;
  total_licenses_issued: number;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  profiles?: {
    username: string;
    email: string;
    avatar_url: string;
  };
}

interface Beat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  producer_id: string;
  moderation_status: string;
  status: string;
  plays: number;
  likes: number;
  created_at: string;
  producer_profiles?: {
    producer_name: string;
  };
  profiles?: {
    username: string;
    email: string;
  };
}

export function ProducersPanel() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [pendingBeats, setPendingBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [metrics, setMetrics] = useState({
    totalProducers: 0,
    verifiedProducers: 0,
    totalBeats: 0,
    pendingBeats: 0,
    totalLicenses: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProducers(),
      fetchBeats(),
      fetchPendingBeats(),
      fetchMetrics()
    ]);
    setLoading(false);
  };

  const fetchProducers = async () => {
    try {
      const { data, error } = await supabase
        .from("producer_profiles")
        .select(`
          *
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately for each producer
      const producersWithProfiles = await Promise.all(
        (data || []).map(async (producer) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, email, avatar_url")
            .eq("id", producer.user_id)
            .single();
          
          return { ...producer, profiles: profile };
        })
      );
      
      setProducers(producersWithProfiles as Producer[]);
    } catch (error: any) {
      console.error("Failed to load producers:", error);
    }
  };

  const fetchBeats = async () => {
    try {
      const { data, error } = await supabase
        .from("beats")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Fetch related data separately
      const beatsWithData = await Promise.all(
        (data || []).map(async (beat) => {
          const [profileRes, producerRes] = await Promise.all([
            supabase.from("profiles").select("username, email").eq("id", beat.producer_id).single(),
            supabase.from("producer_profiles").select("producer_name").eq("user_id", beat.producer_id).single()
          ]);
          
          return {
            ...beat,
            profiles: profileRes.data,
            producer_profiles: producerRes.data
          };
        })
      );
      
      setBeats(beatsWithData as Beat[]);
    } catch (error: any) {
      console.error("Failed to load beats:", error);
    }
  };

  const fetchPendingBeats = async () => {
    try {
      const { data, error } = await supabase
        .from("beats")
        .select("*")
        .eq("moderation_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch related data separately
      const beatsWithData = await Promise.all(
        (data || []).map(async (beat) => {
          const [profileRes, producerRes] = await Promise.all([
            supabase.from("profiles").select("username, email").eq("id", beat.producer_id).single(),
            supabase.from("producer_profiles").select("producer_name").eq("user_id", beat.producer_id).single()
          ]);
          
          return {
            ...beat,
            profiles: profileRes.data,
            producer_profiles: producerRes.data
          };
        })
      );
      
      setPendingBeats(beatsWithData as Beat[]);
    } catch (error: any) {
      console.error("Failed to load pending beats:", error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const [producersData, verifiedData, beatsData, pendingData, licensesData] = await Promise.all([
        supabase.from("producer_profiles").select("*", { count: "exact", head: true }),
        supabase.from("producer_profiles").select("*", { count: "exact", head: true }).eq("verified", true),
        supabase.from("beats").select("*", { count: "exact", head: true }),
        supabase.from("beats").select("*", { count: "exact", head: true }).eq("moderation_status", "pending"),
        supabase.from("beat_licenses").select("producer_earnings")
      ]);

      const totalEarnings = licensesData.data?.reduce((sum, l) => sum + (l.producer_earnings || 0), 0) || 0;

      setMetrics({
        totalProducers: producersData.count || 0,
        verifiedProducers: verifiedData.count || 0,
        totalBeats: beatsData.count || 0,
        pendingBeats: pendingData.count || 0,
        totalLicenses: licensesData.data?.length || 0,
        totalEarnings
      });
    } catch (error: any) {
      console.error("Failed to load metrics:", error);
    }
  };

  const handleVerifyProducer = async (producerId: string, currentStatus: boolean) => {
    setProcessing(producerId);
    try {
      const { error } = await supabase
        .from("producer_profiles")
        .update({ verified: !currentStatus })
        .eq("id", producerId);

      if (error) throw error;

      toast.success(currentStatus ? "Producer unverified" : "Producer verified successfully");
      fetchProducers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update producer");
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveBeat = async (beatId: string) => {
    setProcessing(beatId);
    try {
      const { error } = await supabase
        .from("beats")
        .update({ 
          moderation_status: "approved",
          status: "active"
        })
        .eq("id", beatId);

      if (error) throw error;

      toast.success("Beat approved and published");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve beat");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectBeat = async (beatId: string) => {
    setProcessing(beatId);
    try {
      const { error } = await supabase
        .from("beats")
        .update({ 
          moderation_status: "rejected",
          status: "archived"
        })
        .eq("id", beatId);

      if (error) throw error;

      toast.success("Beat rejected");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject beat");
    } finally {
      setProcessing(null);
    }
  };

  const filteredProducers = producers.filter(
    (p) =>
      p.producer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Producers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducers}</div>
            <p className="text-xs text-muted-foreground">{metrics.verifiedProducers} verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beats</CardTitle>
            <Music2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBeats}</div>
            <p className="text-xs text-muted-foreground">In catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingBeats}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licenses Sold</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLicenses}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Producer Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEarnings.toFixed(0)} BAK</div>
            <p className="text-xs text-muted-foreground">Total paid to producers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="producers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="producers">
            <Users className="h-4 w-4 mr-2" />
            All Producers
          </TabsTrigger>
          <TabsTrigger value="pending-beats">
            <Eye className="h-4 w-4 mr-2" />
            Pending Beats
            {pendingBeats.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingBeats.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all-beats">
            <Music2 className="h-4 w-4 mr-2" />
            All Beats
          </TabsTrigger>
        </TabsList>

        {/* Producers Tab */}
        <TabsContent value="producers">
          <Card>
            <CardHeader>
              <CardTitle>Producer Management</CardTitle>
              <CardDescription>View and manage all producers on the platform</CardDescription>
              <div className="flex items-center gap-2 mt-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search producers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Beats Sold</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducers.map((producer) => (
                      <TableRow key={producer.id}>
                        <TableCell className="font-medium">
                          {producer.producer_name || producer.profiles?.username}
                        </TableCell>
                        <TableCell>{producer.profiles?.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {producer.producer_tier || "starter"}
                          </Badge>
                        </TableCell>
                        <TableCell>{producer.total_beats_sold || 0}</TableCell>
                        <TableCell>{(producer.total_earnings || 0).toFixed(0)} BAK</TableCell>
                        <TableCell>
                          {producer.average_rating ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-primary text-primary" />
                              {producer.average_rating.toFixed(1)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {producer.verified ? (
                            <Badge className="bg-primary">Verified</Badge>
                          ) : (
                            <Badge variant="secondary">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={producer.verified ? "destructive" : "default"}
                            onClick={() => handleVerifyProducer(producer.id, !!producer.verified)}
                            disabled={processing === producer.id}
                          >
                            {processing === producer.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : producer.verified ? (
                              <>
                                <ShieldX className="h-4 w-4 mr-1" />
                                Unverify
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 mr-1" />
                                Verify
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredProducers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No producers found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Beats Tab */}
        <TabsContent value="pending-beats">
          <Card>
            <CardHeader>
              <CardTitle>Beat Moderation</CardTitle>
              <CardDescription>Review and approve pending beat submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingBeats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending beats to review</p>
              ) : (
                <div className="space-y-4">
                  {pendingBeats.map((beat) => (
                    <Card key={beat.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{beat.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              by {beat.producer_profiles?.producer_name || beat.profiles?.username}
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {beat.genre && <Badge variant="outline">{beat.genre}</Badge>}
                              {beat.bpm && <Badge variant="outline">{beat.bpm} BPM</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Submitted: {new Date(beat.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveBeat(beat.id)}
                              disabled={processing === beat.id}
                            >
                              {processing === beat.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectBeat(beat.id)}
                              disabled={processing === beat.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Beats Tab */}
        <TabsContent value="all-beats">
          <Card>
            <CardHeader>
              <CardTitle>All Beats</CardTitle>
              <CardDescription>View all beats in the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Producer</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>BPM</TableHead>
                      <TableHead>Plays</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beats.map((beat) => (
                      <TableRow key={beat.id}>
                        <TableCell className="font-medium">{beat.title}</TableCell>
                        <TableCell>{beat.producer_profiles?.producer_name || beat.profiles?.username}</TableCell>
                        <TableCell>{beat.genre || "-"}</TableCell>
                        <TableCell>{beat.bpm || "-"}</TableCell>
                        <TableCell>{beat.plays || 0}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              beat.moderation_status === "approved"
                                ? "default"
                                : beat.moderation_status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {beat.moderation_status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(beat.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {beats.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No beats found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
