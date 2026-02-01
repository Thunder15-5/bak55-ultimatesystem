import { SEOHead } from "./SEOHead";
import { TrackSEOData } from "@/lib/seo/seoConfig";
import { generateTrackSchema, generateBreadcrumbSchema } from "@/lib/seo/structuredData";

interface TrackSEOProps {
  track: TrackSEOData;
}

export function TrackSEO({ track }: TrackSEOProps) {
  const title = `${track.title} by ${track.artistName}`;
  const description = track.description 
    ? `${track.description.substring(0, 140)}...` 
    : `🎵 Stream "${track.title}" by ${track.artistName} on BAK55 Talent. ${track.plays ? `${track.plays.toLocaleString()} plays` : ''} ${track.genre ? `• ${track.genre}` : ''} • Discover African music.`;
  
  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Music Catalog", url: "/catalog" },
    { name: track.artistName, url: `/artist/${track.artistId}` },
    { name: track.title, url: `/track/${track.id}` },
  ]);

  return (
    <SEOHead
      title={title}
      description={description}
      image={track.coverImage}
      url={`/track/${track.id}`}
      type="music.song"
      keywords={[
        track.title,
        track.artistName,
        track.genre || "African music",
        "stream music",
        "BAK55 Talent",
        "Kenya music",
        "African artists",
      ]}
      structuredData={[generateTrackSchema(track), breadcrumbs]}
    />
  );
}
