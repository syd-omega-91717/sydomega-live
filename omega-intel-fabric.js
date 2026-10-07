/* Ω INTEL FABRIC GATEWAY — read-only composition over existing production surfaces. */
(function(){
'use strict';
if(window.__omegaIntelFabricActive)return;
window.__omegaIntelFabricActive=true;

function el(id){return document.getElementById(id);}
function client(){
  if(window.OmegaSB&&typeof window.OmegaSB.get==='function')return window.OmegaSB.get();
  return Promise.resolve(window.__omegaSb||null);
}
function set(id,state,text){
  var n=el(id);if(!n)return;
  n.dataset.state=state;n.textContent=text;
}
function clear(n){if(n)n.replaceChildren();}
function add(parent,tag,cls,text){
  var n=document.createElement(tag);
  if(cls)n.className=cls;
  if(text!==undefined)n.textContent=String(text);
  parent.appendChild(n);return n;
}
function card(parent,title,detail,state){
  var c=add(parent,'article','intel-live-card');
  add(c,'span','intel-live-state',state);
  add(c,'strong',null,title);
  add(c,'small',null,detail);
  return c;
}
function truthBadge(state){
  return state==='LIVE'?'LIVE':state==='EMPTY'?'EMPTY':state==='UNAVAILABLE'?'UNAVAILABLE':'PARTIAL';
}
async function load(){
  var host=el('intel-live-grid');
  if(!host)return;
  clear(host);
  var sb;
  try{sb=await client();}catch(e){set('intel-live-status','UNAVAILABLE','UNAVAILABLE · DATABASE CLIENT FAILED');return;}
  if(!sb){set('intel-live-status','UNAVAILABLE','UNAVAILABLE · DATABASE CLIENT UNAVAILABLE');return;}
  var session;
  try{session=(await sb.auth.getSession()).data.session;}catch(e){set('intel-live-status','UNAVAILABLE','UNAVAILABLE · SESSION CHECK FAILED');return;}
  if(!session||!session.user){
    set('intel-live-status','UNAVAILABLE','UNAVAILABLE · SIGN IN REQUIRED');
    [
      ['KNOWLEDGE LOOM','Member-scoped source retrieval requires authentication.'],
      ['EVIDENCE','Platform evidence is not displayed without a verified session.'],
      ['EVENT FABRIC','Member-scoped event inspection requires authentication.'],
      ['INTELLIGENCE','Provider-backed intelligence is not implied by this workspace.']
    ].forEach(function(x){card(host,x[0],x[1],'UNAVAILABLE');});
    return;
  }

  var queries=await Promise.all([
    sb.from('omega_member_knowledge_loom').select('source_id',{count:'exact',head:true}),
    sb.from('omega_platform_evidence').select('id',{count:'exact',head:true}),
    sb.from('omega_platform_events').select('id',{count:'exact',head:true}).eq('actor_user_id',session.user.id),
    sb.from('omega_platform_product_reality').select('*').maybeSingle()
  ]);

  var loom=queries[0],evidence=queries[1],events=queries[2],reality=queries[3];
  var failed=queries.filter(function(q){return q.error;}).length;
  var product=reality.data||null;

  if(failed===queries.length){
    set('intel-live-status','UNAVAILABLE','UNAVAILABLE · INTELLIGENCE SUBSTRATE COULD NOT BE READ');
    return;
  }
  set('intel-live-status',failed?'PARTIAL':'LIVE',
    failed?'PARTIAL · SOME INTELLIGENCE SOURCES UNAVAILABLE':'LIVE · READ-ONLY INTELLIGENCE SUBSTRATE');

  function result(q,emptyLabel){
    if(q.error)return ['—','UNAVAILABLE'];
    return [String(q.count||0),(q.count||0)>0?'LIVE':emptyLabel];
  }
  var a=result(loom,'EMPTY'),b=result(evidence,'EMPTY'),c=result(events,'EMPTY');

  card(host,'KNOWLEDGE LOOM',a[0]+' member-visible source records · lexical retrieval only; semantic embeddings are not inferred',truthBadge(a[1]));
  card(host,'PLATFORM EVIDENCE',b[0]+' persisted capability-evidence records · global scope, not member ownership',truthBadge(b[1]));
  card(host,'YOUR EVENT FABRIC',c[0]+' persisted member-scoped canonical events · no legacy-event equivalence assumed',truthBadge(c[1]));

  if(product){
    var liveCatalog=product.active_mission_catalog_count;
    var capabilities=product.capability_count;
    card(host,'PRODUCT REALITY',String(liveCatalog??'—')+' active missions · '+String(capabilities??'—')+' registered capabilities · observational only','LIVE');
  }else{
    card(host,'PRODUCT REALITY','The existing production reality projection returned no readable row. No zeros are fabricated.','UNAVAILABLE');
  }

  var qInput=el('intel-query'),out=el('intel-query-results');
  if(qInput&&!qInput.dataset.bound){
    qInput.dataset.bound='1';
    qInput.addEventListener('input',function(){
      clearTimeout(qInput._t);
      qInput._t=setTimeout(function(){search(qInput.value);},220);
    });
  }
  if(qInput&&qInput.value.trim())search(qInput.value);
  else if(out){clear(out);add(out,'p','intel-query-empty','Enter a term to query member-visible Knowledge Loom records.');}
}
async function search(term){
  var out=el('intel-query-results');
  if(!out)return;
  clear(out);
  term=(term||'').trim();
  if(!term){add(out,'p','intel-query-empty','Enter a term to query member-visible Knowledge Loom records.');return;}
  var sb;
  try{sb=await client();}catch(e){add(out,'p','intel-query-empty','UNAVAILABLE · database client failed.');return;}
  if(!sb){add(out,'p','intel-query-empty','UNAVAILABLE · database client unavailable.');return;}
  var session;
  try{session=(await sb.auth.getSession()).data.session;}catch(e){add(out,'p','intel-query-empty','UNAVAILABLE · session check failed.');return;}
  if(!session||!session.user){add(out,'p','intel-query-empty','UNAVAILABLE · sign in to query member-visible knowledge.');return;}
  var needle=term.replace(/[%,]/g,' ').slice(0,120);
  var q=await sb.from('omega_member_knowledge_loom')
    .select('source_id,source_kind,title,excerpt,truth_state,source_ref,observed_at,verified')
    .or('title.ilike.%'+needle+'%,excerpt.ilike.%'+needle+'%,source_ref.ilike.%'+needle+'%')
    .order('observed_at',{ascending:false}).limit(12);
  if(q.error){add(out,'p','intel-query-empty','PARTIAL · Knowledge Loom query failed.');return;}
  if(!q.data||!q.data.length){add(out,'p','intel-query-empty','NO VERIFIED MATCHES IN MEMBER-VISIBLE KNOWLEDGE LOOM.');return;}
  q.data.forEach(function(row){
    var c=add(out,'article','intel-result');
    add(c,'span','intel-result-state',(row.truth_state||'UNVERIFIED')+' · '+(row.verified?'VERIFIED':'PROVENANCE UNVERIFIED'));
    add(c,'strong',null,row.title||'UNTITLED SOURCE');
    add(c,'p',null,row.excerpt||'No excerpt available.');
    add(c,'code',null,row.source_ref||'—');
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
window.OmegaIntelFabric=Object.freeze({refresh:load,search:search});
})();