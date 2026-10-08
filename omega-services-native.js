/* Ω SYD OMEGA 91717 — SERVICES native capability projection
 * Reconciles the presentation catalog with the canonical capability_registry.
 * Read-only: no lifecycle, health, version or service mutation.
 */
import { createClient } from '/vendor/supabase-js.js';

const URL='https://ydqhzvvoyufiiqvzcjns.supabase.co';
const KEY='sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q';
const sb=window.__omegaSb||(window.__omegaSb=createClient(URL,KEY));

const DECLARED=['GATEWAY','AUTH','USER','MATRIX','PAYMENT','NOTIFICATION','CHAT','MEDIA','GAMING','NFT','SEARCH','HERITAGE','INVESTMENT','HOROSCOPE','NEWS','CONSULTANCY','PUBLISHING','BLOCKCHAIN','KYC','ANALYTICS','ACADEMY'];

function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
function state(label,detail,kind){return '<div class="services-native-state services-native-'+kind.toLowerCase()+'"><b>'+esc(label)+'</b><span>'+esc(detail)+'</span></div>';}
function render(el,m){
  el.innerHTML='<div class="services-native-head"><div><div class="services-native-kicker">CANONICAL CAPABILITY RECONCILIATION</div><h2>RUNTIME SERVICE TRUTH</h2></div><span class="services-native-mode">READ-ONLY</span></div>'+
    '<div class="services-native-grid">'+
    state('REGISTRY',m.registry,m.registryKind)+
    state('AUTHORITY',m.authority,m.authorityKind)+
    state('OBSERVED CAPABILITIES',m.observed,m.observedKind)+
    state('DECLARED CATALOG',DECLARED.length+' presentation services remain in the UI catalog; this is not proof that every service is independently deployed.', 'CALCULATED')+
    '</div>'+
    '<div class="services-native-list">'+(m.rows||[]).map(function(x){return '<div><strong>'+esc(x.name)+'</strong><span>'+esc(x.status)+'</span></div>';}).join('')+'</div>'+
    '<div class="services-native-boundary"><strong>TRUTH BOUNDARY</strong> The service catalog is presentation/design inventory. LIVE capability status is derived only from the canonical capability_registry and authenticated access. Missing registry rows are not converted into LIVE services.</div>';
}

async function load(){
  const el=document.querySelector('[data-services-native-state]');
  if(!el)return;
  try{
    const sess=(await sb.auth.getSession()).data.session;
    if(!sess){render(el,{registry:'Authentication required.',registryKind:'UNAVAILABLE',authority:'No authenticated runtime context.',authorityKind:'UNAVAILABLE',observed:'Capability registry not queried.',observedKind:'UNAVAILABLE',rows:[]});return;}
    const p=await sb.from('profiles').select('is_owner,access_approved').eq('id',sess.user.id).maybeSingle();
    if(p.error){render(el,{registry:'Profile authorization state unavailable.',registryKind:'UNAVAILABLE',authority:'Authorization cannot be verified.',authorityKind:'UNAVAILABLE',observed:'Capability registry not queried.',observedKind:'UNAVAILABLE',rows:[]});return;}
    const authorized=!!(p.data&&(p.data.is_owner||p.data.access_approved));
    if(!authorized){render(el,{registry:'Authenticated but not approved for governance telemetry.',registryKind:'EMPTY',authority:'Approved access is not present.',authorityKind:'EMPTY',observed:'Capability registry is restricted to the governed access boundary.',observedKind:'EMPTY',rows:[]});return;}
    const q=await sb.from('capability_registry').select('capability_id,capability_name,lifecycle_status,health_status,version').order('capability_name',{ascending:true}).limit(50);
    if(q.error){render(el,{registry:'Canonical capability registry could not be read.',registryKind:'UNAVAILABLE',authority:'Authenticated access is verified.',authorityKind:'LIVE',observed:'Registry query failed; no service status is inferred.',observedKind:'UNAVAILABLE',rows:[]});return;}
    const rows=(q.data||[]).map(function(x){return {name:x.capability_name||x.capability_id,status:[x.lifecycle_status||'UNKNOWN',x.health_status||'UNKNOWN',x.version?'v'+x.version:'NO VERSION'].join(' · ')};});
    render(el,{registry:'Canonical capability_registry is reachable.',registryKind:'LIVE',authority:'Authenticated approved access is verified.',authorityKind:'LIVE',observed:rows.length+' canonical capability records observed.',observedKind:rows.length?'LIVE':'EMPTY',rows});
  }catch(e){
    console.warn('services native state unavailable:',e);
    render(el,{registry:'Capability registry unavailable.',registryKind:'UNAVAILABLE',authority:'Runtime authorization unavailable.',authorityKind:'UNAVAILABLE',observed:'No authoritative service status is claimed.',observedKind:'UNAVAILABLE',rows:[]});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
