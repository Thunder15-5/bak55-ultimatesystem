import { SEOHead } from "./SEOHead";
import { SEO_CONFIG, PageType } from "@/lib/seo/seoConfig";
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/seo/structuredData";

interface PageSEOConfig {
  title: string;
  description: string;
  keywords: string[];
  breadcrumbs: Array<{ name: string; url: string }>;
  noindex?: boolean;
}

const PAGE_SEO_CONFIGS: Record<PageType, PageSEOConfig> = {
  home: {
    title: "Where African Artists Build Careers",
    description: "The complete artist development ecosystem combining streaming, competitions, and AI tools—powered by BAKCoins. Discover talent, earn real money, and shape the future of African music.",
    keywords: [...SEO_CONFIG.keywords.primary, ...SEO_CONFIG.keywords.secondary],
    breadcrumbs: [{ name: "Home", url: "/" }],
  },
  streaming: {
    title: "Stream African Music",
    description: "Experience music streaming designed for African artists and fans. AI-powered discovery meets fair compensation. Stream Afrobeats, Gengetone, Bongo Flava and more.",
    keywords: ["African music streaming", "Afrobeats", "Gengetone", "Bongo Flava", "Kenya music", "East African music", "stream African artists"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "Streaming", url: "/streaming" }],
  },
  catalog: {
    title: "Music Catalog - Discover African Artists",
    description: "Browse tracks from emerging African artists. Find new music from Kenya, Tanzania, Uganda, Nigeria and across Africa. Stream Afrobeats, Hip Hop, Gengetone & more.",
    keywords: ["African music catalog", "discover African artists", "new African music", "Afrobeats playlist", "Kenya hip hop", "African music discovery"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "Music Catalog", url: "/catalog" }],
  },
  about: {
    title: "About BAK55 Talent",
    description: "Building the essential infrastructure for African music's digital future. Learn about our mission to create fair, transparent artist development ecosystem.",
    keywords: ["about BAK55", "African music platform", "artist development", "music industry Kenya", "fair music streaming"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "About", url: "/about" }],
  },
  blog: {
    title: "Blog - Music Industry Insights",
    description: "Expert insights on the African music industry, artist development tips, streaming strategies, and platform updates from BAK55 Talent.",
    keywords: ["African music blog", "music industry news", "artist tips", "streaming strategy", "music marketing"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }],
  },
  blogPost: {
    title: "Blog Post",
    description: "Read the latest insights from BAK55 Talent.",
    keywords: ["music blog", "African music", "artist tips"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }],
  },
  contact: {
    title: "Contact Us",
    description: "Get in touch with BAK55 Talent. We're here to help artists, fans, and brands connect with Africa's music ecosystem.",
    keywords: ["contact BAK55", "music platform support", "artist support", "Kenya music platform"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }],
  },
  legal: {
    title: "Legal & Terms",
    description: "Terms of service, privacy policy, and legal information for BAK55 Talent platform.",
    keywords: ["BAK55 terms", "privacy policy", "terms of service"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "Legal", url: "/terms" }],
    noindex: true,
  },
  pricing: {
    title: "Pricing & Plans",
    description: "Choose the right BAK55 Talent plan for you. Free tier available. Premium features for artists and brands.",
    keywords: ["BAK55 pricing", "subscription plans", "artist premium", "music streaming plans"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "Pricing", url: "/subscribe" }],
  },
  dashboard: {
    title: "Dashboard",
    description: "Manage your BAK55 Talent account, track earnings, and grow your audience.",
    keywords: ["artist dashboard", "music analytics", "earnings"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "Dashboard", url: "/dashboard" }],
    noindex: true,
  },
  track: {
    title: "Track",
    description: "Listen to music on BAK55 Talent",
    keywords: ["stream music", "African music"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "Catalog", url: "/catalog" }],
  },
  artist: {
    title: "Artist",
    description: "Artist profile on BAK55 Talent",
    keywords: ["African artist", "music"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "Artists", url: "/catalog" }],
  },
  competition: {
    title: "Competition",
    description: "Music competition on BAK55 Talent",
    keywords: ["music competition", "talent contest"],
    breadcrumbs: [{ name: "Home", url: "/" }, { name: "Competitions", url: "/competitions" }],
  },
};

interface PageSEOProps {
  page: PageType;
  overrides?: Partial<PageSEOConfig>;
  faqs?: Array<{ question: string; answer: string }>;
}

export function PageSEO({ page, overrides, faqs }: PageSEOProps) {
  const config = { ...PAGE_SEO_CONFIGS[page], ...overrides };
  
  const structuredData = [
    generateBreadcrumbSchema(config.breadcrumbs),
    ...(faqs ? [generateFAQSchema(faqs)] : []),
  ];

  return (
    <SEOHead
      title={config.title}
      description={config.description}
      url={config.breadcrumbs[config.breadcrumbs.length - 1]?.url || "/"}
      keywords={config.keywords}
      noindex={config.noindex}
      structuredData={structuredData}
    />
  );
}
