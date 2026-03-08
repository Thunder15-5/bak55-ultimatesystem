import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const id = url.searchParams.get("id");

    if (!type || !id) {
      return new Response(generateFallbackSVG(), {
        headers: { ...corsHeaders, "Content-Type": "image/svg+xml" },
      });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return new Response(generateFallbackSVG(), {
        headers: { ...corsHeaders, "Content-Type": "image/svg+xml" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let ogData: OGData;

    switch (type) {
      case "artist":
        ogData = await getArtistOG(supabase, id);
        break;
      case "track":
        ogData = await getTrackOG(supabase, id);
        break;
      case "competition":
        ogData = await getCompetitionOG(supabase, id);
        break;
      default:
        ogData = { title: "BAK55 Talent", subtitle: "African Music Platform", type: "default" };
    }

    const svg = generateSVG(ogData);

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("OG image error:", error);
    return new Response(generateFallbackSVG(), {
      headers: { ...corsHeaders, "Content-Type": "image/svg+xml" },
    });
  }
});

interface OGData {
  title: string;
  subtitle: string;
  imageUrl?: string;
  genre?: string;
  location?: string;
  stats?: string;
  badge?: string;
  cta?: string;
  type: string;
}

function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getCountryFlag(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes("kenya") || loc.includes("nairobi")) return "🇰🇪";
  if (loc.includes("tanzania")) return "🇹🇿";
  if (loc.includes("uganda")) return "🇺🇬";
  if (loc.includes("nigeria") || loc.includes("lagos")) return "🇳🇬";
  if (loc.includes("south africa")) return "🇿🇦";
  if (loc.includes("ghana")) return "🇬🇭";
  if (loc.includes("ethiopia")) return "🇪🇹";
  if (loc.includes("rwanda")) return "🇷🇼";
  return "🌍";
}

async function getArtistOG(supabase: any, id: string): Promise<OGData> {
  const [{ data: profile }, { data: artistProfile }, { count: followers }, { count: tracks }] = await Promise.all([
    supabase.from("profiles").select("username, display_name, avatar_url, location, bio").eq("id", id).single(),
    supabase.from("artist_profiles").select("stage_name, genres, verified").eq("user_id", id).maybeSingle(),
    supabase.from("followers").select("*", { count: "exact", head: true }).eq("artist_id", id),
    supabase.from("tracks").select("*", { count: "exact", head: true }).eq("artist_id", id),
  ]);

  const { data: activeComp } = await supabase
    .from("submissions")
    .select("competition_id, competitions!inner(status)")
    .eq("artist_id", id)
    .eq("voting_enabled", true)
    .eq("competitions.status", "active")
    .limit(1)
    .maybeSingle();

  const name = artistProfile?.stage_name || profile?.display_name || profile?.username || "Artist";
  const genre = artistProfile?.genres?.slice(0, 2).join(" • ") || "";
  const location = profile?.location || "Kenya";
  const flag = getCountryFlag(location);

  return {
    title: name,
    subtitle: profile?.bio?.substring(0, 80) || `${genre || "African"} artist on BAK55 Talent`,
    imageUrl: profile?.avatar_url || undefined,
    genre: genre || undefined,
    location: `${flag} ${location}`,
    stats: `${(followers || 0).toLocaleString()} Followers • ${tracks || 0} Tracks`,
    badge: artistProfile?.verified ? "✓ Verified" : undefined,
    cta: activeComp ? "🗳️ VOTE NOW" : undefined,
    type: "artist",
  };
}

async function getTrackOG(supabase: any, id: string): Promise<OGData> {
  const { data: track } = await supabase
    .from("tracks")
    .select("title, cover_image, genre, plays, artist_id")
    .eq("id", id)
    .single();

  if (!track) return { title: "Track", subtitle: "on BAK55 Talent", type: "track" };

  const { data: profile } = await supabase
    .from("profiles").select("username, display_name").eq("id", track.artist_id).single();

  const artistName = profile?.display_name || profile?.username || "Unknown";

  return {
    title: track.title,
    subtitle: `by ${artistName}`,
    imageUrl: track.cover_image || undefined,
    genre: track.genre || undefined,
    stats: `${(track.plays || 0).toLocaleString()} Plays`,
    type: "track",
  };
}

