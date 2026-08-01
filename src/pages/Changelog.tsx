import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSEO } from "@/components/SEO";
import { CHANGELOG, OPEN_ISSUES, RESOLVED_ISSUES, type ChangeCategory } from "@/lib/journey";
import { Progress } from "@/components/ui/progress";
import { JourneyTimeline } from "@/components/JourneyTimeline";
import { LiveStatsRow } from "@/components/LiveStatsRow";

const CATEGORY_STYLES: Record<ChangeCategory, string> = {
  feature: "bg-primary/15 text-primary border-primary/30",
  fix: "bg-secondary/40 text-foreground border-border",
  security: "bg-destructive/15 text-destructive border-destructive/30",
  performance: "bg-accent/15 text-accent border-accent/30",
  policy: "bg-muted text-foreground border-border",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

const Changelog = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageSEO
        page="blog"
        overrides={{
          title: "Changelog — What We Shipped and What Broke",
          description:
            "An append-only record of every BAK55 release, the bugs we fixed in beta, and the work still in progress.",
          keywords: ["BAK55 changelog", "platform updates", "release notes", "product transparency"],
          breadcrumbs: [
            { name: "Home", url: "/" },
            { name: "Changelog", url: "/changelog" },
          ],
        }}
      />
      <Navbar />

      <main className="px-4 pb-20 pt-28">
        <div className="container mx-auto max-w-3xl space-y-10">
          <header className="space-y-4 text-center">
            <h1 className="text-4xl font-bold md:text-5xl">
              Change <span className="text-gradient">Log</span>
            </h1>
            <p className="text-muted-foreground">
              Everything we have shipped, in the order we shipped it. Published entries are never
              edited or removed — corrections are added as new entries.
            </p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Where the platform stands today</CardTitle>
              <CardDescription>Live counts, read directly from our database.</CardDescription>
            </CardHeader>
            <CardContent>
              <LiveStatsRow />
            </CardContent>
          </Card>

          <JourneyTimeline />

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Releases</h2>
            {CHANGELOG.map((release) => (
              <Card key={release.version}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="font-mono text-lg">v{release.version}</CardTitle>
                    <time className="text-sm text-muted-foreground">{formatDate(release.date)}</time>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {release.changes.map((change) => (
                      <li key={change.text} className="flex flex-wrap items-start gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase ${CATEGORY_STYLES[change.category]}`}
                        >
                          {change.category}
                        </Badge>
                        <span className="flex-1 text-sm text-muted-foreground">{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Bugs reported in beta, and their fixes</h2>
            <div className="space-y-3">
              {RESOLVED_ISSUES.map((issue) => (
                <Card key={issue.problem}>
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold">{issue.problem}</h3>
                      <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
                        {issue.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground">Cause:</span> {issue.cause}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground">Fix:</span> {issue.solution}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Still in progress</h2>
            <p className="text-sm text-muted-foreground">
              These are unfinished. We publish them rather than wait until they look good.
            </p>
            <div className="space-y-3">
              {OPEN_ISSUES.map((issue) => (
                <Card key={issue.title}>
                  <CardContent className="space-y-3 p-5">
                    <h3 className="text-sm font-semibold">{issue.title}</h3>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                    <Progress value={issue.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground">Where we are going:</span> {issue.expected}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Changelog;
