// Enterprise SEO Configuration for BAK55 Talent Platform
// Version suffix for cache-busting OG images (increment when updating branding assets)
export const OG_IMAGE_VERSION = "v=4";

export const SEO_CONFIG = {
  site: {
    name: "BAK55 Talent",
    tagline: "Where African Artists Build Careers",
    domain: "bak55talent.co.ke",
    url: "https://bak55talent.co.ke",
    twitterHandle: "@BAK55Talent",
    logo: "https://bak55talent.co.ke/favicon.png",
    ogImage: "https://bak55talent.co.ke/og-image.png",
    locale: "en_KE",
    alternateLocales: ["en_TZ", "en_UG", "en_NG", "sw_KE"],
    themeColor: "#D946EF",
  },
  
  business: {
    name: "BAK55 Talent",
    type: "MusicStreamingService",
    foundingDate: "2025",
    founder: "Bith Agustine A.",
    address: {
      country: "Kenya",
      region: "Nairobi",
    },
    priceRange: "Free - Premium",
    sameAs: [
      "https://twitter.com/BAK55Talent",
      "https://instagram.com/BAK55Talent",
      "https://facebook.com/BAK55Talent",
      "https://youtube.com/@BAK55Talent",
      "https://tiktok.com/@BAK55Talent",
    ],
  },
  
  keywords: {
    primary: [
      "African music streaming",
      "Kenya music platform",
      "BAK55 Talent",
      "African artists",
      "East African music",
    ],
    secondary: [
      "Afrobeats streaming",
      "Gengetone music",
      "Bongo Flava",
      "African music discovery",
      "music competitions",
      "earn from music",
      "artist development platform",
      "BAKCoins",
    ],
    regional: [
      "Kenya music",
      "Tanzania music",
      "Uganda music",
      "Nigeria music",
      "East Africa artists",
      "African hip hop",
      "Afro pop",
    ],
  },
  
  defaultMeta: {
    title: "BAK55 Talent - Where African Artists Build Careers",
    description: "The complete artist development ecosystem combining streaming, competitions, and AI tools—powered by BAKCoins. Discover talent, earn real money, and shape the future of African music.",
    image: "https://bak55talent.co.ke/og-image.png",
  },
};

export type PageType = 
  | "home" 
  | "track" 
  | "artist" 
  | "competition" 
  | "catalog" 
  | "streaming" 
  | "about" 
  | "blog" 
  | "blogPost"
  | "contact"
  | "legal"
  | "pricing"
  | "dashboard";

export interface SEOData {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: string;
  noindex?: boolean;
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
}

export interface TrackSEOData {
  id: string;
  title: string;
  artistName: string;
  artistId: string;
  genre?: string;
  coverImage?: string;
  plays?: number;
  duration?: number;
  releaseDate?: string;
  description?: string;
}

export interface ArtistSEOData {
  id: string;
  stageName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  genres?: string[];
  followerCount?: number;
  trackCount?: number;
  location?: string;
  verified?: boolean;
}

export interface CompetitionSEOData {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  prizeAmount: number;
  startDate: string;
  endDate: string;
  genres?: string[];
  status?: string;
}

// Generate SEO-friendly URL slugs
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Generate canonical URL
export function generateCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SEO_CONFIG.site.url}${cleanPath}`;
}

// Generate hreflang tags for international SEO
export function generateHreflangTags(path: string): Array<{ lang: string; url: string }> {
  const baseUrl = SEO_CONFIG.site.url;
  return [
    { lang: "x-default", url: `${baseUrl}${path}` },
    { lang: "en-KE", url: `${baseUrl}${path}` },
    { lang: "en-TZ", url: `${baseUrl}${path}` },
    { lang: "en-UG", url: `${baseUrl}${path}` },
    { lang: "en-NG", url: `${baseUrl}${path}` },
    { lang: "sw", url: `${baseUrl}${path}` },
  ];
}
