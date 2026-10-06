import { withSupabase } from 'npm:@supabase/server@1'

const WORKER_PREFIX = 'omega-provider-worker'
const TIMEOUT_MS = 30000

type Job = { id:string; provider_id:string; capability:string; request:Record<string,unknown>; asset_id:string|null }
type Provider = { provider_key:string; status:string }

const key=(p:string,s:string)=>'OMEGA_PROVIDER_'+p.toUpperCase().replace(/[^A-Z0-9]+/g,'_')+'_'+s

async function dispatch(p:Provider,j:Job){
  const url=Deno.env.get(key(p.provider_key,'URL'))
  const secret=Deno.env.get(key(p.provider_key,'SECRET'))
  if(p.status!=='READY'||!url||!secret) return {status:'BLOCKED_PROVIDER',errorCode:'provider_not_configured',errorDetail:'Provider is not READY or server-side credentials are not configured.'}
  const c=new AbortController(); const t=setTimeout(()=>c.abort(),TIMEOUT_MS)
  try{
    const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${secret}`,'idempotency-key':j.id},body:JSON.stringify({job_id:j.id,provider:p.provider_key,capability:j.capability,request:j.request,asset_id:j.asset_id}),signal:c.signal})
    const raw=await r.text(); let body:Record<string,unknown>={}
    try{body=raw?JSON.parse(raw):{}}catch{body={raw}}
    if(!r.ok)return {status:'FAILED',errorCode:`provider_http_${r.status}`,errorDetail:typeof body.error==='string'?body.error:'Provider adapter rejected the job.',result:body}
    const patch=typeof body.provider_asset_id==='string'&&typeof body.source_uri==='string'&&typeof body.content_sha256==='string'?{provider:p.provider_key,provider_asset_id:body.provider_asset_id,source_uri:body.source_uri,storage_path:typeof body.storage_path==='string'?body.storage_path:null,content_sha256:body.content_sha256,license:typeof body.license==='string'?body.license:null,provenance:body.provenance??{},metadata:body.metadata??{}}:null
    return {status:'SUCCEEDED',providerJobId:typeof body.job_id==='string'?body.job_id:null,result:body,assetPatch:patch}
  }catch(e){return {status:'FAILED',errorCode:'provider_request_failed',errorDetail:e instanceof Error?e.message:'Provider adapter request failed.'}}
  finally{clearTimeout(t)}
}

export default {fetch:withSupabase({auth:'secret'},async(req,ctx)=>{
  if(req.method!=='POST')return Response.json({error:'method_not_allowed'},{status:405})
  const expected=Deno.env.get('OMEGA_PROVIDER_WORKER_SECRET')
  if(!expected||req.headers.get('x-omega-worker-secret')!==expected)return Response.json({error:'worker_unauthorized'},{status:401})
  const body=await req.json().catch(()=>({})); const limit=Math.max(1,Math.min(25,Number(body?.limit??10))); const workerId=`${WORKER_PREFIX}:${crypto.randomUUID()}`
  const {data:jobs,error}=await ctx.supabaseAdmin.rpc('omega_claim_provider_jobs',{p_limit:limit,p_worker_id:workerId})
  if(error)return Response.json({error:'claim_failed'},{status:500})
  let succeeded=0,failed=0,blocked=0
  for(const j of (Array.isArray(jobs)?jobs:[]) as Job[]){
    const {data:ps,error:pe}=await ctx.supabaseAdmin.from('omega_provider_registry').select('provider_key,status').eq('id',j.provider_id).limit(1)
    const p=ps?.[0] as Provider|undefined
    const result=pe||!p?{status:'FAILED',errorCode:'provider_registry_unavailable',errorDetail:'Provider registry lookup failed.'}:await dispatch(p,j)
    const {error:ce}=await ctx.supabaseAdmin.rpc('omega_complete_provider_job',{p_job_id:j.id,p_status:result.status,p_external_job_id:(result as any).providerJobId??null,p_result:(result as any).result??null,p_error_code:(result as any).errorCode??null,p_error_message:(result as any).errorDetail??null,p_asset_patch:(result as any).assetPatch??null})
    if(ce)failed++; else if(result.status==='SUCCEEDED')succeeded++; else if(result.status==='BLOCKED_PROVIDER')blocked++; else failed++
  }
  return Response.json({ok:true,worker:WORKER_PREFIX,claimed:Array.isArray(jobs)?jobs.length:0,succeeded,failed,blocked})
})}