import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
    })
  }

  try {
    const { user_id, domain } = await req.json()

    if (!user_id || !domain) {
      return new Response(JSON.stringify({ error: 'user_id and domain required' }), {
        status: 400,
      })
    }

    // Get user's domain mastery
    const { data: mastery, error: masteryError } = await supabase
      .from('domain_mastery')
      .select('total_points, quests_completed, level')
      .eq('user_id', user_id)
      .eq('domain', domain)
      .maybeSingle()

    if (masteryError) {
      return new Response(JSON.stringify({ error: masteryError.message }), { status: 500 })
    }

    if (!mastery) {
      return new Response(JSON.stringify({ error: 'No mastery data found' }), { status: 404 })
    }

    // Recalculate level (1-9 scale, 200 points per level)
    const newLevel = Math.min(1 + Math.floor(mastery.total_points / 200), 9)

    // Get rank in this domain (based on points)
    const { data: rankData, error: rankError } = await supabase
      .from('domain_mastery')
      .select('user_id')
      .eq('domain', domain)
      .gt('total_points', mastery.total_points)
      .order('total_points', { ascending: false })

    if (rankError) {
      return new Response(JSON.stringify({ error: rankError.message }), { status: 500 })
    }

    const rank = (rankData?.length || 0) + 1

    // Update leaderboard entry
    const { error: leaderboardError } = await supabase
      .from('leaderboard_entries')
      .upsert({
        user_id,
        domain,
        rank,
        points: mastery.total_points,
        level: newLevel,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'user_id,domain'
      })

    if (leaderboardError) {
      return new Response(JSON.stringify({ error: leaderboardError.message }), { status: 500 })
    }

    return new Response(JSON.stringify({
      user_id,
      domain,
      level: newLevel,
      points: mastery.total_points,
      quests_completed: mastery.quests_completed,
      rank,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
