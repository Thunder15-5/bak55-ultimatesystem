const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "default";
    const id = url.searchParams.get("id") || "";

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!id || !uuidRegex.test(id)) {
      return new Response(generateFallbackSVG(), {
        headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" },
      });
    }

    // Dynamic import to avoid top-level import issues
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let ogData: OGData;

    if (type === "artist") {
      ogData = await getArtistOG(supabase, id);
    } else if (type === "track") {
      ogData = await getTrackOG(supabase, id);
    } else if (type === "competition") {
      ogData = await getCompetitionOG(supabase, id);
    } else {
      ogData = { title: "BAK55 Talent", subtitle: "African Music Platform", type: "default" };
    }

    return new Response(generateSVG(ogData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("OG image error:", error);
    return new Response(generateFallbackSVG(), {
      headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" },
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

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getFlag(location: string): string {
  const l = location.toLowerCase();
  if (l.includes("kenya") || l.includes("nairobi")) return "🇰🇪";
  if (l.includes("tanzania")) return "🇹🇿";
  if (l.includes("uganda")) return "🇺🇬";
  if (l.includes("nigeria") || l.includes("lagos")) return "🇳🇬";
  if (l.includes("south africa")) return "🇿🇦";
  if (l.includes("ghana")) return "🇬🇭";
  if (l.includes("ethiopia")) return "🇪🇹";
  if (l.includes("rwanda")) return "🇷🇼";
  return "🌍";
}

async function getArtistOG(supabase: any, id: string): Promise<OGData> {
  const [profileRes, artistRes, followersRes, tracksRes] = await Promise.all([
    supabase.from("profiles").select("username, display_name, avatar_url, location, bio").eq("id", id).single(),
    supabase.from("artist_profiles").select("stage_name, genres, verified").eq("user_id", id).maybeSingle(),
    supabase.from("followers").select("*", { count: "exact", head: true }).eq("artist_id", id),
    supabase.from("tracks").select("*", { count: "exact", head: true }).eq("artist_id", id),
  ]);

  const profile = profileRes.data;
  const artistProfile = artistRes.data;
  const followers = followersRes.count || 0;
  const tracks = tracksRes.count || 0;

  const activeCompRes = await supabase
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

  return {
    title: name,
    subtitle: profile?.bio?.substring(0, 80) || `${genre || "African"} artist on BAK55 Talent`,
    imageUrl: profile?.avatar_url || undefined,
    genre: genre || undefined,
    location: `${getFlag(location)} ${location}`,
    stats: `${followers.toLocaleString()} Followers • ${tracks} Tracks`,
    badge: artistProfile?.verified ? "✓ Verified" : undefined,
    cta: activeCompRes.data ? "🗳️ VOTE NOW" : undefined,
    type: "artist",
  };
}

async function getTrackOG(supabase: any, id: string): Promise<OGData> {
  const { data: track } = await supabase
    .from("tracks").select("title, cover_image, genre, plays, artist_id").eq("id", id).single();

  if (!track) return { title: "Track", subtitle: "on BAK55 Talent", type: "track" };

  const { data: profile } = await supabase
    .from("profiles").select("username, display_name").eq("id", track.artist_id).single();

  return {
    title: track.title,
    subtitle: `by ${profile?.display_name || profile?.username || "Unknown"}`,
    imageUrl: track.cover_image || undefined,
    genre: track.genre || undefined,
    stats: `${(track.plays || 0).toLocaleString()} Plays`,
    type: "track",
  };
}

async function getCompetitionOG(supabase: any, id: string): Promise<OGData> {
  const { data: comp } = await supabase
    .from("competitions").select("title, description, cover_image, prize_amount, status").eq("id", id).single();

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
  const accent = data.type === "competition" ? "#EA580C" : "#D946EF";
  const fontSize = data.title.length > 25 ? 42 : data.title.length > 15 ? 52 : 62;

  const img = data.imageUrl
    ? `<clipPath id="ac"><circle cx="180" cy="315" r="120"/></clipPath>
       <image href="${esc(data.imageUrl)}" x="60" y="195" width="240" height="240" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>
       <circle cx="180" cy="315" r="120" fill="none" stroke="${accent}" stroke-width="4"/>`
    : `<circle cx="180" cy="315" r="120" fill="#2a1a3a"/>
       <text x="180" y="325" text-anchor="middle" fill="${accent}" font-size="48" font-family="Arial,sans-serif" font-weight="bold">${esc(data.title.substring(0, 2).toUpperCase())}</text>`;

  let y = 220;
  let parts = "";

  if (data.badge) {
    parts += `<rect x="340" y="${y - 20}" width="${data.badge.length * 12 + 24}" height="32" rx="16" fill="${accent}" opacity="0.9"/>
    <text x="352" y="${y + 2}" fill="white" font-size="14" font-family="Arial,sans-serif" font-weight="bold">${esc(data.badge)}</text>`;
    y += 30;
  }

  parts += `<text x="340" y="${y + 40}" fill="white" font-size="${fontSize}" font-family="Arial,sans-serif" font-weight="bold">${esc(data.title.substring(0, 30))}</text>`;
  y += 55;
  parts += `<text x="340" y="${y + 20}" fill="#b0b0b0" font-size="22" font-family="Arial,sans-serif">${esc(data.subtitle.substring(0, 60))}</text>`;
  y += 40;

  if (data.genre || data.location) {
    parts += `<text x="340" y="${y + 10}" fill="#9CA3AF" font-size="18" font-family="Arial,sans-serif">${esc([data.genre, data.location].filter(Boolean).join("  •  "))}</text>`;
    y += 30;
  }
  if (data.stats) {
    parts += `<text x="340" y="${y + 10}" fill="${accent}" font-size="18" font-family="Arial,sans-serif" font-weight="600">${esc(data.stats)}</text>`;
    y += 35;
  }
  if (data.cta) {
    parts += `<rect x="340" y="${y + 5}" width="220" height="48" rx="24" fill="${accent}"/>
      <text x="450" y="${y + 35}" text-anchor="middle" fill="white" font-size="20" font-family="Arial,sans-serif" font-weight="bold">${esc(data.cta)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630"><stop offset="0%" stop-color="#0f0a1a"/><stop offset="50%" stop-color="#1a0533"/><stop offset="100%" stop-color="#0a0f1a"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <circle cx="1100" cy="100" r="200" fill="${accent}" opacity="0.05"/>
    <rect x="0" y="0" width="1200" height="4" fill="${accent}"/>
    <rect x="0" y="626" width="1200" height="4" fill="${accent}"/>
    ${img}
    ${parts}
    <text x="1060" y="580" text-anchor="middle" fill="white" font-size="24" font-family="Arial,sans-serif" font-weight="bold" opacity="0.9">BAK55</text>
    <text x="1060" y="600" text-anchor="middle" fill="#9CA3AF" font-size="12" font-family="Arial,sans-serif">TALENT</text>
  </svg>`;
}

function generateFallbackSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#0f0a1a"/>
    <rect x="0" y="0" width="1200" height="4" fill="#D946EF"/>
    <text x="600" y="290" text-anchor="middle" fill="white" font-size="64" font-family="Arial,sans-serif" font-weight="bold">BAK55 Talent</text>
    <text x="600" y="340" text-anchor="middle" fill="#9CA3AF" font-size="24" font-family="Arial,sans-serif">Where African Artists Build Careers</text>
    <rect x="0" y="626" width="1200" height="4" fill="#D946EF"/>
  </svg>`;
}
