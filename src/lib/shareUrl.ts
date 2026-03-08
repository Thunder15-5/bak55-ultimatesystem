/**
 * Generate share-friendly URLs that go through the og-meta edge function.
 * Social crawlers (Facebook, Twitter, WhatsApp, etc.) hit this URL and
 * receive proper og:title / og:description / og:image in the HTML.
 * Real users are instantly redirected to the SPA via <meta http-equiv="refresh">.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function getShareUrl(path: string): string {
  // The og-meta function serves crawler-friendly HTML with a redirect for humans
  return `${SUPABASE_URL}/functions/v1/og-meta?path=${encodeURIComponent(path)}`;
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
