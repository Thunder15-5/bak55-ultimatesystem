import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // artist, track, competition, submission
    const id = url.searchParams.get("id");

    if (!type || !id) {
      return new Response("Missing type or id", { status: 400 });
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return new Response("Invalid id format", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      case "submission":
        ogData = await getSubmissionOG(supabase, id);
        break;
      default:
        return new Response("Invalid type", { status: 400 });
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
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300",
      },
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

async function getArtistOG(supabase: any, id: string): Promise<OGData> {
  const [{ data: profile }, { data: artistProfile }, { count: followers }, { count: tracks }] = await Promise.all([
    supabase.from("profiles").select("username, display_name, avatar_url, location, bio").eq("id", id).single(),
    supabase.from("artist_profiles").select("stage_name, genres, verified, talent_score").eq("user_id", id).maybeSingle(),
    supabase.from("followers").select("*", { count: "exact", head: true }).eq("artist_id", id),
    supabase.from("tracks").select("*", { count: "exact", head: true }).eq("artist_id", id),
  ]);

  // Check if there's an active competition with voting
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
  
  // Map location to country flag emoji
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

  if (!track) throw new Error("Track not found");

  const [{ data: profile }, { data: artistProfile }] = await Promise.all([
    supabase.from("profiles").select("username, display_name, avatar_url").eq("id", track.artist_id).single(),
    supabase.from("artist_profiles").select("stage_name").eq("user_id", track.artist_id).maybeSingle(),
  ]);

  const artistName = artistProfile?.stage_name || profile?.display_name || profile?.username || "Unknown";

  return {
    title: track.title,
    subtitle: `by ${artistName}`,
    imageUrl: track.cover_image || profile?.avatar_url || undefined,
    genre: track.genre || undefined,
    stats: `${(track.plays || 0).toLocaleString()} Plays`,
    type: "track",
  };
}

async function getCompetitionOG(supabase: any, id: string): Promise<OGData> {
  const { data: comp } = await supabase
    .from("competitions")
    .select("title, description, cover_image, prize_amount, status, end_date")
    .eq("id", id)
    .single();

  if (!comp) throw new Error("Competition not found");

  const isActive = comp.status === "active";

  return {
    title: comp.title,
    subtitle: comp.description?.substring(0, 80) || "Music Competition on BAK55 Talent",
    imageUrl: comp.cover_image || undefined,
    stats: `🏆 ${comp.prize_amount} BAK Prize`,
    cta: isActive ? "🗳️ VOTE NOW" : undefined,
    type: "competition",
  };
}

async function getSubmissionOG(supabase: any, id: string): Promise<OGData> {
  const { data: sub } = await supabase
    .from("submissions")
    .select("title, cover_image, artist_id, vote_count, competition_id, voting_enabled")
    .eq("id", id)
    .single();

  if (!sub) throw new Error("Submission not found");

  const [{ data: profile }, { data: artistProfile }, { data: comp }] = await Promise.all([
    supabase.from("profiles").select("username, display_name, avatar_url, location").eq("id", sub.artist_id).single(),
    supabase.from("artist_profiles").select("stage_name, genres").eq("user_id", sub.artist_id).maybeSingle(),
    supabase.from("competitions").select("title, status").eq("id", sub.competition_id).single(),
  ]);

  const artistName = artistProfile?.stage_name || profile?.display_name || profile?.username || "Unknown";
  const flag = getCountryFlag(profile?.location || "Kenya");

  return {
    title: `"${sub.title}"`,
    subtitle: `by ${artistName} ${flag}`,
    imageUrl: sub.cover_image || profile?.avatar_url || undefined,
    genre: artistProfile?.genres?.slice(0, 2).join(" • ") || undefined,
    stats: `${sub.vote_count || 0} Votes • ${comp?.title || "Rising Stars"}`,
    cta: sub.voting_enabled && comp?.status === "active" ? "🗳️ VOTE NOW" : undefined,
    type: "submission",
  };
}

function getCountryFlag(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes("kenya") || loc.includes("nairobi") || loc.includes("mombasa")) return "🇰🇪";
  if (loc.includes("tanzania") || loc.includes("dar")) return "🇹🇿";
  if (loc.includes("uganda") || loc.includes("kampala")) return "🇺🇬";
  if (loc.includes("nigeria") || loc.includes("lagos")) return "🇳🇬";
  if (loc.includes("south africa") || loc.includes("johannesburg") || loc.includes("cape town")) return "🇿🇦";
  if (loc.includes("ghana") || loc.includes("accra")) return "🇬🇭";
  if (loc.includes("ethiopia") || loc.includes("addis")) return "🇪🇹";
  if (loc.includes("rwanda") || loc.includes("kigali")) return "🇷🇼";
  if (loc.includes("congo") || loc.includes("kinshasa")) return "🇨🇩";
  if (loc.includes("cameroon") || loc.includes("douala")) return "🇨🇲";
  return "🌍";
}

