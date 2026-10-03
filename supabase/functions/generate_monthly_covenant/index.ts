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
    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 })
    }

    // Get current month and year
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // Check if covenant already exists for this month
    const { data: existing } = await supabase
      .from('covenant_progress')
      .select('id')
      .eq('user_id', user_id)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({
        user_id,
        month,
        year,
        message: 'Covenant already exists for this month',
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get user's membership tier to determine covenant difficulty
    const { data: profile } = await supabase
      .from('profiles')
      .select('membership_tier')
      .eq('id', user_id)
      .maybeSingle()

    const tier = profile?.membership_tier || 1

    // Create new covenant progress record
    const { error: createError } = await supabase
      .from('covenant_progress')
      .insert({
        user_id,
        month,
        year,
        tasks_completed: 0,
        points_earned: 0,
        premium_unlocked: false,
        created_at: new Date().toISOString(),
      })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 500 })
    }

    // Generate 25 covenant tasks based on 12 domains
    // Free path: 15 tasks, Premium path: 25 tasks total
    const domains = [
      'prophecy', 'finance', 'education', 'discovery', 'validation', 'execution',
      'governance', 'onboarding', 'archive', 'family', 'security'
    ]

    const tasks = []
    for (let i = 0; i < 25; i++) {
      const domain = domains[i % domains.length]
      const isPremium = i >= 15
      const pointValue = isPremium ? 50 : 40

      tasks.push({
        user_id,
        month,
        year,
        task_index: i + 1,
        domain,
        description: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Challenge ${i + 1}`,
        is_premium: isPremium,
        points: pointValue,
        completed: false,
      })
    }

    // Store tasks in a JSON field or separate table (extending covenant_progress if needed)
    // For now, we'll update covenant_progress with task metadata
    const { error: updateError } = await supabase
      .from('covenant_progress')
      .update({
        tasks_available: JSON.stringify(tasks),
      })
      .eq('user_id', user_id)
      .eq('month', month)
      .eq('year', year)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
    }

    return new Response(JSON.stringify({
      user_id,
      month,
      year,
      tasks_generated: 25,
      free_tasks: 15,
      premium_tasks: 10,
      tier,
      created_at: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
