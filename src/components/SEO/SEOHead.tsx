import { Helmet } from "react-helmet-async";
import { SEO_CONFIG, SEOData, generateCanonicalUrl, generateHreflangTags } from "@/lib/seo/seoConfig";
import { 
  generateOrganizationSchema, 
  generateWebsiteSchema,
  generateMusicServiceSchema 
} from "@/lib/seo/structuredData";

interface SEOHeadProps extends Partial<SEOData> {
  structuredData?: object | object[];
  children?: React.ReactNode;
}

export function SEOHead({
  title,
  description,
  image,
  url,
  type = "website",
  noindex = false,
  keywords,
  publishedTime,
  modifiedTime,
  author,
  section,
  structuredData,
  children,
}: SEOHeadProps) {
  const seoTitle = title 
    ? `${title} | ${SEO_CONFIG.site.name}` 
    : SEO_CONFIG.defaultMeta.title;
  
  const seoDescription = description || SEO_CONFIG.defaultMeta.description;
  const seoImage = image || SEO_CONFIG.defaultMeta.image;
  const seoUrl = url ? generateCanonicalUrl(url) : SEO_CONFIG.site.url;
  const hreflangTags = generateHreflangTags(url || "/");

  // Combine all structured data
  const allStructuredData = [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
    generateMusicServiceSchema(),
    ...(Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : []),
  ];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={seoUrl} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Keywords */}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={seoTitle} />
      <meta property="og:site_name" content={SEO_CONFIG.site.name} />
      <meta property="og:locale" content={SEO_CONFIG.site.locale} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SEO_CONFIG.site.twitterHandle} />
      <meta name="twitter:creator" content={SEO_CONFIG.site.twitterHandle} />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      <meta name="twitter:image:alt" content={seoTitle} />
      
      {/* Article specific meta */}
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {author && (
        <meta property="article:author" content={author} />
      )}
      {section && (
        <meta property="article:section" content={section} />
      )}
      
      {/* Hreflang for International SEO */}
      {hreflangTags.map((tag) => (
        <link 
          key={tag.lang} 
          rel="alternate" 
          hrefLang={tag.lang} 
          href={tag.url} 
        />
      ))}
      
      {/* Geographic targeting */}
      <meta name="geo.region" content="KE" />
      <meta name="geo.placename" content="Kenya" />
      <meta name="geo.position" content="-1.286389;36.817223" />
      <meta name="ICBM" content="-1.286389, 36.817223" />
      
      {/* Mobile optimization */}
      <meta name="theme-color" content={SEO_CONFIG.site.themeColor} />
      <meta name="format-detection" content="telephone=no" />
      
      {/* DNS Prefetch for performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Structured Data */}
      {allStructuredData.map((data, index) => (
        <script 
          key={`structured-data-${index}`}
          type="application/ld+json"
        >
          {JSON.stringify(data)}
        </script>
      ))}
      
      {children}
    </Helmet>
  );
}
