import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Blog data is currently static in src/pages/blogData.ts
// This panel provides admin visibility into the content system

export function BlogManagementPanel() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Blog & Content Management
          </CardTitle>
          <CardDescription>
            Manage platform blog posts and content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">6</div>
                <div className="text-xs text-muted-foreground">Published Posts</div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/5 border-secondary/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-secondary">6</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </CardContent>
            </Card>
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent-foreground">Static</div>
                <div className="text-xs text-muted-foreground">Content Type</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">📝 Content System Status</p>
              <p className="text-xs text-muted-foreground mb-3">
                Blog content is currently managed as static data in the codebase. For dynamic CMS capabilities
                (create, edit, delete, schedule posts from admin), a database-backed blog system needs to be implemented.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/blog')}>
                  <ExternalLink className="h-3 w-3 mr-1" /> View Blog
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Current Blog Posts</h4>
            {[
              { title: "The Future of AI in African Music", category: "Technology", status: "published" },
              { title: "How to Make It as an Artist in 2025", category: "Career", status: "published" },
              { title: "Understanding Music Distribution", category: "Business", status: "published" },
              { title: "How to Beat the Algorithm", category: "Strategy", status: "published" },
              { title: "The Power of Strategic Partnerships", category: "Industry", status: "published" },
              { title: "Understanding Streaming Statistics", category: "Analytics", status: "published" },
            ].map((post, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{post.title}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{post.category}</Badge>
                </div>
                <Badge variant="default" className="text-[10px]">{post.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
