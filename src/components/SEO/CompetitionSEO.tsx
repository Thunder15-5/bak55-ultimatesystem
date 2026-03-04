import { SEOHead } from "./SEOHead";
import { CompetitionSEOData } from "@/lib/seo/seoConfig";
import { generateCompetitionSchema, generateBreadcrumbSchema } from "@/lib/seo/structuredData";
import { getOgImageUrl } from "@/lib/ogImage";

interface CompetitionSEOProps {
  competition: CompetitionSEOData;
}

export function CompetitionSEO({ competition }: CompetitionSEOProps) {
  const title = competition.title;
  
  const genreText = competition.genres?.length 
    ? competition.genres.slice(0, 3).join(", ") 
    : "all genres";
    
  const dateRange = `${new Date(competition.startDate).toLocaleDateString()} - ${new Date(competition.endDate).toLocaleDateString()}`;
  
  const description = competition.description 
    ? `${competition.description.substring(0, 140)}...` 
    : `🏆 Join ${competition.title} on BAK55 Talent. Win ${competition.prizeAmount.toLocaleString()} BAK! ${genreText} • ${dateRange}. Submit your music and compete with Africa's best talent.`;
  
  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Competitions", url: "/competitions" },
    { name: competition.title, url: `/competition/${competition.id}` },
  ]);

  return (
    <SEOHead
      title={title}
      description={description}
      image={getOgImageUrl("competition", competition.id)}
      url={`/competition/${competition.id}`}
      type="website"
      keywords={[
        competition.title,
        "music competition",
        "talent competition",
        "win money",
        "BAK55 Talent",
        "African music contest",
        ...(competition.genres || []),
      ]}
      structuredData={[generateCompetitionSchema(competition), breadcrumbs]}
    />
  );
}
