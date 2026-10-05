/* Ω DATA OBSERVATORY — read-only production reality surface. */
(function(){
'use strict';
function el(id){return document.getElementById(id);}
function text(id,v){var e=el(id);if(e)e.textContent=v;}
function clear(e){if(e)e.replaceChildren();}
function card(parent,label,value,kind,note){var c=document.createElement('article');c.className='obs-card';var b=document.createElement('b');b.textContent=label;c.appendChild(b);var strong=document.createElement('strong');strong.textContent=String(value);c.appendChild(strong);var s=document.createElement('span');s.textContent=kind;c.appendChild(s);if(note){var n=document.createElement('small');n.textContent=note;c.appendChild(n);}parent.appendChild(c);}
function client(){if(window.OmegaSB&&typeof window.OmegaSB.get==='function')return window.OmegaSB.get();return Promise.resolve(window.__omegaSb||null);}
var PLATFORM=[['ACTIVE MISSIONS','active_mission_catalog_count'],['CAPABILITIES','capability_count'],['PLATFORM EVENTS','platform_event_count'],['PLATFORM EVIDENCE','platform_evidence_count'],['KNOWLEDGE DOCUMENTS','knowledge_document_count'],['MARKETPLACE LISTINGS','marketplace_listing_count'],['MARKETPLACE ORDERS','marketplace_order_count'],['STRIPE WEBHOOK EVENTS','stripe_webhook_event_count']];
var MEMBER=[['EVENTS','event_count'],['EVIDENCE','evidence_count'],['TASK COMPLETIONS','task_completion_count'],['MISSIONS','mission_count'],['ACTIVE MISSIONS','active_mission_count'],['COMPLETED MISSIONS','completed_mission_count'],['AI MEMORY','memory_count'],['EMBEDDINGS','embedding_count'],['KNOWLEDGE SPACES','knowledge_space_count'],['KNOWLEDGE DOCUMENTS','knowledge_document_count'],['LISTINGS','marketplace_listing_count'],['ORDERS','marketplace_order_count']];
async function boot(){
var sb;try{sb=await client();}catch(e){text('obs-truth','UNAVAILABLE · DATABASE CLIENT FAILED');return;}
if(!sb){text('obs-truth','UNAVAILABLE · DATABASE CLIENT UNAVAILABLE');return;}
var session;try{session=(await sb.auth.getSession()).data.session;}catch(e){text('obs-truth','UNAVAILABLE · SESSION CHECK FAILED');return;}
if(!session||!session.user){text('obs-truth','UNAVAILABLE · SIGN IN REQUIRED');text('member-truth','UNAVAILABLE');return;}
var results=await Promise.all([
sb.from('omega_platform_product_reality').select('*').maybeSingle(),
sb.from('omega_member_product_reality').select('*').maybeSingle()
]);
var p=results[0].data,m=results[1].data;
if(results[0].error||results[1].error){text('obs-truth','PARTIAL · ONE OR MORE REALITY SOURCES FAILED');}
else{text('obs-truth','LIVE · AUTHORITATIVE READ MODELS');}
var pg=el('platform-grid'),mg=el('member-grid'),gg=el('gap-grid');clear(pg);clear(mg);clear(gg);
if(p){PLATFORM.forEach(function(x){card(pg,x[0],p[x[1]],Number(p[x[1]])>0?'OBSERVED':'OBSERVED ZERO','canonical platform read model');});
var observed=PLATFORM.filter(function(x){return Number(p[x[1]])>0;}).length;
var coverage=((observed/PLATFORM.length)*100).toFixed(1);
card(pg,'OBSERVED DOMAIN COVERAGE',coverage+'%','CALCULATED','non-zero tracked domains / '+PLATFORM.length+' tracked domains');
text('obs-updated',new Date().toLocaleString());
var gaps=PLATFORM.filter(function(x){return Number(p[x[1]])===0;});
gaps.forEach(function(x){card(gg,x[0],'0','GAP','activate only with authoritative provider/data evidence');});
if(!gaps.length)card(gg,'PLATFORM COVERAGE','No tracked zero domains','CALCULATED','continue verification and freshness checks');
}else{card(pg,'PLATFORM REALITY','UNAVAILABLE','UNAVAILABLE','read model unavailable');}
if(m){MEMBER.forEach(function(x){card(mg,x[0],m[x[1]],Number(m[x[1]])>0?'OBSERVED':'OBSERVED ZERO','member-scoped canonical read model');});text('member-truth','LIVE · MEMBER-SCOPED');}
else{card(mg,'MEMBER REALITY','UNAVAILABLE','UNAVAILABLE','member read model unavailable');text('member-truth','UNAVAILABLE');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();