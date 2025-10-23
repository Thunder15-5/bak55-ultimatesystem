import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Filter } from "lucide-react";
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  user_id: string | null;
  event_type: string;
  event_category: string;
  description: string;
  metadata: any;
  created_at: string;
  profiles?: { username: string; email: string };
}

export function ActivityLogPanel() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchActivityLogs();
  }, [categoryFilter]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("admin_activity_log")
        .select(`
          *,
          profiles:user_id (username, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (categoryFilter !== "all") {
        query = query.eq("event_category", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setLogs(data || []);
    } catch (error: any) {
      console.error("Failed to fetch activity logs:", error);
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const filteredLogs = logs.filter(log =>
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const csv = [
      ["Date", "Category", "Event Type", "User", "Description"],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.event_category,
        log.event_type,
        log.profiles?.username || "System",
        log.description
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${new Date().toISOString()}.csv`;
    a.click();
    toast.success("Activity log exported");
  };

  const filteredLogs = logs.filter(log =>
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.event_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "artist": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "fan": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "competition": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "payment": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "content": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Activity Log</CardTitle>
            <CardDescription>Complete audit trail of all platform activities</CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activity logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="artist">Artists</SelectItem>
              <SelectItem value="fan">Fans</SelectItem>
              <SelectItem value="competition">Competitions</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No activity logs found</div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(log.event_category)}>
                          {log.event_category}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.event_type}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{log.description}</p>
                      {log.profiles && (
                        <p className="text-xs text-muted-foreground">
                          User: {log.profiles.username} ({log.profiles.email})
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
