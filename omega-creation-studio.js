/* Ω SYD OMEGA 91717 — governed Creation Studio
   Uses public RPCs for mutation. Never writes governed creation tables directly. */
import { createClient } from '/vendor/supabase-js.js';

const SUPABASE_URL='https://ydqhzvvoyufiiqvzcjns.supabase.co';
const SUPABASE_KEY='sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q';
const sb=window.__omegaSb||(window.__omegaSb=createClient(SUPABASE_URL,SUPABASE_KEY));
const $=id=>document.getElementById(id);
const state={user:null,projects:[],assets:[],providers:[],jobs:[]};

function esc(v){const m={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};return String(v??'').replace(/[&<>"']/g,c=>m[c]);}
function msg(id,text,kind='note'){$(id).className=kind;$(id).textContent=text;}
function err(e){return e?.message||e?.details||e?.hint||'Operation failed';}
function statusClass(s){return ['FAILED','CANCELLED','DISABLED','DEGRADED'].includes(s)?'bad':['UNCONFIGURED','DESIGNED','DRAFT','QUEUED'].includes(s)?'warn':'';}
function render(){
  $('k-projects').textContent=state.projects.length;
  $('k-assets').textContent=state.assets.length;
  $('k-jobs').textContent=state.jobs.length;
  $('k-ready').textContent=state.assets.filter(a=>a.status==='READY'&&a.truth_state==='LIVE').length;
  const ps=$('projects'); ps.innerHTML=state.projects.length?state.projects.map(p=>'<div class="row"><div class="row-head"><div class="row-name">'+esc(p.name)+'</div><span class="status '+statusClass(p.status)+'">'+esc(p.status)+'</span></div><div class="meta">'+esc(p.project_type)+' · '+esc(p.truth_state)+' · '+esc(p.id)+'</div><div class="note">'+esc(p.description||'No description')+'</div></div>').join(''):'<div class="empty">NO PROJECTS YET</div>';
  const as=$('assets'); as.innerHTML=state.assets.length?state.assets.map(a=>'<div class="row"><div class="row-head"><div class="row-name">'+esc(a.title)+'</div><span class="status '+statusClass(a.status)+'">'+esc(a.status)+'</span></div><div class="meta">'+esc(a.asset_type)+' · '+esc(a.truth_state)+' · '+esc(a.provider||'NO PROVIDER')+'</div><div class="note">'+esc(a.prompt||'No prompt supplied')+'</div><div class="actions"><button type="button" data-submit-job="'+esc(a.id)+'" '+(a.status!=='DESIGNED'?'disabled':'')+'>SUBMIT PROVIDER JOB</button></div></div>').join(''):'<div class="empty">NO ASSETS YET</div>';
  const pr=$('providers'); pr.innerHTML=state.providers.length?state.providers.map(p=>'<div class="row"><div class="row-head"><div class="row-name">'+esc(p.display_name)+'</div><span class="status '+statusClass(p.status)+'">'+esc(p.status)+'</span></div><div class="meta">'+esc(p.provider_key)+' · '+esc(p.adapter_kind)+'</div><div class="note">Capabilities: '+esc(Array.isArray(p.capabilities)?p.capabilities.join(', '):JSON.stringify(p.capabilities))+'</div></div>').join(''):'<div class="empty">NO PROVIDERS REGISTERED</div>';
  const js=$('jobs'); js.innerHTML=state.jobs.length?state.jobs.map(j=>'<div class="row"><div class="row-head"><div class="row-name">'+esc(j.capability)+'</div><span class="status '+statusClass(j.status)+'">'+esc(j.status)+'</span></div><div class="meta">'+esc(j.id)+' · '+esc(j.provider_id)+'</div><div class="note">'+esc(j.error_message||'No provider error recorded')+'</div></div>').join(''):'<div class="empty">NO PROVIDER JOBS YET</div>';
  const sel=$('asset-project'); sel.innerHTML=state.projects.length?state.projects.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' · '+esc(p.status)+'</option>').join(''):'<option value="">CREATE A PROJECT FIRST</option>';
  document.querySelectorAll('[data-submit-job]').forEach(b=>b.addEventListener('click',()=>submitJob(b.dataset.submitJob)));
}
async function load(){
  const session=(await sb.auth.getSession()).data.session;
  if(!session){$('live-state').textContent='AUTH REQUIRED';location.replace('/account.html');return;}
  state.user=session.user;
  $('live-state').textContent='AUTHENTICATED';
  const [projects,assets,providers,jobs]=await Promise.all([
    sb.from('omega_creative_projects').select('id,name,description,project_type,status,truth_state,created_at,updated_at').order('created_at',{ascending:false}),
    sb.from('omega_creative_assets').select('id,project_id,asset_type,title,prompt,provider,provider_asset_id,status,truth_state,source_uri,content_sha256,license,created_at,updated_at').order('created_at',{ascending:false}),
    sb.from('omega_provider_registry').select('id,provider_key,display_name,adapter_kind,capabilities,status,metadata').order('display_name'),
    sb.from('omega_provider_jobs').select('id,provider_id,asset_id,capability,status,external_job_id,error_code,error_message,created_at,updated_at').order('created_at',{ascending:false}).limit(100)
  ]);
  for(const r of [projects,assets,providers,jobs])if(r.error)throw r.error;
  state.projects=projects.data||[];state.assets=assets.data||[];state.providers=providers.data||[];state.jobs=jobs.data||[];
  render();
}
async function createProject(e){
  e.preventDefault();msg('project-message','CREATING…');
  const {error}=await sb.rpc('omega_create_creative_project',{p_name:$('project-name').value,p_description:$('project-description').value||null,p_project_type:$('project-type').value,p_metadata:{}});
  if(error){msg('project-message',err(error),'error');return;}
  $('project-form').reset();msg('project-message','DRAFT PROJECT CREATED.','ok');await load();
}
async function createAsset(e){
  e.preventDefault();msg('asset-message','CREATING…');
  const {error}=await sb.rpc('omega_create_creative_asset',{p_project_id:$('asset-project').value,p_parent_asset_id:null,p_asset_type:$('asset-type').value,p_title:$('asset-title').value,p_prompt:$('asset-prompt').value||null,p_license:null,p_metadata:{}});
  if(error){msg('asset-message',err(error),'error');return;}
  $('asset-form').reset();msg('asset-message','DESIGNED ASSET CREATED.','ok');await load();
}
async function submitJob(assetId){
  const asset=state.assets.find(a=>a.id===assetId);if(!asset)return;
  const provider=state.providers.find(p=>Array.isArray(p.capabilities)&&p.capabilities.includes(asset.asset_type));
  if(!provider){alert('No registered provider currently advertises this asset capability.');return;}
  if(provider.status!=='READY'){alert(provider.display_name+' is '+provider.status+'. No job was submitted and no fake success was recorded.');return;}
  const {error}=await sb.rpc('omega_submit_provider_job',{p_provider_key:provider.provider_key,p_capability:asset.asset_type,p_asset_id:asset.id,p_request:{asset_type:asset.asset_type,prompt:asset.prompt||'',title:asset.title}});
  if(error){alert(err(error));return;}
  await load();
}
$('project-form').addEventListener('submit',createProject);
$('asset-form').addEventListener('submit',createAsset);
load().catch(e=>{$('live-state').textContent='PARTIAL';$('projects').innerHTML='<div class="empty error">'+esc(err(e))+'</div>';});
