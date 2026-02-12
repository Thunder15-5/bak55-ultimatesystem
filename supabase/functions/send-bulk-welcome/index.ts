import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all users with their roles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, username, display_name");

    if (profilesError || !profiles) {
      return new Response(JSON.stringify({ error: "Failed to fetch users", details: profilesError?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get roles for all users
    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const roleMap: Record<string, string> = {};
    if (allRoles) {
      for (const r of allRoles) {
        // Keep first role found (priority doesn't matter much for welcome email)
        if (!roleMap[r.user_id]) {
          roleMap[r.user_id] = r.role;
        }
      }
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send welcome emails in batches with delay to avoid SMTP rate limits
    for (const profile of profiles) {
      try {
        const role = roleMap[profile.id] || "fan";
        const username = profile.display_name || profile.username || "Member";

        const { data: result, error: invokeError } = await supabase.functions.invoke("send-email", {
          body: {
            to: profile.email,
            subject: "Welcome to BAK55 Talent — Africa's Premier Music Platform! 🎵",
            template: "welcome",
            data: {
              username,
              role,
              email: profile.email,
            },
          },
        });

        if (invokeError) {
          failed++;
          errors.push(`${profile.email}: ${invokeError.message}`);
        } else {
          sent++;
        }

        // Small delay between emails to avoid SMTP throttling
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err: any) {
        failed++;
        errors.push(`${profile.email}: ${err.message}`);
      }
    }

    console.log(`Bulk welcome email complete: ${sent} sent, ${failed} failed out of ${profiles.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        total: profiles.length,
        sent,
        failed,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Bulk welcome error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
