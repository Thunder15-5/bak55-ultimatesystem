import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PushRequest {
  user_ids: string[];
  title: string;
  body: string;
  link?: string;
  notification_type?: string;
}

async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT_KEY");
  if (!serviceAccountJson) throw new Error("FCM_SERVICE_ACCOUNT_KEY not configured");

  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  // Create JWT header and claim set
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const toBase64Url = (data: Uint8Array) =>
    btoa(String.fromCharCode(...data))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const headerB64 = toBase64Url(encoder.encode(JSON.stringify(header)));
  const claimB64 = toBase64Url(encoder.encode(JSON.stringify(claimSet)));
  const signInput = `${headerB64}.${claimB64}`;

  // Import private key and sign
  const pemContent = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(signInput))
  );

  const jwt = `${signInput}.${toBase64Url(signature)}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function sendFCMMessage(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const message = {
    message: {
      token,
      notification: { title, body },
      data: data || {},
      webpush: {
        fcm_options: {
          link: data?.link || "/",
        },
        notification: {
          icon: "/favicon.png",
          badge: "/favicon.png",
          vibrate: [100, 50, 100],
        },
      },
      android: {
        priority: "high" as const,
        notification: {
          icon: "ic_notification",
          color: "#D946EF",
          sound: "default",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: "default",
            badge: 1,
          },
        },
      },
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error(`FCM send failed for token ${token.substring(0, 10)}...:`, errText);

    // If token is invalid, we should clean it up
    if (response.status === 404 || errText.includes("UNREGISTERED") || errText.includes("NOT_FOUND")) {
      return false; // Signal to remove this token
    }
  }

  return response.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_ids, title, body, link, notification_type }: PushRequest = await req.json();

    if (!user_ids?.length || !title || !body) {
      return new Response(
        JSON.stringify({ error: "user_ids, title, and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch push tokens for the target users
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token, user_id, platform")
      .in("user_id", user_ids);

    if (tokensError) {
      throw new Error(`Failed to fetch tokens: ${tokensError.message}`);
    }

    // Check user notification preferences
    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("*")
      .in("user_id", user_ids);

    const prefMap = new Map(preferences?.map((p: any) => [p.user_id, p]) || []);

    // Filter tokens based on preferences
    const eligibleTokens = (tokens || []).filter((t: any) => {
      const pref = prefMap.get(t.user_id);
      if (!pref) return true;
      switch (notification_type) {
        case "follow": return pref.follows;
        case "tip": return pref.tips;
        case "competition":
        case "competition_win": return pref.competitions;
        case "message": return pref.messages;
        case "track_approved":
        case "track_rejected": return pref.track_updates;
        case "marketing": return pref.marketing;
        default: return true;
      }
    });

    const eligibleUserIds = [...new Set(eligibleTokens.map((t: any) => t.user_id))];

    // Create in-app notifications for all eligible users
    const notifications = eligibleUserIds.map((uid: string) => ({
      user_id: uid,
      type: notification_type || "push",
      title,
      message: body,
      link: link || null,
    }));

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    // Send actual FCM push notifications
    let pushSuccessCount = 0;
    let pushFailCount = 0;
    const invalidTokenIds: string[] = [];

    if (eligibleTokens.length > 0) {
      try {
        const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT_KEY");
        if (serviceAccountJson) {
          const serviceAccount = JSON.parse(serviceAccountJson);
          const accessToken = await getAccessToken();
          const projectId = serviceAccount.project_id;

          const sendPromises = eligibleTokens.map(async (t: any) => {
            const success = await sendFCMMessage(
              accessToken,
              projectId,
              t.token,
              title,
              body,
              { link: link || "/", notification_type: notification_type || "general" }
            );

            if (success) {
              pushSuccessCount++;
            } else {
              pushFailCount++;
              invalidTokenIds.push(t.token);
            }
          });

          await Promise.allSettled(sendPromises);

          // Clean up invalid tokens
          if (invalidTokenIds.length > 0) {
            await supabase
              .from("push_tokens")
              .delete()
              .in("token", invalidTokenIds);
            console.log(`Cleaned up ${invalidTokenIds.length} invalid tokens`);
          }
        } else {
          console.warn("FCM_SERVICE_ACCOUNT_KEY not set — skipping push delivery");
        }
      } catch (fcmError) {
        console.error("FCM delivery error:", fcmError);
      }
    }

    // Log activity
    await supabase.from("admin_activity_log").insert({
      event_type: "push_notification_sent",
      event_category: "notification",
      description: `Push "${title}" — ${pushSuccessCount} pushed, ${eligibleUserIds.length} in-app`,
      metadata: {
        total_targets: user_ids.length,
        eligible_targets: eligibleUserIds.length,
        push_success: pushSuccessCount,
        push_failed: pushFailCount,
        tokens_cleaned: invalidTokenIds.length,
        notification_type,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        push_sent: pushSuccessCount,
        push_failed: pushFailCount,
        in_app_sent: eligibleUserIds.length,
        tokens_cleaned: invalidTokenIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Push notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
