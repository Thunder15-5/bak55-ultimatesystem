import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { competition_id } = await req.json();
    
    if (!competition_id) {
      return new Response(
        JSON.stringify({ error: 'competition_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${user.id} running fraud detection for competition ${competition_id}`);

    // Get voting patterns for this competition
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select(`
        id,
        voter_id,
        submission_id,
        created_at,
        submissions (
          id,
          artist_id,
          competition_id
        )
      `)
      .eq('submissions.competition_id', competition_id);

    if (votesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch voting data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze voting patterns
    const voterStats = new Map();
    const submissionVotes = new Map();
    const timePatterns: any[] = [];

    votes?.forEach((vote: any) => {
      // Track votes per voter
      const voterCount = voterStats.get(vote.voter_id) || 0;
      voterStats.set(vote.voter_id, voterCount + 1);

      // Track votes per submission
      const subCount = submissionVotes.get(vote.submission_id) || 0;
      submissionVotes.set(vote.submission_id, subCount + 1);

      // Track timing patterns
      timePatterns.push({
        voter_id: vote.voter_id,
        timestamp: new Date(vote.created_at).getTime(),
      });
    });

    // Prepare data for AI fraud detection
    const suspiciousPatterns = {
      high_frequency_voters: Array.from(voterStats.entries())
        .filter(([_, count]) => count > 10)
        .map(([voter_id, count]) => ({ voter_id, vote_count: count })),
      
      vote_spikes: submissionVotes.size > 0 
        ? Array.from(submissionVotes.entries())
            .filter(([_, count]) => count > 50)
            .map(([submission_id, count]) => ({ submission_id, vote_count: count }))
        : [],
      
      total_votes: votes?.length || 0,
      unique_voters: voterStats.size,
      submissions_count: submissionVotes.size,
    };

    // Call Lovable AI for fraud analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a fraud detection AI for voting systems. Analyze voting patterns and identify suspicious activity. Return ONLY a JSON object with fraud_detected boolean, risk_level, and flagged_items array.'
          },
          {
            role: 'user',
            content: `Analyze these voting patterns:\n${JSON.stringify(suspiciousPatterns, null, 2)}\n\nDetect fraud indicators like:\n- Vote manipulation (many votes from few users)\n- Coordinated voting\n- Suspicious timing patterns\n- Unrealistic vote counts\n\nReturn JSON: {"fraud_detected": boolean, "risk_level": "low|medium|high", "flagged_items": [{type: string, details: string}], "recommendations": string[]}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const fraudAnalysis = JSON.parse(aiResult.choices[0].message.content);

    // Log fraud detection results
    console.log(`Fraud detection for competition ${competition_id}:`, fraudAnalysis);

    // If high risk, create admin notification
    if (fraudAnalysis.risk_level === 'high') {
      const { data: adminUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map((admin: any) => ({
          user_id: admin.user_id,
          type: 'fraud_alert',
          title: 'Fraud Detected in Competition',
          message: `High risk fraud detected in competition. ${fraudAnalysis.flagged_items.length} suspicious patterns found.`,
          link: `/competition/${competition_id}`,
        }));

        await supabase.from('notifications').insert(notifications);
      }
    }

    return new Response(
      JSON.stringify(fraudAnalysis),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in detect-fraud:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
