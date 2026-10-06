/* Ω KNOWLEDGE LOOM — provenance-first member reality surface. */
(function(){
'use strict';
if(window.__omegaKnowledgeLoomActive)return;
window.__omegaKnowledgeLoomActive=true;
function el(id){return document.getElementById(id);}
function client(){if(window.OmegaSB&&typeof window.OmegaSB.get==='function')return window.OmegaSB.get();return Promise.resolve(window.__omegaSb||null);}
function clear(node){if(node)node.replaceChildren();}
function add(parent,tag,cls,value){
  var n=document.createElement(tag);
  if(cls)n.className=cls;
  if(value!==undefined)n.textContent=String(value);
  parent.appendChild(n);
  return n;
}
function badge(parent,label){return add(parent,'span','loom-badge loom-'+String(label).toLowerCase().replace(/[^a-z0-9]+/g,'-'),label);}
function card(parent,row){
  var c=add(parent,'article','loom-card');
  var head=add(c,'div','loom-card-head');
  badge(head,row.source_kind.replace(/_/g,' ').toUpperCase());
  badge(head,row.truth_state);
  add(c,'h3','loom-title',row.title||'UNTITLED SOURCE');
  add(c,'p','loom-excerpt',row.excerpt||'No excerpt available.');
  var meta=add(c,'div','loom-meta');
  add(meta,'span',null,'OBSERVED '+new Date(row.observed_at).toLocaleString());
  add(meta,'span',null,row.verified?'VERIFIED':'PROVENANCE UNVERIFIED');
  var ref=row.source_ref||'—';
  var refNode=add(c,'code','loom-ref',ref);
  refNode.title='Canonical source reference';
  var details=add(c,'details','loom-details');
  add(details,'summary',null,'SOURCE METADATA');
  add(details,'pre','loom-json',JSON.stringify(row.metadata||{},null,2));
}
async function load(){
  var truth=el('loom-truth'),grid=el('loom-grid'),empty=el('loom-empty'),count=el('loom-count');
  if(!truth||!grid)return;
  clear(grid);if(empty)empty.hidden=true;
  var sb;try{sb=await client();}catch(e){truth.textContent='UNAVAILABLE · DATABASE CLIENT FAILED';return;}
  if(!sb){truth.textContent='UNAVAILABLE · DATABASE CLIENT UNAVAILABLE';return;}
  var session;try{session=(await sb.auth.getSession()).data.session;}catch(e){truth.textContent='UNAVAILABLE · SESSION CHECK FAILED';return;}
  if(!session||!session.user){truth.textContent='UNAVAILABLE · SIGN IN REQUIRED';return;}
  var q=(el('loom-query')||{}).value||'';
  var kind=(el('loom-kind')||{}).value||'ALL';
  var query=sb.from('omega_member_knowledge_loom')
    .select('source_id,source_kind,title,excerpt,truth_state,source_ref,observed_at,verified,metadata')
    .order('observed_at',{ascending:false})
    .limit(100);
  if(kind!=='ALL')query=query.eq('source_kind',kind);
  if(q.trim()){
    var needle=q.trim().replace(/[%,]/g,' ');
    query=query.or('title.ilike.%'+needle+'%,excerpt.ilike.%'+needle+'%,source_ref.ilike.%'+needle+'%');
  }
  var result=await query;
  if(result.error){truth.textContent='PARTIAL · KNOWLEDGE SOURCE QUERY FAILED';return;}
  var rows=Array.isArray(result.data)?result.data:[];
  truth.textContent=rows.length?'LIVE · MEMBER-SCOPED PROVENANCE':'LIVE · NO MATCHING RECORDS';
  if(count)count.textContent=String(rows.length);
  rows.forEach(function(row){card(grid,row);});
  if(!rows.length&&empty)empty.hidden=false;
}
function wire(){
  var q=el('loom-query'),kind=el('loom-kind');
  if(q)q.addEventListener('input',function(){clearTimeout(wire._t);wire._t=setTimeout(load,220);});
  if(kind)kind.addEventListener('change',load);
  document.addEventListener('omega:knowledge-loom-refresh',load);
  load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
window.OmegaKnowledgeLoom=Object.freeze({refresh:load});
})();