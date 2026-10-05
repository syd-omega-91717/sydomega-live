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
try{
var results=await Promise.all([
sb.from('profiles').select('display_name,country,sign,element,agent').eq('id',uid).maybeSingle(),
sb.from('task_completions').select('id,task_name,task,completed_at,points_earned').eq('user_id',uid).order('completed_at',{ascending:false}).limit(20),
sb.from('omega_platform_events').select('event_id,event_type,created_at,metadata').eq('actor_user_id',uid).order('created_at',{ascending:false}).limit(50),
sb.from('capability_registry').select('capability_id,capability_name,lifecycle_status,health_status').limit(100),
sb.from('omega_member_mission_state').select('status').eq('user_id',uid).limit(100),
sb.from('evolution_events').select('id,axis,note,delta,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(20)
]);
var profile=results[0].data||null,tasks=results[1].data||[],events=results[2].data||[],caps=results[3].data||[],missions=results[4].data||[],evolution=results[5].data||[];
var errors=results.map(function(x){return x.error;}).filter(Boolean);
if(!profile){showUnavailable('MEMBER PROFILE UNAVAILABLE');return;}
var verifiedLearning=tasks.filter(function(x){return Number(x.points_earned||0)>0;});
var activeMissions=missions.filter(function(x){return x.status==='ACTIVE'||x.status==='IN_PROGRESS';});
var explicit=[profile.sign,profile.element,profile.agent].filter(Boolean);
var mana=window.OmegaRelearnSigilMana.calculateMana({userId:uid,verifiedCapabilities:caps.filter(function(x){return x.lifecycle_status==='ACTIVE'||x.health_status==='HEALTHY';}),activeMissions:activeMissions,verifiedLearning:verifiedLearning,explicitPreferences:explicit,systemCapacity:{capabilities:caps.length}});
set('life-truth',errors.length?'PARTIAL · '+errors.length+' source(s) unavailable':'LIVE + CALCULATED · CANONICAL MEMBER SOURCES');
set('life-name',profile.display_name||session.user.email||'MEMBER');
set('life-location',[profile.country,profile.sign,profile.element].filter(Boolean).join(' · ')||'Member-declared context unavailable');
set('mana-total',String(mana.total)+'/100');set('mana-source','Sources: '+mana.sources.verifiedCapabilities+' verified capabilities · '+mana.sources.activeMissions+' active missions · '+mana.sources.verifiedLearning+' learning signals · '+mana.sources.explicitPreferences+' explicit profile signals.');
var bars=document.getElementById('mana-bars');clear(bars);
Object.keys(mana.components).forEach(function(k){var row=add(bars,'div','mana-row');add(row,'span',null,k);var track=add(row,'div','mana-track');var fill=add(track,'div','mana-fill');fill.style.width=mana.components[k]+'%';add(row,'span',null,String(mana.components[k]));});
var sigil=window.OmegaRelearnSigilMana.createSigil({userId:uid,declaredTraits:explicit,verifiedMilestones:verifiedLearning.slice(0,20).map(function(x){return x.id;})});
var preview=document.getElementById('sigil-preview');clear(preview);add(preview,'span',null,'Ω');preview.title='Calculated sigil seed '+sigil.symbolSeed+' · visual only';set('sigil-note','CALCULATED · '+sigil.verifiedMilestones.length+' verified milestone(s) · visual representation only.');
set('relearn-count',String(verifiedLearning.length));
var list=document.getElementById('relearn-list');clear(list);verifiedLearning.slice(0,5).forEach(function(x){var item=add(list,'div','relearn-item');add(item,'b',null,'VERIFIED · '+(x.task_name||x.task||'LEARNING'));add(item,'span',null,x.completed_at?new Date(x.completed_at).toLocaleDateString():'date unavailable');});if(!verifiedLearning.length)add(list,'div','relearn-item',undefined);
var path=document.getElementById('civilization-path');clear(path);[['PERSON',profile.display_name||'MEMBER'],['PROJECT','USER-OWNED WORK'],['TASK',String(tasks.length)+' COMPLETIONS'],['SERVICE',String(caps.length)+' REGISTERED CAPABILITIES'],['CITY','UNAVAILABLE'],['REGION','UNAVAILABLE'],['COUNTRY',profile.country||'UNAVAILABLE'],['WORLD','OMEGA WORLD']].forEach(function(x){var n=add(path,'div','civ-node');add(n,'b',null,x[0]);add(n,'span',null,x[1]);});
set('civilization-truth',profile.country?'LIVE + USER-CREATED':'PARTIAL');
void events;void evolution;
}catch(e){showUnavailable('SOURCE READ FAILED');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();