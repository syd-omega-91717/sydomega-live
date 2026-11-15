/* Ω LIFE — member-facing, read-only integration of canonical life primitives. */
(function(){
'use strict';
function set(id,text){var e=document.getElementById(id);if(e)e.textContent=text;}
function clear(e){if(e)e.replaceChildren();}
function add(parent,tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;parent.appendChild(e);return e;}
function client(){if(window.OmegaSB&&typeof window.OmegaSB.get==='function')return window.OmegaSB.get();return Promise.resolve(window.__omegaSb||null);}
function showUnavailable(reason){set('life-truth','UNAVAILABLE · '+reason);set('life-name','UNAVAILABLE');set('life-location','Sign in to load member-owned state.');set('mana-total','—');set('relearn-count','—');set('civilization-truth','UNAVAILABLE');}
async function boot(){
var sb;try{sb=await client();}catch(e){showUnavailable('DATABASE CLIENT UNAVAILABLE');return;}if(!sb){showUnavailable('DATABASE CLIENT UNAVAILABLE');return;}
var session;try{session=(await sb.auth.getSession()).data.session;}catch(e){showUnavailable('SESSION CHECK FAILED');return;}if(!session||!session.user){showUnavailable('SIGN IN REQUIRED');return;}
var uid=session.user.id;
var MANA_WINDOW_DAYS=30;
try{
var results=await Promise.all([
sb.from('profiles').select('display_name,country,sign,element,agent').eq('id',uid).maybeSingle(),
sb.from('task_completions').select('id,task_name,task,completed_at,points_earned').eq('user_id',uid).order('completed_at',{ascending:false}).limit(20),
sb.from('omega_platform_events').select('event_id,event_type,created_at,metadata').eq('actor_user_id',uid).order('created_at',{ascending:false}).limit(50),
sb.from('capability_registry').select('capability_id,capability_name,lifecycle_status,health_status').limit(100),
sb.from('evolution_events').select('id,axis,note,delta,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(20)
]);
var profile=results[0].data||null,tasks=results[1].data||[],events=results[2].data||[],caps=results[3].data||[],evolution=results[4].data||[];var reality=null;try{reality=await window.OmegaProductReality.member();}catch(e){reality=null;}
var errors=results.map(function(x){return x.error;}).filter(Boolean);
if(!profile){showUnavailable('MEMBER PROFILE UNAVAILABLE');return;}
var verifiedLearning=tasks.filter(function(x){return Number(x.points_earned||0)>0;});
var explicit=[profile.sign,profile.element,profile.agent].filter(Boolean);
/* One owner for the member-activity read: OmegaRelearnSigilMana.fetchMana. */
var manaRead=await window.OmegaRelearnSigilMana.fetchMana(sb,uid,MANA_WINDOW_DAYS);
var mana=manaRead.mana,manaErr=manaRead.failed;
set('life-truth',errors.length?'PARTIAL · '+errors.length+' source(s) unavailable':'LIVE + CALCULATED · CANONICAL MEMBER SOURCES');
set('life-name',profile.display_name||session.user.email||'MEMBER');
set('life-location',[profile.country,profile.sign,profile.element].filter(Boolean).join(' · ')||'Member-declared context unavailable');
var bars=document.getElementById('mana-bars');clear(bars);
if(!mana){set('mana-total','—');set('mana-source','UNAVAILABLE · could not read your '+manaErr.join(', ')+' activity. No value is shown rather than a guess.');}
else{set('mana-total',String(mana.total)+'/100');set('mana-source','Your last '+mana.windowDays+' days: '+mana.sources.activeDays+' active days · '+mana.sources.learningTasks+' learning · '+mana.sources.activeMissions+' active / '+mana.sources.completedMissions+' done missions. Fades without use.');
Object.keys(mana.components).forEach(function(k){var v=mana.components[k];var row=add(bars,'div','mana-row');add(row,'span',null,k);var track=add(row,'div','mana-track');var fill=add(track,'div','mana-fill');fill.style.width=(v===null?0:v)+'%';add(row,'span',null,v===null?'—':String(v));});
if(mana.unsourcedComponents.length)add(bars,'div','mana-note',mana.unsourcedComponents.join(', ')+' has no source yet: shown as —, never filled in. Mana grants no authority.');}
var sigil=window.OmegaRelearnSigilMana.createSigil({userId:uid,declaredTraits:explicit,verifiedMilestones:verifiedLearning.slice(0,20).map(function(x){return x.id;})});
var preview=document.getElementById('sigil-preview');clear(preview);add(preview,'span',null,'Ω');preview.title='Calculated sigil seed '+sigil.symbolSeed+' · visual only';set('sigil-note','CALCULATED · '+sigil.verifiedMilestones.length+' verified milestone(s) · visual representation only.');
set('relearn-count',String(verifiedLearning.length));
var list=document.getElementById('relearn-list');clear(list);verifiedLearning.slice(0,5).forEach(function(x){var item=add(list,'div','relearn-item');add(item,'b',null,'VERIFIED · '+(x.task_name||x.task||'LEARNING'));add(item,'span',null,x.completed_at?new Date(x.completed_at).toLocaleDateString():'date unavailable');});if(!verifiedLearning.length)add(list,'div','relearn-item',undefined);
var path=document.getElementById('civilization-path');clear(path);[['PERSON',profile.display_name||'MEMBER'],['PROJECT','USER-OWNED WORK'],['TASK',String(tasks.length)+' COMPLETIONS'],['SERVICE',String(caps.length)+' REGISTERED CAPABILITIES'],['CITY','UNAVAILABLE'],['REGION','UNAVAILABLE'],['COUNTRY',profile.country||'UNAVAILABLE'],['WORLD','OMEGA WORLD']].forEach(function(x){var n=add(path,'div','civ-node');add(n,'b',null,x[0]);add(n,'span',null,x[1]);});
set('civilization-truth',profile.country?'LIVE + USER-CREATED':'PARTIAL');
var realityGrid=document.getElementById('product-reality-grid');clear(realityGrid);if(reality){[['EVENTS',reality.event_count],['EVIDENCE',reality.evidence_count],['TASKS',reality.task_completion_count],['MISSIONS',reality.mission_count],['ACTIVE MISSIONS',reality.active_mission_count],['COMPLETED MISSIONS',reality.completed_mission_count],['AI MEMORY',reality.memory_count],['EMBEDDINGS',reality.embedding_count],['KNOWLEDGE DOCS',reality.knowledge_document_count],['LISTINGS',reality.marketplace_listing_count],['ORDERS',reality.marketplace_order_count]].forEach(function(x){var card=add(realityGrid,'div');add(card,'b',null,x[0]);add(card,'span',null,String(x[1]));});set('product-reality-truth','LIVE · OBSERVED');}else{add(realityGrid,'div',null,'Product reality source unavailable.');set('product-reality-truth','UNAVAILABLE');}
void events;void evolution;
}catch(e){showUnavailable('SOURCE READ FAILED');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();