import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the request is from an admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin (handle multiple roles)
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError) {
      console.error('Role check error:', roleError)
    }

    if (!adminRole) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }


    const { userId } = await req.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Delete all related data in correct order
    // 1. Delete tracks (they reference artist_id)
    await supabaseAdmin.from('tracks').delete().eq('artist_id', userId)
    
    // 2. Delete submissions
    await supabaseAdmin.from('submissions').delete().eq('artist_id', userId)
    
    // 3. Delete comments
    await supabaseAdmin.from('comments').delete().eq('user_id', userId)
    
    // 4. Delete tips (sent and received)
    await supabaseAdmin.from('tips').delete().eq('from_user_id', userId)
    await supabaseAdmin.from('tips').delete().eq('to_artist_id', userId)
    
    // 5. Delete votes
    await supabaseAdmin.from('votes').delete().eq('voter_id', userId)
    
    // 6. Delete followers
    await supabaseAdmin.from('followers').delete().eq('follower_id', userId)
    await supabaseAdmin.from('followers').delete().eq('artist_id', userId)
    
    // 7. Delete user subscriptions
    await supabaseAdmin.from('user_subscriptions').delete().eq('user_id', userId)
    
    // 8. Delete subscription transactions
    await supabaseAdmin.from('subscription_transactions').delete().eq('user_id', userId)
    
    // 9. Delete payment transactions
    await supabaseAdmin.from('payment_transactions').delete().eq('user_id', userId)
    
    // 10. Delete wallet transactions then wallet
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (wallet) {
      await supabaseAdmin.from('transactions').delete().eq('wallet_id', wallet.id)
      await supabaseAdmin.from('wallets').delete().eq('id', wallet.id)
    }
    
    // 11. Delete playlists and playlist tracks
    const { data: playlists } = await supabaseAdmin
      .from('playlists')
      .select('id')
      .eq('user_id', userId)
    
    if (playlists) {
      for (const playlist of playlists) {
        await supabaseAdmin.from('playlist_tracks').delete().eq('playlist_id', playlist.id)
      }
      await supabaseAdmin.from('playlists').delete().eq('user_id', userId)
    }
    
    // 12. Delete notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId)
    
    // 13. Delete listening history
    await supabaseAdmin.from('listening_history').delete().eq('user_id', userId)
    
    // 14. Delete role-specific profiles
    await supabaseAdmin.from('artist_profiles').delete().eq('user_id', userId)
    await supabaseAdmin.from('brand_profiles').delete().eq('user_id', userId)
    
    // 15. Delete user roles
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)
    
    // 16. Delete profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId)
    
    // 17. Finally, delete the auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      return new Response(JSON.stringify({ error: 'Failed to delete auth user: ' + deleteAuthError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in delete-user function:', error)
    const message = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
