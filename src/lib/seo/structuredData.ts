// Schema.org Structured Data Generators for BAK55 Talent
import { SEO_CONFIG, TrackSEOData, ArtistSEOData, CompetitionSEOData } from './seoConfig';

// Organization Schema
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SEO_CONFIG.site.url}/#organization`,
    name: SEO_CONFIG.business.name,
    url: SEO_CONFIG.site.url,
    logo: {
      "@type": "ImageObject",
      url: SEO_CONFIG.site.logo,
      width: 512,
      height: 512,
    },
    description: SEO_CONFIG.defaultMeta.description,
    foundingDate: SEO_CONFIG.business.foundingDate,
    founder: {
      "@type": "Person",
      name: SEO_CONFIG.business.founder,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: SEO_CONFIG.business.address.country,
      addressRegion: SEO_CONFIG.business.address.region,
    },
    sameAs: SEO_CONFIG.business.sameAs,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${SEO_CONFIG.site.url}/contact`,
      availableLanguage: ["English", "Swahili"],
    },
  };
}

// Website Schema with Search Action
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SEO_CONFIG.site.url}/#website`,
    name: SEO_CONFIG.site.name,
    url: SEO_CONFIG.site.url,
    description: SEO_CONFIG.defaultMeta.description,
    publisher: {
      "@id": `${SEO_CONFIG.site.url}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SEO_CONFIG.site.url}/catalog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-KE",
  };
}

// Music Streaming Service Schema
export function generateMusicServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MusicStreamingService",
    "@id": `${SEO_CONFIG.site.url}/#service`,
    name: SEO_CONFIG.site.name,
    url: SEO_CONFIG.site.url,
    description: "Africa's leading artist development platform for streaming, competitions, and AI-powered music tools",
    logo: SEO_CONFIG.site.logo,
    provider: {
      "@id": `${SEO_CONFIG.site.url}/#organization`,
    },
    offers: {
      "@type": "Offer",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "KES",
        price: "0",
        eligibleTransactionVolume: {
          "@type": "PriceSpecification",
          name: "Free tier available",
        },
      },
    },
    serviceType: "Music Streaming",
    areaServed: [
      { "@type": "Country", name: "Kenya" },
      { "@type": "Country", name: "Tanzania" },
      { "@type": "Country", name: "Uganda" },
      { "@type": "Country", name: "Nigeria" },
      { "@type": "Continent", name: "Africa" },
    ],
    availableLanguage: ["English", "Swahili"],
  };
}

// MusicRecording Schema for Tracks
export function generateTrackSchema(track: TrackSEOData) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": `${SEO_CONFIG.site.url}/track/${track.id}`,
    name: track.title,
    url: `${SEO_CONFIG.site.url}/track/${track.id}`,
    duration: track.duration ? `PT${Math.floor(track.duration / 60)}M${track.duration % 60}S` : undefined,
    genre: track.genre,
    image: track.coverImage || SEO_CONFIG.site.ogImage,
    datePublished: track.releaseDate,
    description: track.description || `Stream ${track.title} by ${track.artistName} on BAK55 Talent`,
    byArtist: {
      "@type": "MusicGroup",
      "@id": `${SEO_CONFIG.site.url}/artist/${track.artistId}`,
      name: track.artistName,
      url: `${SEO_CONFIG.site.url}/artist/${track.artistId}`,
    },
    inAlbum: {
      "@type": "MusicAlbum",
      name: "Singles",
    },
    interactionStatistic: track.plays ? {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/ListenAction",
      userInteractionCount: track.plays,
    } : undefined,
    provider: {
      "@id": `${SEO_CONFIG.site.url}/#service`,
    },
  };
}

// MusicGroup/Person Schema for Artists
export function generateArtistSchema(artist: ArtistSEOData) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": `${SEO_CONFIG.site.url}/artist/${artist.id}`,
    name: artist.stageName || artist.username,
    url: `${SEO_CONFIG.site.url}/artist/${artist.id}`,
    image: artist.avatarUrl || SEO_CONFIG.site.ogImage,
    description: artist.bio || `${artist.stageName || artist.username} on BAK55 Talent - ${artist.followerCount || 0} followers`,
    genre: artist.genres,
    location: artist.location ? {
      "@type": "Place",
      name: artist.location,
    } : undefined,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/FollowAction",
      userInteractionCount: artist.followerCount || 0,
    },
    member: {
      "@type": "Person",
      name: artist.stageName || artist.username,
    },
    sameAs: [
      `${SEO_CONFIG.site.url}/artist/${artist.id}`,
    ],
  };
}

// Event Schema for Competitions
export function generateCompetitionSchema(competition: CompetitionSEOData) {
  const eventStatus = getEventStatus(competition.status, competition.startDate, competition.endDate);
  
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${SEO_CONFIG.site.url}/competition/${competition.id}`,
    name: competition.title,
    url: `${SEO_CONFIG.site.url}/competition/${competition.id}`,
    description: competition.description || `${competition.title} - Win ${competition.prizeAmount} BAK on BAK55 Talent`,
    image: competition.coverImage || SEO_CONFIG.site.ogImage,
    startDate: competition.startDate,
    endDate: competition.endDate,
    eventStatus: eventStatus,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: `${SEO_CONFIG.site.url}/competition/${competition.id}`,
    },
    organizer: {
      "@id": `${SEO_CONFIG.site.url}/#organization`,
    },
    offers: {
      "@type": "Offer",
      name: "Competition Entry",
      priceCurrency: "BAK",
      price: "0",
      availability: "https://schema.org/InStock",
      validFrom: competition.startDate,
      validThrough: competition.endDate,
    },
    about: {
      "@type": "CreativeWork",
      name: "Music Competition",
      genre: competition.genres,
    },
  };
}

function getEventStatus(status?: string, startDate?: string, endDate?: string): string {
  if (!status) return "https://schema.org/EventScheduled";
  
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  if (status === 'cancelled') return "https://schema.org/EventCancelled";
  if (end && now > end) return "https://schema.org/EventEnded";
  if (start && now >= start) return "https://schema.org/EventScheduled";
  
  return "https://schema.org/EventScheduled";
}

// BreadcrumbList Schema
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SEO_CONFIG.site.url}${item.url}`,
    })),
  };
}

// FAQPage Schema
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// Article/BlogPosting Schema
export function generateArticleSchema(article: {
  title: string;
  description: string;
  image: string;
  publishedTime: string;
  modifiedTime?: string;
  author: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.publishedTime,
    dateModified: article.modifiedTime || article.publishedTime,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@id": `${SEO_CONFIG.site.url}/#organization`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.url,
    },
  };
}

// ItemList Schema for Music Catalog
export function generateMusicCatalogSchema(tracks: TrackSEOData[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "BAK55 Music Catalog",
    description: "Browse the latest African music on BAK55 Talent",
    numberOfItems: tracks.length,
    itemListElement: tracks.slice(0, 10).map((track, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "MusicRecording",
        "@id": `${SEO_CONFIG.site.url}/track/${track.id}`,
        name: track.title,
        url: `${SEO_CONFIG.site.url}/track/${track.id}`,
        byArtist: {
          "@type": "MusicGroup",
          name: track.artistName,
        },
      },
    })),
  };
}