async function getCompetitionOG(supabase: any, id: string): Promise<OGData> {
  const { data: comp } = await supabase
    .from("competitions")
    .select("title, description, cover_image, prize_amount, status")
    .eq("id", id)
    .single();

  if (!comp) return { title: "Competition", subtitle: "on BAK55 Talent", type: "competition" };

  return {
    title: comp.title,
    subtitle: comp.description?.substring(0, 80) || "Music Competition on BAK55 Talent",
    imageUrl: comp.cover_image || undefined,
    stats: `🏆 ${comp.prize_amount} BAK Prize`,
    cta: comp.status === "active" ? "🗳️ VOTE NOW" : undefined,
    type: "competition",
  };
}

function generateSVG(data: OGData): string {
  const accentColor = data.type === "competition" ? "#EA580C" : "#D946EF";

  const titleFontSize = data.title.length > 25 ? 42 : data.title.length > 15 ? 52 : 62;

  const imageSection = data.imageUrl
    ? `<clipPath id="avatarClip"><circle cx="180" cy="315" r="120"/></clipPath>
       <image href="${escXml(data.imageUrl)}" x="60" y="195" width="240" height="240" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>
       <circle cx="180" cy="315" r="120" fill="none" stroke="${accentColor}" stroke-width="4"/>`
    : `<circle cx="180" cy="315" r="120" fill="#2a1a3a"/>
       <text x="180" y="325" text-anchor="middle" fill="${accentColor}" font-size="48" font-family="Arial, sans-serif" font-weight="bold">${escXml(data.title.substring(0, 2).toUpperCase())}</text>`;

  const cx = 340;
  let cy = 220;
  let content = "";

  if (data.badge) {
    content += `<rect x="${cx}" y="${cy - 20}" width="${data.badge.length * 12 + 24}" height="32" rx="16" fill="${accentColor}" opacity="0.9"/>
    <text x="${cx + 12}" y="${cy + 2}" fill="white" font-size="14" font-family="Arial, sans-serif" font-weight="bold">${escXml(data.badge)}</text>`;
    cy += 30;
  }

  content += `<text x="${cx}" y="${cy + 40}" fill="white" font-size="${titleFontSize}" font-family="Arial, sans-serif" font-weight="bold">${escXml(data.title.substring(0, 30))}</text>`;
  cy += 55;

  content += `<text x="${cx}" y="${cy + 20}" fill="#b0b0b0" font-size="22" font-family="Arial, sans-serif">${escXml(data.subtitle.substring(0, 60))}</text>`;
  cy += 40;

  if (data.genre || data.location) {
    const info = [data.genre, data.location].filter(Boolean).join("  •  ");
    content += `<text x="${cx}" y="${cy + 10}" fill="#9CA3AF" font-size="18" font-family="Arial, sans-serif">${escXml(info)}</text>`;
    cy += 30;
  }

  if (data.stats) {
    content += `<text x="${cx}" y="${cy + 10}" fill="${accentColor}" font-size="18" font-family="Arial, sans-serif" font-weight="600">${escXml(data.stats)}</text>`;
    cy += 35;
  }

  let ctaEl = "";
  if (data.cta) {
    ctaEl = `<rect x="${cx}" y="${cy + 5}" width="220" height="48" rx="24" fill="${accentColor}"/>
      <text x="${cx + 110}" y="${cy + 35}" text-anchor="middle" fill="white" font-size="20" font-family="Arial, sans-serif" font-weight="bold">${escXml(data.cta)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630">
        <stop offset="0%" stop-color="#0f0a1a"/>
        <stop offset="50%" stop-color="#1a0533"/>
        <stop offset="100%" stop-color="#0a0f1a"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <circle cx="1100" cy="100" r="200" fill="${accentColor}" opacity="0.05"/>
    <rect x="0" y="0" width="1200" height="4" fill="${accentColor}"/>
    <rect x="0" y="626" width="1200" height="4" fill="${accentColor}"/>
    ${imageSection}
    ${content}
    ${ctaEl}
    <text x="1060" y="580" text-anchor="middle" fill="white" font-size="24" font-family="Arial, sans-serif" font-weight="bold" opacity="0.9">BAK55</text>
    <text x="1060" y="600" text-anchor="middle" fill="#9CA3AF" font-size="12" font-family="Arial, sans-serif">TALENT</text>
  </svg>`;
}

function generateFallbackSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#0f0a1a"/>
    <rect x="0" y="0" width="1200" height="4" fill="#D946EF"/>
    <text x="600" y="290" text-anchor="middle" fill="white" font-size="64" font-family="Arial, sans-serif" font-weight="bold">BAK55 Talent</text>
    <text x="600" y="340" text-anchor="middle" fill="#9CA3AF" font-size="24" font-family="Arial, sans-serif">Where African Artists Build Careers</text>
    <rect x="0" y="626" width="1200" height="4" fill="#D946EF"/>
  </svg>`;
}
