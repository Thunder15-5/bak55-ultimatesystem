import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Music2, 
  Upload, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Play,
  DollarSign,
  TrendingUp,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface Beat {
  id: string;
  title: string;
  genre: string;
  bpm: number | null;
  key: string | null;
  plays: number;
  likes: number;
  total_leases_sold: number;
  price_lease_bak: number;
  price_exclusive_bak: number;
  status: string;
  moderation_status: string;
  is_sold_exclusive: boolean;
  created_at: string;
}

export default function ProducerCatalog() {
  const { user } = useAuth();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [beatToDelete, setBeatToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBeats();
    }
  }, [user]);

  const fetchBeats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBeats(data || []);
    } catch (error) {
      console.error('Error fetching beats:', error);
      toast.error('Failed to load beats');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!beatToDelete) return;

    try {
      const { error } = await supabase
        .from('beats')
        .delete()
        .eq('id', beatToDelete)
        .eq('producer_id', user?.id);

      if (error) throw error;

      setBeats(beats.filter(b => b.id !== beatToDelete));
      toast.success('Beat deleted successfully');
    } catch (error) {
      console.error('Error deleting beat:', error);
      toast.error('Failed to delete beat');
    } finally {
      setDeleteDialogOpen(false);
      setBeatToDelete(null);
    }
  };

  const getStatusBadge = (status: string, modStatus: string, isExclusive: boolean) => {
    if (isExclusive) {
      return <Badge variant="outline" className="border-red-500 text-red-500">Sold Exclusive</Badge>;
    }
    if (modStatus === 'pending') {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending Review</Badge>;
    }
    if (modStatus === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (status === 'active') {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
    if (status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const filteredBeats = beats.filter(beat =>
    beat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    beat.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEarnings = beats.reduce((acc, b) => acc + (b.total_leases_sold * b.price_lease_bak), 0);
  const totalPlays = beats.reduce((acc, b) => acc + b.plays, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold">
              My <span className="text-gradient">Beat Catalog</span>
            </h1>
            <p className="text-muted-foreground">
              Manage and track your uploaded beats
            </p>
          </div>
          <Link to="/producer/upload">
            <Button variant="hero" className="gap-2">
              <Upload className="w-4 h-4" /> Upload New Beat
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Music2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{beats.length}</p>
                  <p className="text-xs text-muted-foreground">Total Beats</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalEarnings.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Est. Earnings (BAK)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Play className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPlays.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Plays</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {beats.reduce((acc, b) => acc + b.total_leases_sold, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Licenses Sold</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search your beats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Beats Table */}
        <Card className="border-primary/20">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : filteredBeats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead className="text-center">BPM / Key</TableHead>
                    <TableHead className="text-center">Plays</TableHead>
                    <TableHead className="text-center">Sales</TableHead>
                    <TableHead className="text-right">Price (BAK)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBeats.map((beat) => (
                    <TableRow key={beat.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{beat.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(beat.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{beat.genre || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">
                          {beat.bpm || '-'} / {beat.key || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{beat.plays}</TableCell>
                      <TableCell className="text-center">{beat.total_leases_sold}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{beat.price_lease_bak}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(beat.status, beat.moderation_status, beat.is_sold_exclusive)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/beat/${beat.id}`}>
                                <Eye className="w-4 h-4 mr-2" /> View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/producer/edit-beat/${beat.id}`}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setBeatToDelete(beat.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-16">
                <Music2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No beats yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first beat to start selling
                </p>
                <Link to="/producer/upload">
                  <Button variant="hero">
                    <Upload className="w-4 h-4 mr-2" /> Upload Beat
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Beat?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The beat will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer />
    </div>
  );
}
