import { Navigation } from "@/components/Navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Coins } from "lucide-react";
import { Link } from "react-router-dom";

const Competitions = () => {
  const { data: competitions } = useQuery({
    queryKey: ["competitions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("*")
        .eq("status", "active")
        .order("start_date", { ascending: false });
      return data || [];
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Competitions</h1>
          <p className="text-muted-foreground">
            Join competitions and showcase your talent
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions?.map((competition) => (
            <Card key={competition.id} className="hover:shadow-glow transition-shadow">
              {competition.cover_image && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={competition.cover_image}
                    alt={competition.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  {competition.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {competition.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(competition.start_date)} - {formatDate(competition.end_date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Coins className="w-4 h-4" />
                    <span>{competition.prize_amount} BAK Prize Pool</span>
                  </div>

                  {competition.entry_fee && competition.entry_fee > 0 && (
                    <div className="text-muted-foreground">
                      Entry Fee: {competition.entry_fee} BAK
                    </div>
                  )}
                </div>

                <Link to={`/competitions/${competition.id}`}>
                  <Button className="w-full">
                    {competition.status === "active" ? "View Competition" : "Coming Soon"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          {competitions?.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No active competitions</h3>
              <p className="text-muted-foreground">
                Check back soon for new competitions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Competitions;
