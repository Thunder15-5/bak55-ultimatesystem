import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Agora RTC token builder ported for Deno
// Based on https://github.com/AgoraIO/Tools/tree/master/DynamicKey/AgoraKeyGenerator

const VERSION = "007";
const PRIVILEGES = {
  joinChannel: 1,
  publishAudioStream: 2,
  publishVideoStream: 3,
  publishDataStream: 4,
};

function encodeUint16(val: number): string {
  const buf = new Uint8Array(2);
  buf[0] = val & 0xff;
  buf[1] = (val >> 8) & 0xff;
  return String.fromCharCode(...buf);
}

function encodeUint32(val: number): string {
  const buf = new Uint8Array(4);
  buf[0] = val & 0xff;
  buf[1] = (val >> 8) & 0xff;
  buf[2] = (val >> 16) & 0xff;
  buf[3] = (val >> 24) & 0xff;
  return String.fromCharCode(...buf);
}

function encodeString(str: string): string {
  return encodeUint16(str.length) + str;
}

function encodeMapUint32(map: Record<number, number>): string {
  let result = encodeUint16(Object.keys(map).length);
  for (const [key, val] of Object.entries(map)) {
    result += encodeUint16(parseInt(key));
    result += encodeUint32(val);
  }
  return result;
}

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function strToUint8(str: string): Uint8Array {
  return new Uint8Array([...str].map((c) => c.charCodeAt(0)));
}

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, data);
}

function toBase64(str: string): string {
  return btoa(str);
}

async function buildToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number, // 1 = publisher, 2 = subscriber
  privilegeExpiredTs: number
): Promise<string> {
  const ts = Math.floor(Date.now() / 1000);
  const salt = Math.floor(Math.random() * 0xffffffff);

  const privileges: Record<number, number> = {};
  privileges[PRIVILEGES.joinChannel] = privilegeExpiredTs;
  if (role === 1) {
    privileges[PRIVILEGES.publishAudioStream] = privilegeExpiredTs;
    privileges[PRIVILEGES.publishVideoStream] = privilegeExpiredTs;
    privileges[PRIVILEGES.publishDataStream] = privilegeExpiredTs;
  }

  let message = "";
  message += encodeUint32(salt);
  message += encodeUint32(ts);
  message += encodeMapUint32(privileges);

  const toSign = `${appId}${channelName}${uid}${message}`;
  const signature = await hmacSha256(
    strToUint8(appCertificate),
    strToUint8(toSign)
  );

  const content =
    encodeString(appId) +
    encodeString(channelName) +
    encodeUint32(uid) +
    encodeString(message) +
    encodeString(String.fromCharCode(...new Uint8Array(signature)));

  return `${VERSION}${toBase64(content)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { channelName, role, streamId } = await req.json();

    if (!channelName) {
      return new Response(JSON.stringify({ error: "channelName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appId = Deno.env.get("AGORA_APP_ID");
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");

    if (!appId || !appCertificate) {
      return new Response(JSON.stringify({ error: "Agora credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a numeric UID from user ID (hash to 32-bit int)
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(userId));
    const hashArray = new Uint8Array(hashBuffer);
    const uid = ((hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3]) >>> 0;

    // Token valid for 1 hour
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 3600;
    const agoraRole = role === "host" ? 1 : 2; // 1 = publisher, 2 = subscriber

    const agoraToken = await buildToken(
      appId,
      appCertificate,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs
    );

    // If joining as viewer, increment viewer count
    if (streamId && agoraRole === 2) {
      await supabase
        .from("stream_viewers")
        .upsert({ stream_id: streamId, user_id: userId }, { onConflict: "stream_id,user_id" });
    }

    return new Response(
      JSON.stringify({
        token: agoraToken,
        uid,
        appId,
        channelName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Agora token error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
