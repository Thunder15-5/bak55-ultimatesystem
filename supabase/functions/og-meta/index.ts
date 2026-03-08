/**
 * OG Meta Prerender – serves a minimal HTML page with correct Open Graph
 * meta tags so social-media crawlers (Facebook, Twitter, WhatsApp, LinkedIn,
 * Telegram, etc.) pick up the right title / description / image for any
 * dynamic page (artist, track, competition).
 *
 * Frontend redirects crawlers here via a small JS check or the app calls
 * this URL pattern directly when generating share links.
 *
 * Usage:
 *   /functions/v1/og-meta?path=/artist/<id>
 *   /functions/v1/og-meta?path=/track/<id>
 *   /functions/v1/og-meta?path=/competition/<id>
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://bak55talent.co.ke";
const SITE_NAME = "BAK55 Talent";

/* ── helpers ──────────────────────────────── */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function queryDb(
  table: string,
  select: string,
  eqCol: string,
  eqVal: string,
) {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const url = `${base}/rest/v1/${table}?select=${select}&${eqCol}=eq.${eqVal}`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/vnd.pgrst.object+json",
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function countDb(
  table: string,
  eqCol: string,
  eqVal: string,
): Promise<number> {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const url = `${base}/rest/v1/${table}?select=id&${eqCol}=eq.${eqVal}`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  const range = res.headers.get("content-range");
  return range ? parseInt(range.split("/")[1] || "0") : 0;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ogImageUrl(type: string, id: string): string {
  const base = Deno.env.get("SUPABASE_URL")!;
  return `${base}/functions/v1/generate-og-image?type=${type}&id=${id}`;
}

/* ── meta resolvers ──────────────────────── */

interface Meta {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
}

async function resolveArtist(id: string): Promise<Meta | null> {
  if (!UUID_RE.test(id)) return null;
  const [profile, artist, fCount, tCount] = await Promise.all([
    queryDb("profiles", "username,display_name,avatar_url,location,bio", "id", id),
    queryDb("artist_profiles", "stage_name,genres,verified", "user_id", id),
    countDb("followers", "artist_id", id),
    countDb("tracks", "artist_id", id),
  ]);
  if (!profile) return null;
  const name = artist?.stage_name || profile.display_name || profile.username || "Artist";
  const genre = artist?.genres?.slice(0, 2).join(", ") || "African Music";
  const loc = profile.location || "Kenya";
  const bio = profile.bio?.substring(0, 150) || "";
  const desc = bio || `🎤 ${name} from ${loc} on ${SITE_NAME}. ${fCount} followers · ${tCount} tracks · ${genre}.`;
  return {
    title: `${name}${artist?.verified ? " ✓" : ""} | ${SITE_NAME}`,
    description: desc,
    image: ogImageUrl("artist", id),
    url: `${SITE_URL}/artist/${id}`,
    type: "profile",
  };
}

async function resolveTrack(id: string): Promise<Meta | null> {
  if (!UUID_RE.test(id)) return null;
  const track = await queryDb("tracks", "title,cover_image,genre,plays,artist_id", "id", id);
  if (!track) return null;
  const profile = await queryDb("profiles", "username,display_name", "id", track.artist_id);
  const artistName = profile?.display_name || profile?.username || "Unknown";
  const desc = `🎵 Stream "${track.title}" by ${artistName} on ${SITE_NAME}. ${track.plays || 0} plays · ${track.genre || "Music"}.`;
  return {
    title: `${track.title} by ${artistName} | ${SITE_NAME}`,
    description: desc,
    image: track.cover_image || ogImageUrl("track", id),
    url: `${SITE_URL}/track/${id}`,
    type: "music.song",
  };
}

async function resolveCompetition(id: string): Promise<Meta | null> {
  if (!UUID_RE.test(id)) return null;
  const comp = await queryDb("competitions", "title,description,cover_image,prize_amount,status", "id", id);
  if (!comp) return null;
  const desc = comp.description?.substring(0, 150) || `Win ${comp.prize_amount} BAK in the ${comp.title} competition on ${SITE_NAME}.`;
  return {
    title: `${comp.title} | ${SITE_NAME}`,
    description: desc,
    image: comp.cover_image || ogImageUrl("competition", id),
    url: `${SITE_URL}/competition/${id}`,
    type: "website",
  };
}

/* ── HTML builder ────────────────────────── */

function buildHtml(meta: Meta, redirectUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}"/>

<!-- Open Graph -->
<meta property="og:type" content="${esc(meta.type)}"/>
<meta property="og:url" content="${esc(meta.url)}"/>
<meta property="og:title" content="${esc(meta.title)}"/>
<meta property="og:description" content="${esc(meta.description)}"/>
<meta property="og:image" content="${esc(meta.image)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:site_name" content="${SITE_NAME}"/>

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@BAK55Talent"/>
<meta name="twitter:title" content="${esc(meta.title)}"/>
<meta name="twitter:description" content="${esc(meta.description)}"/>
<meta name="twitter:image" content="${esc(meta.image)}"/>

<!-- Redirect real users to the SPA -->
<meta http-equiv="refresh" content="0;url=${esc(redirectUrl)}"/>
<link rel="canonical" href="${esc(meta.url)}"/>
</head>
<body>
<p>Redirecting to <a href="${esc(redirectUrl)}">${esc(meta.title)}</a>…</p>
</body>
</html>`;
}

/* ── main handler ────────────────────────── */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";

    // Parse the path to determine content type
    const artistMatch = path.match(/\/artist\/([^/?#]+)/);
    const trackMatch = path.match(/\/track\/([^/?#]+)/);
    const competitionMatch = path.match(/\/competition\/([^/?#]+)/);

    let meta: Meta | null = null;

    if (artistMatch) {
      meta = await resolveArtist(artistMatch[1]);
    } else if (trackMatch) {
      meta = await resolveTrack(trackMatch[1]);
    } else if (competitionMatch) {
      meta = await resolveCompetition(competitionMatch[1]);
    }

    // Default fallback
    if (!meta) {
      meta = {
        title: `${SITE_NAME} - Where African Artists Build Careers`,
        description:
          "The complete artist development ecosystem combining streaming, competitions, and AI tools—powered by BAKCoins.",
        image: `${SITE_URL}/og-image.png?v=4`,
        url: `${SITE_URL}${path}`,
        type: "website",
      };
    }

    const redirectUrl = `${SITE_URL}${path}`;
    const html = buildHtml(meta, redirectUrl);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (e) {
    console.error("og-meta error:", e);
    // On error, redirect to the app
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: SITE_URL },
    });
  }
});
