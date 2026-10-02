import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createSupabaseContext } from 'npm:@supabase/server@1'

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
  'create_service_order',
  'issue_referral_code',
  'attribute_referral',
  'enqueue_agent_task',
])

const MAX_BODY_BYTES = 64 * 1024

export default {
  fetch: async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') {
      return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: corsHeaders })
    }

    try {
      const contentLength = Number(req.headers.get('content-length') ?? 0)
      if (contentLength > MAX_BODY_BYTES) {
        return Response.json({ error: 'request_too_large' }, { status: 413, headers: corsHeaders })
      }

      const { data: ctx, error: authError } = await createSupabaseContext(req, { auth: 'user' })
      if (authError || !ctx?.userClaims?.sub) {
        return Response.json(
          { error: authError?.code ?? 'invalid_session' },
          { status: authError?.status ?? 401, headers: corsHeaders },
        )
      }

      const body = await req.json()
      const action = typeof body?.action === 'string' ? body.action : ''
      const payload = body?.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
        ? body.payload
        : {}

      if (!ALLOWED_ACTIONS.has(action)) {
        return Response.json({ error: 'action_not_allowed' }, { status: 400, headers: corsHeaders })
      }

      const { data, error } = await ctx.supabaseAdmin.rpc('omega_runtime_dispatch', {
        p_actor_user_id: ctx.userClaims.sub,
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
  },
}
