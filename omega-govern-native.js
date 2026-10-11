/* Ω GOVERN NATIVE — read-only governance projection over canonical production data. */
(function(root){
'use strict';

function client(){
  if(root.OmegaSB&&typeof root.OmegaSB.get==='function') return root.OmegaSB.get();
  return Promise.resolve(root.__omegaSb||null);
}
function state(data, fallback){
  return data===null ? fallback : (Array.isArray(data)&&data.length ? 'LIVE' : 'EMPTY');
}
async function session(){
  var sb=await client();
  if(!sb) throw new Error('DATABASE_CLIENT_UNAVAILABLE');
  var s=(await sb.auth.getSession()).data.session;
  if(!s||!s.user) throw new Error('SIGN_IN_REQUIRED');
  return {sb:sb,user:s.user};
}
async function count(sb, table){
  var r=await sb.from(table).select('*',{count:'exact',head:true});
  if(r.error) throw r.error;
  return Number(r.count||0);
}
async function readRows(sb, table, columns, limit){
  var r=await sb.from(table).select(columns).limit(limit||25);
  if(r.error) throw r.error;
  return r.data||[];
}
async function run(){
  var x=await session(), sb=x.sb, uid=x.user.id;
  var profile=await sb.from('profiles').select('is_owner,access_approved').eq('id',uid).maybeSingle();
  if(profile.error) throw profile.error;
  var p=profile.data||{};
  var out={
    truth_state:'LIVE',
    authorization:{truth_state:'LIVE',authenticated:true,access_approved:p.access_approved===true,is_owner:p.is_owner===true},
    governance_policies:{truth_state:'UNAVAILABLE',count:null},
    capabilities:{truth_state:'UNAVAILABLE',count:null,rows:[]},
    feature_flags:{truth_state:'UNAVAILABLE',count:null},
    data_lineage:{truth_state:'UNAVAILABLE',count:null},
    security_policies:{truth_state:'UNAVAILABLE',count:null},
    audit_logs:{truth_state:'UNAVAILABLE',count:null}
  };
  var jobs=[
    ['governance_policies','governance_policies',function(n){out.governance_policies={truth_state:n?'LIVE':'EMPTY',count:n};}],
    ['capabilities','capability_registry',async function(n){var rows=await readRows(sb,'capability_registry','capability_id,capability_name,lifecycle_status,health_status,version',50);out.capabilities={truth_state:rows.length?'LIVE':'EMPTY',count:n,rows:rows};}],
    ['feature_flags','feature_flags',function(n){out.feature_flags={truth_state:n?'LIVE':'EMPTY',count:n};}],
    ['data_lineage','data_lineage',function(n){out.data_lineage={truth_state:n?'LIVE':'EMPTY',count:n};}],
    ['security_policies','security_policies',function(n){out.security_policies={truth_state:n?'LIVE':'EMPTY',count:n};}],
    ['audit_logs','audit_logs',function(n){out.audit_logs={truth_state:n?'LIVE':'EMPTY',count:n};}]
  ];
  for(var i=0;i<jobs.length;i++){
    try{
      var n=await count(sb,jobs[i][1]);
      await jobs[i][2](n);
    }catch(e){
      out[jobs[i][0]]={truth_state:'UNAVAILABLE',count:null,error:String(e&&e.message||e)};
    }
  }
  out.truth_state='LIVE';
  return out;
}
function esc(v){return String(v==null?'—':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function render(data){
  var rootEl=document.getElementById('govern-native-state');
  if(!rootEl)return;
  var a=data.authorization||{};
  var rows=(data.capabilities&&data.capabilities.rows)||[];
  var cards=[
    ['AUTHORIZATION',a.is_owner?'OWNER · AUTHORIZED':(a.access_approved?'APPROVED MEMBER':'AUTHENTICATED'),a.truth_state],
    ['POLICIES',data.governance_policies.count,data.governance_policies.truth_state],
    ['CAPABILITIES',data.capabilities.count,data.capabilities.truth_state],
    ['FEATURE FLAGS',data.feature_flags.count,data.feature_flags.truth_state],
    ['DATA LINEAGE',data.data_lineage.count,data.data_lineage.truth_state],
    ['SECURITY POLICIES',data.security_policies.count,data.security_policies.truth_state],
    ['AUDIT LOGS',data.audit_logs.count,data.audit_logs.truth_state]
  ];
  rootEl.innerHTML='<div class="native-grid">'+cards.map(function(c){return '<div class="native-card"><b>'+esc(c[1])+'</b><span>'+esc(c[0])+'</span><em>'+esc(c[2])+'</em></div>';}).join('')+'</div>'+
    '<div class="native-capabilities"><h3>CANONICAL CAPABILITY REGISTRY</h3>'+
    (rows.length?rows.map(function(r){return '<div class="native-row"><strong>'+esc(r.capability_name)+'</strong><span>'+esc(r.lifecycle_status)+'</span><span>'+esc(r.health_status)+'</span><small>'+esc(r.version)+'</small></div>';}).join(''):'<p>EMPTY / UNAVAILABLE FOR THIS AUTHORIZATION CONTEXT</p>')+
    '</div><p class="native-boundary">Read-only projection. Counts are observations, not health claims, compliance certification, deployment status, financial KPIs, or provider readiness.</p>';
}
root.OmegaGovernNative={load:run,render:render};
})(globalThis);
