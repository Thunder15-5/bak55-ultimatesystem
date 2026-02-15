import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Music, User, Headphones, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  type: "track" | "artist" | "beat";
  id: string;
  title: string;
  subtitle: string;
}

export function GlobalSearch() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const prefix = userRole ? `/${userRole}` : "";

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const [tracksRes, artistsRes, beatsRes] = await Promise.all([
        supabase.from("tracks").select("id, title, artist_id").ilike("title", `%${q}%`).limit(5),
        supabase.from("artist_profiles").select("user_id, stage_name").ilike("stage_name", `%${q}%`).limit(5),
        supabase.from("beats").select("id, title, producer_id").eq("status", "active").eq("moderation_status", "approved").ilike("title", `%${q}%`).limit(5),
      ]);

      const combined: SearchResult[] = [
        ...(tracksRes.data?.map((t) => ({ type: "track" as const, id: t.id, title: t.title, subtitle: "Track" })) || []),
        ...(artistsRes.data?.map((a) => ({ type: "artist" as const, id: a.user_id, title: a.stage_name || "Artist", subtitle: "Artist" })) || []),
        ...(beatsRes.data?.map((b) => ({ type: "beat" as const, id: b.id, title: b.title, subtitle: "Beat" })) || []),
      ];

      setResults(combined);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    switch (result.type) {
      case "track":
        navigate(`${prefix}/track/${result.id}`);
        break;
      case "artist":
        navigate(`${prefix}/artist/${result.id}`);
        break;
      case "beat":
        navigate("/beats");
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "track": return <Music className="w-4 h-4 text-primary" />;
      case "artist": return <User className="w-4 h-4 text-secondary" />;
      case "beat": return <Headphones className="w-4 h-4 text-accent" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search BAK55</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search tracks, artists, beats..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <p className="text-center text-muted-foreground py-4 text-sm">No results found</p>
          )}
          {results.map((result, i) => (
            <button
              key={`${result.type}-${result.id}-${i}`}
              onClick={() => handleSelect(result)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
            >
              {getIcon(result.type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{result.title}</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{result.subtitle}</Badge>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}