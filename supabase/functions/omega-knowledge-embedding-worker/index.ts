import { withSupabase } from 'npm:@supabase/server@1'

const WORKER_PREFIX = 'omega-knowledge-embedding-worker'
const TIMEOUT_MS = 30000

type Job = { id:string; chunk_id:string; provider_key:string; model:string|null; dimensions:number|null; input_sha256:string; provider_request:Record<string,unknown>|null }
type Provider = { provider_key:string; status:string; secret_ref:string|null }
type Result = { status:string; embedding?:unknown[]; model?:string|null; dimensions?:number|null; embeddingSha256?:string|null; result?:Record<string,unknown>|null; errorCode?:string; errorDetail?:string }

async function sha256Hex(value:string) {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('')
}

async function dispatch(provider:Provider,job:Job,content:string):Promise<Result> {
  const url=Deno.env.get('OMEGA_EMBEDDING_GATEWAY_URL')
  const secret=Deno.env.get('OMEGA_EMBEDDING_GATEWAY_SECRET')
  if(provider.status!=='READY'||!url||!secret||!job.model||!job.dimensions)
    return {status:'BLOCKED_PROVIDER',errorCode:'provider_not_configured',errorDetail:'Embedding provider is not READY or server-side credentials/model/dimensions are not configured.'}
  const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),TIMEOUT_MS)
  try {
    const response=await fetch(url,{method:'POST',
      headers:{'content-type':'application/json',authorization:`Bearer ${secret}`,'idempotency-key':job.id},
      body:JSON.stringify({job_id:job.id,provider:provider.provider_key,model:job.model,dimensions:job.dimensions,input_sha256:job.input_sha256,content,request:job.provider_request??{}}),
      signal:controller.signal})
    const raw=await response.text(); let body:Record<string,unknown>={}
    try { body=raw?JSON.parse(raw):{} } catch { body={raw} }
    if(!response.ok) return {status:'FAILED',errorCode:`provider_http_${response.status}`,errorDetail:typeof body.error==='string'?body.error:'Embedding provider rejected the request.',result:body}
    const embedding=Array.isArray(body.embedding)?body.embedding:null
    const model=typeof body.model==='string'?body.model:null
    const dimensions=Number.isInteger(body.dimensions)?Number(body.dimensions):null
    const embeddingSha256=typeof body.embedding_sha256==='string'?body.embedding_sha256.toLowerCase():null
    const validVector=embedding!==null&&embedding.length===job.dimensions&&embedding.every(v=>typeof v==='number'&&Number.isFinite(v))
    if(!validVector||model!==job.model||dimensions!==job.dimensions||!embeddingSha256||!/^[a-f0-9]{64}$/.test(embeddingSha256))
      return {status:'FAILED',errorCode:'embedding_artifact_unverified',errorDetail:'Provider response failed model, dimension, numeric-vector and SHA-256 proof validation.',result:body}
    return {status:'SUCCEEDED',embedding,model,dimensions,embeddingSha256,result:body}
  } catch(error) {
    return {status:'FAILED',errorCode:'provider_request_failed',errorDetail:error instanceof Error?error.message:'Embedding provider request failed.'}
  } finally { clearTimeout(timeout) }
}

export default {fetch:withSupabase({auth:'secret'},async(req,ctx)=>{
  if(req.method!=='POST') return Response.json({error:'method_not_allowed'},{status:405})
  const expected=Deno.env.get('OMEGA_PROVIDER_WORKER_SECRET')
  if(!expected||req.headers.get('x-omega-worker-secret')!==expected) return Response.json({error:'worker_unauthorized'},{status:401})
  const body=await req.json().catch(()=>({})); const limit=Math.max(1,Math.min(25,Number(body?.limit??10)))
  const workerId=`${WORKER_PREFIX}:${crypto.randomUUID()}`
  const {data:jobs,error:claimError}=await ctx.supabaseAdmin.rpc('omega_claim_knowledge_embedding_jobs',{p_limit:limit,p_worker_id:workerId})
  if(claimError) return Response.json({error:'claim_failed'},{status:500})
  let succeeded=0,failed=0,blocked=0,stale=0
  for(const job of (Array.isArray(jobs)?jobs:[]) as Job[]) {
    let result:Result
    const {data:chunks,error:chunkError}=await ctx.supabaseAdmin.from('omega_knowledge_chunks').select('content').eq('id',job.chunk_id).limit(1)
    const content=chunks?.[0]?.content
    if(chunkError||typeof content!=='string') result={status:'FAILED',errorCode:'knowledge_chunk_unavailable',errorDetail:'Knowledge chunk content could not be loaded for embedding.'}
    else if(await sha256Hex(content)!==job.input_sha256) result={status:'FAILED',errorCode:'knowledge_chunk_hash_mismatch',errorDetail:'Knowledge chunk content changed after the job was created; no embedding request was sent.'}
    else {
      const {data:providers,error:providerError}=await ctx.supabaseAdmin.from('omega_provider_registry').select('provider_key,status,secret_ref').eq('provider_key',job.provider_key).limit(1)
      const provider=providers?.[0] as Provider|undefined
      result=providerError||!provider?{status:'FAILED',errorCode:'provider_registry_unavailable',errorDetail:'Embedding provider registry lookup failed.'}:await dispatch(provider,job,content)
    }
    const {error:completionError}=await ctx.supabaseAdmin.rpc('omega_complete_knowledge_embedding_job',{
      p_job_id:job.id,p_status:result.status,p_embedding:result.embedding??null,p_model:result.model??null,p_dimensions:result.dimensions??null,
      p_embedding_sha256:result.embeddingSha256??null,p_provider_response:result.result??null,p_error_code:result.errorCode??null,p_error_message:result.errorDetail??null,p_worker_id:workerId})
    if(completionError) { if(String(completionError.message||'').includes('knowledge_embedding_job_stale_or_not_running')) stale++; else failed++ }
    else if(result.status==='SUCCEEDED') succeeded++; else if(result.status==='BLOCKED_PROVIDER') blocked++; else failed++
  }
  return Response.json({ok:true,worker:WORKER_PREFIX,claimed:Array.isArray(jobs)?jobs.length:0,succeeded,failed,blocked,stale,provider_configured:Boolean(Deno.env.get('OMEGA_EMBEDDING_GATEWAY_URL')&&Deno.env.get('OMEGA_EMBEDDING_GATEWAY_SECRET'))})
})}
