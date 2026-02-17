import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { track_id } = await req.json();

    // 1. Get track
    const { data: track } = await supabase
      .from('tracks')
      .select('id, title, audio_url, artist_id, is_paid_download')
      .eq('id', track_id)
      .single();

    if (!track) {
      return new Response(JSON.stringify({ error: 'Track not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. If paid, verify purchase and download limit
    if (track.is_paid_download && track.artist_id !== user.id) {
      const { data: purchase } = await supabase
        .from('song_purchases')
        .select('id, download_count, max_downloads')
        .eq('track_id', track_id)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .maybeSingle();

      if (!purchase) {
        return new Response(JSON.stringify({ error: 'Purchase required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (purchase.download_count >= purchase.max_downloads) {
        return new Response(JSON.stringify({ error: 'Download limit reached (3 downloads max)' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Increment download count
      await supabase
        .from('song_purchases')
        .update({ download_count: purchase.download_count + 1 })
        .eq('id', purchase.id);

      // Log download
      await supabase.from('download_logs').insert({
        purchase_id: purchase.id,
        track_id,
        user_id: user.id,
      });
    }

    // 3. Generate signed URL from storage
    // Extract the storage path from the public URL
    const audioUrl = track.audio_url;
    const storagePrefix = '/storage/v1/object/public/tracks/';
    const pathIndex = audioUrl.indexOf(storagePrefix);
    
    if (pathIndex !== -1) {
      const storagePath = decodeURIComponent(audioUrl.substring(pathIndex + storagePrefix.length));
      
      const { data: signedData, error: signedError } = await supabase.storage
        .from('tracks')
        .createSignedUrl(storagePath, 300); // 5 min expiry

      if (signedError || !signedData) {
        // Fallback to public URL
        return new Response(JSON.stringify({ download_url: audioUrl }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ download_url: signedData.signedUrl }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback
    return new Response(JSON.stringify({ download_url: audioUrl }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in download-track:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
