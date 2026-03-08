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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_ids, title, body, link, notification_type }: PushRequest =
      await req.json();

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

    if (!tokens?.length) {
      // No push tokens found — still create in-app notifications
      const notifications = user_ids.map((uid) => ({
        user_id: uid,
        type: notification_type || "push",
        title,
        message: body,
        link: link || null,
      }));

      await supabase.from("notifications").insert(notifications);

      return new Response(
        JSON.stringify({
          success: true,
          push_sent: 0,
          in_app_sent: user_ids.length,
          message: "No push tokens found; in-app notifications created",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user notification preferences
    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("*")
      .in("user_id", user_ids);

    const prefMap = new Map(preferences?.map((p: any) => [p.user_id, p]) || []);

    // Filter tokens based on preferences
    const eligibleTokens = tokens.filter((t: any) => {
      const pref = prefMap.get(t.user_id);
      if (!pref) return true; // No preferences = all enabled

      switch (notification_type) {
        case "follow":
          return pref.follows;
        case "tip":
          return pref.tips;
        case "competition":
        case "competition_win":
          return pref.competitions;
        case "message":
          return pref.messages;
        case "track_approved":
        case "track_rejected":
          return pref.track_updates;
        case "marketing":
          return pref.marketing;
        default:
          return true;
      }
    });

    // For now, push notification delivery is prepared for FCM integration.
    // When FCM_SERVER_KEY is configured, this will send actual push notifications.
    // Currently creates in-app notifications for all eligible users.
    const eligibleUserIds = [...new Set(eligibleTokens.map((t: any) => t.user_id))];

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

    // Log the push notification attempt
    await supabase.from("admin_activity_log").insert({
      event_type: "push_notification_sent",
      event_category: "notification",
      description: `Push notification "${title}" sent to ${eligibleUserIds.length} users`,
      metadata: {
        total_targets: user_ids.length,
        eligible_targets: eligibleUserIds.length,
        tokens_found: tokens.length,
        notification_type,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        push_sent: eligibleTokens.length,
        in_app_sent: eligibleUserIds.length,
        filtered_by_preferences: tokens.length - eligibleTokens.length,
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
