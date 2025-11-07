import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { activityType, metadata } = await req.json();

    // Points mapping
    const pointsMap: Record<string, number> = {
      'daily_login': 5,
      'track_play': 2,
      'track_like': 3,
      'artist_follow': 5,
      'track_share': 10,
      'comment': 5,
      'vote': 3,
      'referral': 50
    };

    const points = pointsMap[activityType] || 0;

    // Insert activity
    const { error } = await supabaseClient
      .from('fan_activities')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        points_earned: points,
        metadata
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, points }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error tracking activity:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
