import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Music2, 
  Play, 
  Heart, 
  ShoppingCart,
  Filter,
  TrendingUp,
  Star
} from "lucide-react";
import { toast } from "sonner";

interface Beat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: string;
  mood: string[];
  plays: number;
  likes: number;
  price_lease_bak: number;
  price_exclusive_bak: number;
  cover_image: string | null;
  producer_id: string;
  profiles: { username: string; display_name: string; avatar_url: string };
  producer_profiles: { producer_name: string; verified: boolean };
}

export default function ProducerDiscover() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchBeats();
  }, [genreFilter, sortBy]);

  const fetchBeats = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('beats')
        .select(`
          *,
          profiles!beats_producer_id_fkey(username, display_name, avatar_url),
          producer_profiles!inner(producer_name, verified)
        `)
        .eq('moderation_status', 'approved')
        .eq('status', 'active');

      if (genreFilter !== 'all') {
        query = query.eq('genre', genreFilter);
      }

      switch (sortBy) {
        case 'popular':
          query = query.order('plays', { ascending: false });
          break;
        case 'price_low':
          query = query.order('price_lease_bak', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price_lease_bak', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setBeats(data as any || []);
    } catch (error) {
      console.error('Error fetching beats:', error);
      toast.error('Failed to load beats');
    } finally {
      setLoading(false);
    }
  };

  const filteredBeats = beats.filter(beat =>
    beat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    beat.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const genres = ['Afrobeats', 'Hip Hop', 'R&B', 'Trap', 'Dancehall', 'Amapiano', 'Gospel', 'Pop', 'Gengetone'];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            Discover <span className="text-gradient">Beats</span>
          </h1>
          <p className="text-muted-foreground">
            Browse beats from top producers and find your next hit
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search beats by title or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <TrendingUp className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Beats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : filteredBeats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBeats.map((beat) => (
              <Card key={beat.id} className="group overflow-hidden border-primary/20 hover:border-primary/40 transition-all">
                <div className="relative aspect-square bg-muted">
                  {beat.cover_image ? (
                    <img 
                      src={beat.cover_image} 
                      alt={beat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="hero" size="sm" className="gap-2">
                      <Play className="w-4 h-4" /> Preview
                    </Button>
                  </div>
                  {beat.producer_profiles?.verified && (
                    <Badge className="absolute top-2 right-2 bg-primary/90">
                      <Star className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <Link to={`/beat/${beat.id}`}>
                    <h3 className="font-semibold hover:text-primary transition-colors truncate">
                      {beat.title}
                    </h3>
                  </Link>
                  <Link to={`/producer/${beat.producer_id}`}>
                    <p className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {beat.producer_profiles?.producer_name || beat.profiles?.username}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{beat.genre}</Badge>
                    {beat.bpm && <span>{beat.bpm} BPM</span>}
                    {beat.key && <span>{beat.key}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3" /> {beat.plays}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {beat.likes}
                      </span>
                    </div>
                    <p className="font-bold text-primary">
                      {beat.price_lease_bak} BAK
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Music2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No beats found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
