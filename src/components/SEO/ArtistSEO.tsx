import { SEOHead } from "./SEOHead";
import { ArtistSEOData } from "@/lib/seo/seoConfig";
import { generateArtistSchema, generateBreadcrumbSchema } from "@/lib/seo/structuredData";
import { getOgImageUrl } from "@/lib/ogImage";

interface ArtistSEOProps {
  artist: ArtistSEOData;
}

export function ArtistSEO({ artist }: ArtistSEOProps) {
  const displayName = artist.stageName || artist.username;
  const title = `${displayName}${artist.verified ? " ✓" : ""}`;
  
  const genreText = artist.genres?.length ? artist.genres.slice(0, 3).join(", ") : "African music";
  const locationText = artist.location ? ` from ${artist.location}` : "";
  
  const description = artist.bio 
    ? `${artist.bio.substring(0, 140)}...` 
    : `🎤 Follow ${displayName}${locationText} on BAK55 Talent. ${artist.followerCount?.toLocaleString() || 0} followers • ${artist.trackCount || 0} tracks • ${genreText}. Discover the future of African music.`;
  
  // Use dynamic OG image from edge function
  const ogImage = getOgImageUrl("artist", artist.id);

  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Artists", url: "/catalog" },
    { name: displayName, url: `/artist/${artist.id}` },
  ]);

  return (
    <SEOHead
      title={title}
      description={description}
      image={ogImage}
      url={`/artist/${artist.id}`}
      type="profile"
      keywords={[
        displayName,
        artist.username,
        ...(artist.genres || []),
        "African artist",
        "BAK55 Talent",
        artist.location || "Kenya",
        "music streaming",
      ]}
      structuredData={[generateArtistSchema(artist), breadcrumbs]}
    />
  );
}