function generateSVG(data: OGData): string {
  const bgGradient = data.type === "competition" 
    ? '<linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630"><stop offset="0%" stop-color="#1a0533"/><stop offset="50%" stop-color="#0f0a1a"/><stop offset="100%" stop-color="#1a0a0a"/></linearGradient>'
    : '<linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630"><stop offset="0%" stop-color="#0f0a1a"/><stop offset="50%" stop-color="#1a0533"/><stop offset="100%" stop-color="#0a0f1a"/></linearGradient>';

  const accentColor = data.type === "competition" ? "#EA580C" : "#D946EF";

  // Escape XML special characters
  const escXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const titleFontSize = data.title.length > 25 ? 42 : data.title.length > 15 ? 52 : 62;
  
  // Image circle (avatar/cover) placeholder 
  const imageSection = data.imageUrl 
    ? `<clipPath id="avatarClip"><circle cx="180" cy="315" r="120"/></clipPath>
       <image href="${escXml(data.imageUrl)}" x="60" y="195" width="240" height="240" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>
       <circle cx="180" cy="315" r="120" fill="none" stroke="${accentColor}" stroke-width="4"/>`
    : `<circle cx="180" cy="315" r="120" fill="#2a1a3a"/>
       <text x="180" y="325" text-anchor="middle" fill="${accentColor}" font-size="48" font-family="Arial, sans-serif" font-weight="bold">${escXml(data.title.substring(0, 2).toUpperCase())}</text>`;

  const contentX = data.imageUrl ? 340 : 340;
  let contentY = 220;

  let contentElements = "";

  // Badge
  if (data.badge) {
    contentElements += `<rect x="${contentX}" y="${contentY - 20}" width="${data.badge.length * 12 + 24}" height="32" rx="16" fill="${accentColor}" opacity="0.9"/>
    <text x="${contentX + 12}" y="${contentY + 2}" fill="white" font-size="14" font-family="Arial, sans-serif" font-weight="bold">${escXml(data.badge)}</text>`;
    contentY += 30;
  }

  // Title
  contentElements += `<text x="${contentX}" y="${contentY + 40}" fill="white" font-size="${titleFontSize}" font-family="Arial, sans-serif" font-weight="bold">${escXml(data.title.substring(0, 30))}</text>`;
  contentY += 55;

  // Subtitle
  contentElements += `<text x="${contentX}" y="${contentY + 20}" fill="#b0b0b0" font-size="22" font-family="Arial, sans-serif">${escXml(data.subtitle.substring(0, 60))}</text>`;
  contentY += 40;

  // Genre + Location
  if (data.genre || data.location) {
    const infoText = [data.genre, data.location].filter(Boolean).join("  •  ");
    contentElements += `<text x="${contentX}" y="${contentY + 10}" fill="#9CA3AF" font-size="18" font-family="Arial, sans-serif">${escXml(infoText)}</text>`;
    contentY += 30;
  }

  // Stats
  if (data.stats) {
    contentElements += `<text x="${contentX}" y="${contentY + 10}" fill="${accentColor}" font-size="18" font-family="Arial, sans-serif" font-weight="600">${escXml(data.stats)}</text>`;
    contentY += 35;
  }

  // CTA Button
  let ctaElement = "";
  if (data.cta) {
    ctaElement = `
      <rect x="${contentX}" y="${contentY + 5}" width="220" height="48" rx="24" fill="${accentColor}"/>
      <text x="${contentX + 110}" y="${contentY + 35}" text-anchor="middle" fill="white" font-size="20" font-family="Arial, sans-serif" font-weight="bold">${escXml(data.cta)}</text>`;
  }

  // BAK55 Logo watermark
  const logoSection = `
    <text x="1060" y="580" text-anchor="middle" fill="white" font-size="24" font-family="Arial, sans-serif" font-weight="bold" opacity="0.9">BAK55</text>
    <text x="1060" y="600" text-anchor="middle" fill="#9CA3AF" font-size="12" font-family="Arial, sans-serif">TALENT</text>`;

  // Decorative elements
  const decorations = `
    <circle cx="1100" cy="100" r="200" fill="${accentColor}" opacity="0.05"/>
    <circle cx="1150" cy="500" r="150" fill="#06B6D4" opacity="0.05"/>
    <rect x="0" y="0" width="1200" height="4" fill="${accentColor}"/>
    <rect x="0" y="626" width="1200" height="4" fill="${accentColor}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>${bgGradient}</defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    ${decorations}
    ${imageSection}
    ${contentElements}
    ${ctaElement}
    ${logoSection}
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