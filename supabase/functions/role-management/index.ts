import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_ROLES = ["artist", "fan", "producer", "brand", "organizer"];
const ROLE_PERMISSIONS = {
  artist: ["upload_tracks", "create_profile", "withdraw_earnings"],
  producer: ["upload_beats", "license_beats", "analytics"],
  brand: ["create_campaigns", "sponsor_events"],
  fan: ["follow_artists", "vote", "tip_artists"],
  organizer: ["create_competitions", "manage_events"],
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.slice(7));

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    switch (action) {
      case "assign-role": {
        const { role_name } = await req.json();

        if (!VALID_ROLES.includes(role_name)) {
          return new Response(
            JSON.stringify({ error: "Invalid role" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Check if user already has this role
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id)
          .eq("role", role_name)
          .single();

        if (existingRole) {
          return new Response(
            JSON.stringify({ error: "User already has this role" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Assign role
        const { data: newRole, error } = await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            role: role_name,
            assigned_at: new Date().toISOString(),
            permissions: ROLE_PERMISSIONS[role_name as keyof typeof ROLE_PERMISSIONS] || [],
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Log action
        await logAuditEvent(supabase, {
          user_id: user.id,
          action: "role_assigned",
          role: role_name,
          ip_address: req.headers.get("x-forwarded-for") || "unknown",
        });

        return new Response(JSON.stringify({ role: newRole }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get-roles": {
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ roles: roles || [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "revoke-role": {
        const { role_name } = await req.json();

        if (!VALID_ROLES.includes(role_name)) {
          return new Response(
            JSON.stringify({ error: "Invalid role" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Delete the role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.id)
          .eq("role", role_name);

        if (error) {
          throw error;
        }

        // Log action
        await logAuditEvent(supabase, {
          user_id: user.id,
          action: "role_revoked",
          role: role_name,
          ip_address: req.headers.get("x-forwarded-for") || "unknown",
        });

        return new Response(
          JSON.stringify({ success: true, message: "Role revoked" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "has-permission": {
        const permission = url.searchParams.get("permission");

        if (!permission) {
          return new Response(
            JSON.stringify({ error: "permission parameter required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data: roles } = await supabase
          .from("user_roles")
          .select("permissions")
          .eq("user_id", user.id);

        const hasPermission = roles?.some((role: any) =>
          role.permissions?.includes(permission)
        );

        return new Response(
          JSON.stringify({ has_permission: hasPermission || false }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Role management error:", errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

async function logAuditEvent(
  supabase: any,
  event: {
    user_id: string;
    action: string;
    role: string;
    ip_address: string;
  }
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      user_id: event.user_id,
      action: event.action,
      resource_type: "role",
      changes: { role: event.role },
      ip_address: event.ip_address,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log role audit event:", error);
  }
}
