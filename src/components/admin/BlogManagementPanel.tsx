import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { blogPosts } from "@/pages/blogData";

// Blog posts live in src/pages/blogData.ts and follow the editorial policy documented there:
// real BAK55 updates only — no AI filler, invented stories or fabricated statistics.

export function BlogManagementPanel() {
  const navigate = useNavigate();
  const categories = new Set(blogPosts.map((p) => p.category));
  const sorted = [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Blog & Content Management
          </CardTitle>
          <CardDescription>Platform updates published under the BAK55 editorial policy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{blogPosts.length}</div>
                <div className="text-xs text-muted-foreground">Published Posts</div>
              </CardContent>
            </Card>
            <Card className="border-secondary/20 bg-secondary/5">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-secondary">{categories.size}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </CardContent>
            </Card>
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent-foreground">Static</div>
                <div className="text-xs text-muted-foreground">Content Type</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <p className="mb-2 text-sm font-medium">Editorial policy</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Only real BAK55 updates may be published: no AI-generated filler, no invented artist
                stories, no fabricated quotes or statistics. Every figure must come from our own data
                and be stated as of a date. Posts are stored in the codebase, so publishing currently
                requires a deploy — a database-backed editor is on the roadmap.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/blog")}>
                  <ExternalLink className="mr-1 h-3 w-3" /> View Blog
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/changelog")}>
                  <ExternalLink className="mr-1 h-3 w-3" /> View Changelog
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Current Blog Posts</h4>
            {sorted.map((post) => (
              <div key={post.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{post.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {post.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge variant="default" className="text-[10px]">
                  published
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
