import { withSupabase } from 'npm:@supabase/server@1'

const workerName = 'omega-media-worker'
const PROVIDER_TIMEOUT_MS = 20_000

type MediaJob = {
  id: string
  provider: string
  job_type: string
  request: Record<string, unknown>
}

async function dispatch(job: MediaJob) {
  const providerUrl = Deno.env.get('OMEGA_MEDIA_PROVIDER_URL')
  const providerSecret = Deno.env.get('OMEGA_MEDIA_PROVIDER_SECRET')
  if (!providerUrl || !providerSecret) {
    return {
      status: 'BLOCKED_PROVIDER',
      errorCode: 'provider_not_configured',
      errorDetail: 'No media generation provider is configured; job remains durable and retryable.',
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)
  try {
    const response = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${providerSecret}`,
        'idempotency-key': job.id,
      },
      body: JSON.stringify({
        job_id: job.id,
        provider: job.provider,
        job_type: job.job_type,
        request: job.request,
      }),
      signal: controller.signal,
    })
    const raw = await response.text()
    let payload: Record<string, unknown> = {}
    try { payload = raw ? JSON.parse(raw) : {} } catch { payload = { raw } }
    if (!response.ok) {
      return {
        status: 'FAILED',
        errorCode: `provider_http_${response.status}`,
        errorDetail: typeof payload.error === 'string' ? payload.error : 'Provider rejected the job.',
        result: payload,
      }
    }
    return {
      status: 'SUCCEEDED',
      providerJobId: typeof payload.job_id === 'string' ? payload.job_id : null,
      result: payload,
    }
  } catch (error) {
    return {
      status: 'FAILED',
      errorCode: 'provider_request_failed',
      errorDetail: error instanceof Error ? error.message : 'Provider request failed.',
    }
  } finally {
    clearTimeout(timer)
  }
}

export default {
  fetch: withSupabase({ auth: 'secret' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
    const limit = Math.max(1, Math.min(25, Number((await req.json().catch(() => ({})))?.limit ?? 10)))
    const executionId = Deno.env.get('SB_EXECUTION_ID') ?? crypto.randomUUID()
    const workerId = workerName + ':' + executionId
    const { data: jobs, error } = await ctx.supabaseAdmin.rpc('claim_media_jobs', { p_limit: limit, p_worker_id: workerId })
    if (error) return Response.json({ error: 'claim_failed' }, { status: 500 })

    let succeeded = 0
    let failed = 0
    let blocked = 0
    for (const job of Array.isArray(jobs) ? jobs as MediaJob[] : []) {
      const result = await dispatch(job)
      await ctx.supabaseAdmin.rpc('complete_media_job', {
        p_job_id: job.id,
        p_status: result.status,
        p_provider_job_id: result.providerJobId ?? null,
        p_result: result.result ?? null,
        p_error_code: result.errorCode ?? null,
        p_error_detail: result.errorDetail ?? null,
      })
      if (result.status === 'SUCCEEDED') succeeded++
      else if (result.status === 'BLOCKED_PROVIDER') blocked++
      else failed++
    }
    return Response.json({ ok: true, worker: workerName, claimed: Array.isArray(jobs) ? jobs.length : 0, succeeded, failed, blocked })
  }),
}
