import { withSupabase } from 'npm:@supabase/server@1'

type ClaimBody = {
  limit?: number
}

const workerName = 'omega-notification-worker'

export default {
  fetch: withSupabase({ auth: 'secret' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'method_not_allowed' }, { status: 405 })
    }

    let body: ClaimBody = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const limit = Math.max(1, Math.min(100, Number(body.limit ?? 25)))
    const executionId = Deno.env.get('SB_EXECUTION_ID') ?? crypto.randomUUID()
    const workerId = workerName + ':' + executionId

    const { data: claimed, error: claimError } = await ctx.supabaseAdmin.rpc(
      'claim_notifications',
      {
        p_limit: limit,
        p_worker_id: workerId,
        p_channels: ['in_app'],
        p_reclaim_after: '15 minutes',
      },
    )

    if (claimError) {
      return Response.json(
        { error: 'notification_claim_failed', detail: claimError.message },
        { status: 500 },
      )
    }

    const notificationIds = Array.isArray(claimed) ? claimed : []
    let delivered = 0
    let failed = 0

    for (const notificationId of notificationIds) {
      const { error } = await ctx.supabaseAdmin.rpc('mark_notification_delivered', {
        p_notification_id: notificationId,
        p_channel: 'in_app',
      })

      if (error) {
        failed += 1
        await ctx.supabaseAdmin.rpc('mark_notification_failed', {
          p_notification_id: notificationId,
          p_reason: error.message,
        })
      } else {
        delivered += 1
      }
    }

    return Response.json({
      ok: true,
      worker: workerName,
      claimed: notificationIds.length,
      delivered,
      failed,
      external_channels: 'not_claimed_until_provider_adapter_is_configured',
    })
  }),
}