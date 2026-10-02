import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sydomega.com',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}

const ALLOWED_ACTIONS = new Set([
  'catalog',
  'module_manifest',
  'module_state',
  'module_read',
  'issue_referral_code',
  'attribute_referral',
  'enqueue_agent_task',
])

const MAX_BODY_BYTES = 64 * 1024

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'authorization_required' }, { status: 401, headers: corsHeaders })
    }

    const contentLength = Number(req.headers.get('content-length') ?? 0)
    if (contentLength > MAX_BODY_BYTES) {
      return Response.json({ error: 'request_too_large' }, { status: 413, headers: corsHeaders })
    }

    const token = authHeader.slice('Bearer '.length)
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser(token)
    if (authError || !user) {
      return Response.json({ error: 'invalid_session' }, { status: 401, headers: corsHeaders })
    }

    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secret) throw new Error('server_secret_not_configured')

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', secret, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body = await req.json()
    const action = typeof body?.action === 'string' ? body.action : ''
    const payload = body?.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
      ? body.payload
      : {}

    if (!ALLOWED_ACTIONS.has(action)) {
      return Response.json({ error: 'action_not_allowed' }, { status: 400, headers: corsHeaders })
    }

    const { data, error } = await admin.rpc('omega_runtime_dispatch', {
      p_actor_user_id: user.id,
      p_action: action,
      p_payload: payload,
    })
    if (error) throw error

    return Response.json({ ok: true, action, data }, { headers: corsHeaders })
  } catch (error) {
    console.error('omega-runtime-gateway', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'runtime_error' },
      { status: 500, headers: corsHeaders },
    )
  }
})
