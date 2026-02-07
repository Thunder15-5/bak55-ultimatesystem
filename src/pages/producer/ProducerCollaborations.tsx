import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Music2,
  User,
  Calendar,
  Send
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CollabRequest {
  id: string;
  from_artist_id: string;
  project_type: string;
  description: string;
  budget_min: number;
  budget_max: number;
  deadline: string | null;
  status: string;
  producer_response: string | null;
  quoted_price: number | null;
  created_at: string;
  profiles: { 
    username: string; 
    display_name: string;
    avatar_url: string;
    email: string;
  };
}

export default function ProducerCollaborations() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CollabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CollabRequest | null>(null);
  const [responseDialog, setResponseDialog] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('producer_collaboration_requests')
        .select(`
          *,
          profiles!producer_collaboration_requests_from_artist_id_fkey(
            username, display_name, avatar_url, email
          )
        `)
        .eq('to_producer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as any || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load collaboration requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (status: 'accepted' | 'rejected') => {
    if (!selectedRequest || !user) return;
    setResponding(true);

    try {
      const updateData: any = {
        status,
        producer_response: responseText || null,
        updated_at: new Date().toISOString(),
      };

      if (status === 'accepted' && quotedPrice) {
        updateData.quoted_price = parseInt(quotedPrice);
      }

      const { error } = await supabase
        .from('producer_collaboration_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Send notification to artist
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedRequest.from_artist_id,
          type: status === 'accepted' ? 'collab_accepted' : 'collab_rejected',
          title: status === 'accepted' ? '🎉 Collaboration Accepted!' : 'Collaboration Response',
          message: status === 'accepted' 
            ? `A producer accepted your collaboration request${quotedPrice ? ` with a quote of ${quotedPrice} BAK` : ''}`
            : 'Your collaboration request was declined',
          category: 'producer',
        });

      toast.success(status === 'accepted' ? 'Request accepted!' : 'Request declined');
      setResponseDialog(false);
      setSelectedRequest(null);
      setResponseText("");
      setQuotedPrice("");
      fetchRequests();
    } catch (error) {
      console.error('Error responding:', error);
      toast.error('Failed to respond to request');
    } finally {
      setResponding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Declined</Badge>;
      case 'completed':
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeRequests = requests.filter(r => r.status === 'accepted');
  const pastRequests = requests.filter(r => ['rejected', 'completed'].includes(r.status));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            <span className="text-gradient">Collaborations</span>
          </h1>
          <p className="text-muted-foreground">
            Manage collaboration requests from artists
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{pendingRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="past">History</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                    <p className="text-muted-foreground">
                      When artists want to collaborate, their requests will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={request.profiles?.avatar_url} />
                              <AvatarFallback>
                                {request.profiles?.username?.[0]?.toUpperCase() || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">
                                  {request.profiles?.display_name || request.profiles?.username}
                                </h3>
                                <Badge variant="outline">{request.project_type}</Badge>
                                {getStatusBadge(request.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                @{request.profiles?.username}
                              </p>
                              {request.description && (
                                <p className="text-sm mb-3">{request.description}</p>
                              )}
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  Budget: {request.budget_min} - {request.budget_max} BAK
                                </span>
                                {request.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Deadline: {format(new Date(request.deadline), 'MMM d, yyyy')}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {format(new Date(request.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setResponseDialog(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setResponseDialog(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Accept
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active">
              {activeRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Music2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active collaborations</h3>
                    <p className="text-muted-foreground">
                      Accept collaboration requests to start working with artists
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeRequests.map((request) => (
                    <Card key={request.id} className="border-green-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.profiles?.avatar_url} />
                            <AvatarFallback>
                              {request.profiles?.username?.[0]?.toUpperCase() || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {request.profiles?.display_name || request.profiles?.username}
                              </h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {request.project_type} • Quoted: {request.quoted_price || request.budget_min} BAK
                            </p>
                            <Button variant="outline" size="sm">
                              <Send className="w-4 h-4 mr-1" /> Message Artist
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No history yet</h3>
                    <p className="text-muted-foreground">
                      Past collaborations will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pastRequests.map((request) => (
                    <Card key={request.id} className="opacity-75">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={request.profiles?.avatar_url} />
                              <AvatarFallback>
                                {request.profiles?.username?.[0]?.toUpperCase() || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.profiles?.username}</p>
                              <p className="text-sm text-muted-foreground">{request.project_type}</p>
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Response Dialog */}
      <Dialog open={responseDialog} onOpenChange={setResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Request</DialogTitle>
            <DialogDescription>
              From @{selectedRequest?.profiles?.username} for {selectedRequest?.project_type}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Quote (BAK)</Label>
              <Input
                type="number"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                placeholder={`${selectedRequest?.budget_min} - ${selectedRequest?.budget_max}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Add a message to the artist..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleRespond('rejected')}
              disabled={responding}
            >
              Decline
            </Button>
            <Button
              onClick={() => handleRespond('accepted')}
              disabled={responding}
            >
              {responding ? 'Sending...' : 'Accept & Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
