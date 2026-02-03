import { SEOHead } from "./SEOHead";
import { SEO_CONFIG, generateCanonicalUrl } from "@/lib/seo/seoConfig";
import { generateBreadcrumbSchema, generateArticleSchema } from "@/lib/seo/structuredData";

export interface BlogSEOData {
  id: number | string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image?: string;
  author?: string;
}

// Category-specific fallback images for better social previews
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  "Founder Story": "/genesis-competition.png.jpeg",
  "Platform": "/genesis-competition.png.jpeg",
  "Artist Guide": "/genesis-competition.png.jpeg",
  "Competition": "/genesis-competition.png.jpeg",
  "Economy": "/genesis-competition.png.jpeg",
  "Monetization": "/genesis-competition.png.jpeg",
  "Startup": "/genesis-competition.png.jpeg",
  "Tech": "/genesis-competition.png.jpeg",
  "Community": "/genesis-competition.png.jpeg",
  "Vision": "/genesis-competition.png.jpeg",
  "default": "/genesis-competition.png.jpeg",
};

function getFallbackImage(category: string): string {
  return `${SEO_CONFIG.site.url}${CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES["default"]}?v=2`;
}

interface BlogSEOProps {
  post: BlogSEOData;
}

export function BlogSEO({ post }: BlogSEOProps) {
  const title = post.title;
  
  // Truncate excerpt to 155 characters for optimal SEO
  const description = post.excerpt.length > 155 
    ? `${post.excerpt.substring(0, 152)}...` 
    : post.excerpt;
  
  // Use provided image or category fallback
  const ogImage = post.image 
    ? (post.image.startsWith('http') ? post.image : `${SEO_CONFIG.site.url}${post.image}`)
    : getFallbackImage(post.category);
  
  const url = `/blog/${post.id}`;
  
  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url },
  ]);

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt,
    image: ogImage,
    publishedTime: post.date,
    modifiedTime: post.date,
    author: post.author || "BAK55 Talent",
    url: generateCanonicalUrl(url),
  });

  return (
    <SEOHead
      title={title}
      description={description}
      image={ogImage}
      url={url}
      type="article"
      publishedTime={post.date}
      author={post.author || "BAK55 Talent"}
      section={post.category}
      keywords={[
        post.title,
        post.category,
        "BAK55 Talent",
        "African music",
        "music industry",
        "artist development",
        "Kenya music",
      ]}
      structuredData={[articleSchema, breadcrumbs]}
    />
  );
}
