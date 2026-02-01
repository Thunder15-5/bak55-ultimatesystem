// SEO Utilities for BAK55 Talent
import { SEO_CONFIG, TrackSEOData, ArtistSEOData, CompetitionSEOData } from './seoConfig';

/**
 * Generate dynamic meta title with optimal length (50-60 chars)
 */
export function generateMetaTitle(title: string, suffix?: string): string {
  const maxLength = 60;
  const siteName = suffix || SEO_CONFIG.site.name;
  const separator = " | ";
  
  const fullTitle = `${title}${separator}${siteName}`;
  
  if (fullTitle.length <= maxLength) {
    return fullTitle;
  }
  
  // Truncate title to fit
  const maxTitleLength = maxLength - separator.length - siteName.length;
  const truncatedTitle = title.substring(0, maxTitleLength - 3) + "...";
  return `${truncatedTitle}${separator}${siteName}`;
}

/**
 * Generate meta description with optimal length (150-160 chars)
 */
export function generateMetaDescription(text: string, maxLength: number = 155): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3).trim() + "...";
}

/**
 * Generate keywords from content
 */
export function extractKeywords(content: string, maxKeywords: number = 10): string[] {
  // Common words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now'
  ]);
  
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  // Count frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });
  
  // Sort by frequency and return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Generate share text for social media
 */
export function generateShareText(type: 'track' | 'artist' | 'competition', data: any): {
  title: string;
  description: string;
  hashtags: string[];
} {
  switch (type) {
    case 'track':
      return {
        title: `🎵 ${data.title} by ${data.artistName}`,
        description: `Stream "${data.title}" now on BAK55 Talent! ${data.genre ? `#${data.genre.replace(/\s/g, '')}` : ''} #AfricanMusic #BAK55`,
        hashtags: ['BAK55', 'AfricanMusic', 'NewMusic', data.genre?.replace(/\s/g, '') || 'Music'],
      };
    case 'artist':
      return {
        title: `🎤 Follow ${data.stageName || data.username} on BAK55`,
        description: `Discover ${data.stageName || data.username} - ${data.followerCount} followers on BAK55 Talent! #AfricanArtists #BAK55`,
        hashtags: ['BAK55', 'AfricanArtists', ...(data.genres?.slice(0, 2) || [])],
      };
    case 'competition':
      return {
        title: `🏆 ${data.title} - Win ${data.prizeAmount} BAK!`,
        description: `Join ${data.title} on BAK55 Talent! Prize: ${data.prizeAmount} BAK. Submit your music now! #MusicCompetition #BAK55`,
        hashtags: ['BAK55', 'MusicCompetition', 'TalentContest', 'WinMoney'],
      };
    default:
      return {
        title: 'BAK55 Talent',
        description: 'Africa\'s #1 artist development platform',
        hashtags: ['BAK55', 'AfricanMusic'],
      };
  }
}

/**
 * Generate internal linking suggestions based on content type
 */
export function generateInternalLinks(type: 'track' | 'artist' | 'competition' | 'blog', data: any): Array<{
  text: string;
  url: string;
  priority: number;
}> {
  const baseLinks = [
    { text: 'Explore Music', url: '/catalog', priority: 1 },
    { text: 'Active Competitions', url: '/competitions/active', priority: 2 },
    { text: 'How BAKCoins Work', url: '/bakcoins', priority: 3 },
  ];
  
  switch (type) {
    case 'track':
      return [
        { text: `More from ${data.artistName}`, url: `/artist/${data.artistId}`, priority: 1 },
        ...baseLinks,
      ];
    case 'artist':
      return [
        { text: 'View All Tracks', url: '/catalog', priority: 1 },
        { text: 'Join Competition', url: '/competitions/active', priority: 2 },
        ...baseLinks.slice(1),
      ];
    case 'competition':
      return [
        { text: 'Browse Music Catalog', url: '/catalog', priority: 1 },
        { text: 'View All Competitions', url: '/competitions', priority: 2 },
        ...baseLinks.slice(2),
      ];
    default:
      return baseLinks;
  }
}

/**
 * Calculate content score for SEO health
 */
export function calculateSEOScore(content: {
  title?: string;
  description?: string;
  headings?: string[];
  wordCount?: number;
  hasImages?: boolean;
  internalLinks?: number;
  externalLinks?: number;
}): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  let score = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Title (20 points)
  if (content.title) {
    if (content.title.length >= 30 && content.title.length <= 60) {
      score += 20;
    } else if (content.title.length < 30) {
      score += 10;
      issues.push('Title is too short (recommended: 30-60 characters)');
    } else {
      score += 10;
      issues.push('Title is too long (recommended: 30-60 characters)');
    }
  } else {
    issues.push('Missing page title');
  }
  
  // Description (20 points)
  if (content.description) {
    if (content.description.length >= 120 && content.description.length <= 160) {
      score += 20;
    } else if (content.description.length < 120) {
      score += 10;
      suggestions.push('Consider expanding meta description');
    } else {
      score += 10;
      issues.push('Meta description is too long');
    }
  } else {
    issues.push('Missing meta description');
  }
  
  // Headings (15 points)
  if (content.headings && content.headings.length > 0) {
    score += 15;
  } else {
    suggestions.push('Add structured headings (H1-H6)');
  }
  
  // Word count (15 points)
  if (content.wordCount) {
    if (content.wordCount >= 300) {
      score += 15;
    } else if (content.wordCount >= 100) {
      score += 10;
      suggestions.push('Consider adding more content');
    } else {
      score += 5;
      issues.push('Content is thin - add more text');
    }
  }
  
  // Images (10 points)
  if (content.hasImages) {
    score += 10;
  } else {
    suggestions.push('Add images with alt text');
  }
  
  // Internal links (10 points)
  if (content.internalLinks && content.internalLinks >= 2) {
    score += 10;
  } else {
    suggestions.push('Add internal links to related content');
  }
  
  // External links (10 points)
  if (content.externalLinks && content.externalLinks >= 1) {
    score += 10;
  }
  
  return { score, issues, suggestions };
}

/**
 * Format date for SEO (ISO 8601)
 */
export function formatSEODate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Generate language alternatives for international SEO
 */
export function getLanguageAlternatives(path: string): Array<{ lang: string; url: string; label: string }> {
  return [
    { lang: 'en-KE', url: `https://bak55talent.co.ke${path}`, label: 'English (Kenya)' },
    { lang: 'sw-KE', url: `https://bak55talent.co.ke/sw${path}`, label: 'Kiswahili' },
    { lang: 'en-TZ', url: `https://bak55talent.co.ke${path}`, label: 'English (Tanzania)' },
    { lang: 'en-UG', url: `https://bak55talent.co.ke${path}`, label: 'English (Uganda)' },
    { lang: 'en-NG', url: `https://bak55talent.co.ke${path}`, label: 'English (Nigeria)' },
  ];
}
