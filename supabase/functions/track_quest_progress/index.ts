import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface QuestProgressInput {
  user_id: string
  quest_id: string
  progress_increment: number
}

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
    const { user_id, quest_id, progress_increment } = await req.json() as QuestProgressInput

    // Get quest config to find domain and target
    const { data: questConfig, error: configError } = await supabase
      .from('quest_config')
      .select('domain, target_count, points')
      .eq('id', quest_id)
      .single()

    if (configError || !questConfig) {
      return new Response(JSON.stringify({ error: 'Quest not found' }), { status: 404 })
    }

    // Get or create quest completion record
    const { data: existing } = await supabase
      .from('quest_completions')
      .select('id, progress')
      .eq('user_id', user_id)
      .eq('quest_id', quest_id)
      .maybeSingle()

    let newProgress = progress_increment
    let completedAt = null

    if (existing) {
      newProgress = Math.min(existing.progress + progress_increment, questConfig.target_count)
      if (newProgress >= questConfig.target_count && existing.progress < questConfig.target_count) {
        completedAt = new Date().toISOString()
      }
    } else {
      newProgress = Math.min(progress_increment, questConfig.target_count)
      if (newProgress >= questConfig.target_count) {
        completedAt = new Date().toISOString()
      }
    }

    // Upsert quest completion
    const { error: upsertError } = await supabase
      .from('quest_completions')
      .upsert({
        user_id,
        quest_id,
        domain: questConfig.domain,
        progress: newProgress,
        target: questConfig.target_count,
        completed_at: completedAt,
        reward_points: completedAt ? questConfig.points : 0,
      }, {
        onConflict: 'user_id,quest_id'
      })

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 })
    }

    // If quest completed, update domain mastery
    if (completedAt) {
      const { data: mastery } = await supabase
        .from('domain_mastery')
        .select('total_points, quests_completed, level')
        .eq('user_id', user_id)
        .eq('domain', questConfig.domain)
        .maybeSingle()

      const newTotalPoints = (mastery?.total_points || 0) + questConfig.points
      const newQuestsCompleted = (mastery?.quests_completed || 0) + 1
      const newLevel = Math.min(1 + Math.floor(newTotalPoints / 200), 9)

      await supabase
        .from('domain_mastery')
        .upsert({
          user_id,
          domain: questConfig.domain,
          total_points: newTotalPoints,
          quests_completed: newQuestsCompleted,
          level: newLevel,
          last_active: new Date().toISOString(),
        }, {
          onConflict: 'user_id,domain'
        })
    }

    return new Response(JSON.stringify({
      quest_id,
      domain: questConfig.domain,
      progress: newProgress,
      target: questConfig.target_count,
      completed: newProgress >= questConfig.target_count,
      points_earned: completedAt ? questConfig.points : 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
