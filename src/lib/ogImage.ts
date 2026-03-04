// Generate dynamic OG image URLs for social sharing
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function getOgImageUrl(type: "artist" | "track" | "competition" | "submission", id: string): string {
  return `${SUPABASE_URL}/functions/v1/generate-og-image?type=${type}&id=${id}`;
}
