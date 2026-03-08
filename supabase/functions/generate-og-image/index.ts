const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fallbackSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#0f0a1a"/>
    <rect x="0" y="0" width="1200" height="4" fill="#D946EF"/>
    <text x="600" y="290" text-anchor="middle" fill="white" font-size="64" font-family="Arial,sans-serif" font-weight="bold">BAK55 Talent</text>
    <text x="600" y="340" text-anchor="middle" fill="#9CA3AF" font-size="24" font-family="Arial,sans-serif">Where African Artists Build Careers</text>
    <rect x="0" y="626" width="1200" height="4" fill="#D946EF"/>
  </svg>`;
}

async function queryDb(table: string, select: string, eqCol: string, eqVal: string, single: boolean) {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const u = `${base}/rest/v1/${table}?select=${select}&${eqCol}=eq.${eqVal}`;
  const h: Record<string, string> = { apikey: key, Authorization: `Bearer ${key}` };
  if (single) h["Accept"] = "application/vnd.pgrst.object+json";
  const r = await fetch(u, { headers: h });
  if (!r.ok) return null;
  return r.json();
}

async function countDb(table: string, eqCol: string, eqVal: string): Promise<number> {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const u = `${base}/rest/v1/${table}?select=id&${eqCol}=eq.${eqVal}`;
  const r = await fetch(u, { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: "0-0" } });
  const range = r.headers.get("content-range");
  return range ? parseInt(range.split("/")[1] || "0") : 0;
}

function makeSvg(title: string, subtitle: string, extra: string, accent: string, imageUrl?: string): string {
  const fs = title.length > 25 ? 42 : title.length > 15 ? 52 : 62;
  const avatar = imageUrl
    ? `<clipPath id="ac"><circle cx="180" cy="315" r="120"/></clipPath><image href="${esc(imageUrl)}" x="60" y="195" width="240" height="240" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/><circle cx="180" cy="315" r="120" fill="none" stroke="${accent}" stroke-width="4"/>`
    : `<circle cx="180" cy="315" r="120" fill="#2a1a3a"/><text x="180" y="335" text-anchor="middle" fill="${accent}" font-size="48" font-family="Arial,sans-serif" font-weight="bold">${esc(title.substring(0, 2).toUpperCase())}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630"><stop offset="0%" stop-color="#0f0a1a"/><stop offset="50%" stop-color="#1a0533"/><stop offset="100%" stop-color="#0a0f1a"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<rect x="0" y="0" width="1200" height="4" fill="${accent}"/>
<rect x="0" y="626" width="1200" height="4" fill="${accent}"/>
${avatar}
<text x="340" y="280" fill="white" font-size="${fs}" font-family="Arial,sans-serif" font-weight="bold">${esc(title.substring(0, 30))}</text>
<text x="340" y="320" fill="#b0b0b0" font-size="22" font-family="Arial,sans-serif">${esc(subtitle.substring(0, 60))}</text>
${extra}
<text x="1060" y="580" text-anchor="middle" fill="white" font-size="24" font-family="Arial,sans-serif" font-weight="bold" opacity="0.9">BAK55</text>
<text x="1060" y="600" text-anchor="middle" fill="#9CA3AF" font-size="12" font-family="Arial,sans-serif">TALENT</text>
</svg>`;
}

/**
 * Convert SVG string to PNG using resvg-js.
 * Falls back to SVG if conversion fails.
 */
async function svgToPng(svgString: string): Promise<{ data: Uint8Array; contentType: string }> {
  try {
    // Use resvg-wasm for SVG → PNG conversion in Deno
    const { Resvg, initWasm } = await import("npm:@resvg/resvg-wasm@2.6.2");
    
    // Fetch and initialize WASM binary
    const wasmResponse = await fetch("https://unpkg.com/@aspect-build/rules_js@2.2.0/resvg_wasm_bg.wasm");
    if (wasmResponse.ok) {
      const wasmBinary = await wasmResponse.arrayBuffer();
      try {
        await initWasm(wasmBinary);
      } catch {
        // Already initialized - this is fine
      }
    }
    
    const resvg = new Resvg(svgString, {
      fitTo: { mode: "width", value: 1200 },
      font: { loadSystemFonts: false },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    return { data: pngBuffer, contentType: "image/png" };
  } catch (e) {
    console.warn("resvg PNG conversion failed, falling back to SVG:", e);
  }

  // Fallback: return SVG
  return { 
    data: new TextEncoder().encode(svgString), 
    contentType: "image/svg+xml" 
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const id = url.searchParams.get("id");
    const format = url.searchParams.get("format") || "png"; // Default to PNG

    if (!type || !id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      const svg = fallbackSvg();
      if (format === "svg") {
        return new Response(svg, { headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
      }
      const { data, contentType } = await svgToPng(svg);
      return new Response(data, { headers: { ...corsHeaders, "Content-Type": contentType, "Cache-Control": "public, max-age=3600" } });
    }

    const accent = type === "competition" ? "#EA580C" : "#D946EF";
    let svgResult: string;

    if (type === "artist") {
      const [profile, artist, fCount, tCount] = await Promise.all([
        queryDb("profiles", "username,display_name,avatar_url,location,bio", "id", id, true),
        queryDb("artist_profiles", "stage_name,genres,verified", "user_id", id, true),
        countDb("followers", "artist_id", id),
        countDb("tracks", "artist_id", id),
      ]);

      const name = artist?.stage_name || profile?.display_name || profile?.username || "Artist";
      const genre = artist?.genres?.slice(0, 2).join(" | ") || "African Music";
      const loc = profile?.location || "Kenya";
      const extra = `<text x="340" y="360" fill="#9CA3AF" font-size="18" font-family="Arial,sans-serif">${esc(genre)} | ${esc(loc)}</text>
