import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Star, Plus, Loader2, Trash2, Calendar } from "lucide-react";

interface FeaturedArtist {
  id: string;
  artist_id: string;
  reason: string | null;
  featured_from: string;
  featured_until: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    artist_profiles: {
      stage_name: string | null;
      verified: boolean;
    } | null;
  };
}

interface AvailableArtist {
  id: string;
  username: string;
  avatar_url: string | null;
  artist_profiles: {
    stage_name: string | null;
    verified: boolean;
  };
}

export function FeaturedArtistsPanel() {
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([]);
  const [availableArtists, setAvailableArtists] = useState<AvailableArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<string>("");
  const [reason, setReason] = useState("");
  const [featuredUntil, setFeaturedUntil] = useState("");

  useEffect(() => {
    fetchFeaturedArtists();
    fetchAvailableArtists();
  }, []);

  const fetchFeaturedArtists = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_artists')
        .select(`
          id,
          artist_id,
          reason,
          featured_from,
          featured_until,
          profiles:artist_id (
            username,
            avatar_url,
            artist_profiles (
              stage_name,
              verified
            )
          )
        `)
        .order('featured_from', { ascending: false });

      if (error) throw error;
      setFeaturedArtists((data as any) || []);
    } catch (error) {
      console.error('Error fetching featured artists:', error);
      toast.error('Failed to load featured artists');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableArtists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          artist_profiles!inner (
            stage_name,
            verified
          )
        `)
        .limit(50);

      if (error) throw error;
      setAvailableArtists((data as any) || []);
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  };

  const handleFeatureArtist = async () => {
    if (!selectedArtist || !featuredUntil) {
      toast.error('Please select an artist and set a featured until date');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('featured_artists')
        .insert({
          artist_id: selectedArtist,
          reason: reason || null,
          featured_until: featuredUntil,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('Artist featured successfully!');
      setDialogOpen(false);
      setSelectedArtist("");
      setReason("");
      setFeaturedUntil("");
      fetchFeaturedArtists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to feature artist');
    }
  };

  const handleRemoveFeatured = async (id: string) => {
    const confirmed = confirm('Remove this artist from featured?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('featured_artists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Artist removed from featured');
      fetchFeaturedArtists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove featured artist');
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();

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
          <h3 className="text-2xl font-bold">Featured Artists</h3>
          <p className="text-muted-foreground">Manage artists featured on the homepage</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Feature Artist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Feature an Artist</DialogTitle>
              <DialogDescription>Select an artist to feature on the homepage</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Artist</Label>
                <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an artist..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableArtists.map((artist) => (
                      <SelectItem key={artist.id} value={artist.id}>
                        <div className="flex items-center gap-2">
                          <span>{artist.artist_profiles?.stage_name || artist.username}</span>
                          {artist.artist_profiles?.verified && (
                            <Badge variant="default" className="h-4 px-1 text-[10px]">✓</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Rising star, competition winner, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured_until">Featured Until</Label>
                <Input
                  id="featured_until"
                  type="date"
                  value={featuredUntil}
                  onChange={(e) => setFeaturedUntil(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <Button onClick={handleFeatureArtist} className="w-full">
                <Star className="mr-2 h-4 w-4" />
                Feature Artist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {featuredArtists.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No featured artists yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Feature artists to showcase them on the homepage
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredArtists.map((featured) => (
            <Card key={featured.id} className={isExpired(featured.featured_until) ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={featured.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(featured.profiles?.artist_profiles?.stage_name || featured.profiles?.username || 'A').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {featured.profiles?.artist_profiles?.stage_name || featured.profiles?.username}
                        {featured.profiles?.artist_profiles?.verified && (
                          <Badge variant="default" className="h-4 px-1 text-[10px]">✓</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>@{featured.profiles?.username}</CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFeatured(featured.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {featured.reason && (
                    <div className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-primary mt-0.5" />
                      <span className="text-muted-foreground">{featured.reason}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Until {new Date(featured.featured_until).toLocaleDateString()}
                    </span>
                    {isExpired(featured.featured_until) && (
                      <Badge variant="destructive" className="text-xs">Expired</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}