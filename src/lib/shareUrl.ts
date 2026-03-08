/**
 * Generate share-friendly URLs that go through the og-meta edge function.
 * Social crawlers (Facebook, Twitter, WhatsApp, etc.) hit this URL and
 * receive proper og:title / og:description / og:image in the HTML.
 * Real users are instantly redirected to the SPA via <meta http-equiv="refresh">.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function getShareUrl(path: string, customMeta?: { title?: string; desc?: string; image?: string }): string {
  const params = new URLSearchParams({ path });
  if (customMeta?.title) params.set("title", customMeta.title);
  if (customMeta?.desc) params.set("desc", customMeta.desc);
  if (customMeta?.image) params.set("image", customMeta.image);
  return `${SUPABASE_URL}/functions/v1/og-meta?${params.toString()}`;
}

export function getArtistShareUrl(artistId: string): string {
  return getShareUrl(`/artist/${artistId}`);
}

export function getTrackShareUrl(trackId: string): string {
  return getShareUrl(`/track/${trackId}`);
}

export function getCompetitionShareUrl(competitionId: string): string {
  return getShareUrl(`/competition/${competitionId}`);
}

export function getBlogShareUrl(blogId: string | number, title: string, excerpt: string, image?: string): string {
  return getShareUrl(`/blog/${blogId}`, {
    title,
    desc: excerpt.substring(0, 150),
    image,
  });
}