<text x="340" y="395" fill="${accent}" font-size="18" font-family="Arial,sans-serif" font-weight="600">${fCount} Followers | ${tCount} Tracks</text>
${artist?.verified ? `<rect x="340" y="410" width="100" height="28" rx="14" fill="${accent}"/><text x="390" y="429" text-anchor="middle" fill="white" font-size="13" font-family="Arial,sans-serif" font-weight="bold">Verified</text>` : ""}`;

      const sub = profile?.bio?.substring(0, 60) || genre + " artist on BAK55 Talent";
      svgResult = makeSvg(name, sub, extra, accent, profile?.avatar_url);
    } else if (type === "track") {
      const track = await queryDb("tracks", "title,cover_image,genre,plays,artist_id", "id", id, true);
      if (!track) {
        const svg = fallbackSvg();
        const { data, contentType } = await svgToPng(svg);
        return new Response(data, { headers: { ...corsHeaders, "Content-Type": contentType, "Cache-Control": "public, max-age=3600" } });
      }

      const profile = await queryDb("profiles", "username,display_name", "id", track.artist_id, true);
      const artistName = profile?.display_name || profile?.username || "Unknown";
      const extra = `<text x="340" y="360" fill="#9CA3AF" font-size="18" font-family="Arial,sans-serif">${esc(track.genre || "Music")}</text>
<text x="340" y="395" fill="${accent}" font-size="18" font-family="Arial,sans-serif" font-weight="600">${track.plays || 0} Plays</text>`;

      svgResult = makeSvg(track.title, "by " + artistName, extra, accent, track.cover_image);
    } else if (type === "competition") {
      const comp = await queryDb("competitions", "title,description,cover_image,prize_amount,status", "id", id, true);
      if (!comp) {
        const svg = fallbackSvg();
        const { data, contentType } = await svgToPng(svg);
        return new Response(data, { headers: { ...corsHeaders, "Content-Type": contentType, "Cache-Control": "public, max-age=3600" } });
      }

      const extra = `<text x="340" y="360" fill="${accent}" font-size="20" font-family="Arial,sans-serif" font-weight="600">${comp.prize_amount} BAK Prize</text>
${comp.status === "active" ? `<rect x="340" y="380" width="200" height="44" rx="22" fill="${accent}"/><text x="440" y="408" text-anchor="middle" fill="white" font-size="18" font-family="Arial,sans-serif" font-weight="bold">VOTE NOW</text>` : ""}`;

      svgResult = makeSvg(comp.title, comp.description?.substring(0, 60) || "Music Competition", extra, accent, comp.cover_image);
    } else {
      svgResult = fallbackSvg();
    }

    // Return SVG if explicitly requested
    if (format === "svg") {
      return new Response(svgResult, { headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
    }

    // Convert to PNG for social media compatibility
    const { data, contentType } = await svgToPng(svgResult);
    return new Response(data, { 
      headers: { 
        ...corsHeaders, 
        "Content-Type": contentType, 
        "Cache-Control": "public, max-age=3600" 
      } 
    });
  } catch (e) {
    console.error("OG error:", e);
    const svg = fallbackSvg();
    // On error, fall back to SVG
    return new Response(svg, { headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
  }
});
