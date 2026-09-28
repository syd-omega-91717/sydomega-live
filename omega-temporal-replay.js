/* Ω TEMPORAL REPLAY — read-only event timeline. */
(function(){
'use strict';
if(window.OmegaTemporalReplay)return;
function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=String(text);return n;}
function host(){return document.getElementById('omega-replay-state');}
function clear(n){n.replaceChildren();}
function stamp(v){var d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toISOString().replace('T',' ').replace('.000Z','Z');}
function show(message){var h=host();if(!h)return;clear(h);var b=el('div','otr-unavailable');b.appendChild(el('strong',null,'REPLAY · UNAVAILABLE'));b.appendChild(el('p',null,message));h.appendChild(b);}
function render(rows){var h=host();if(!h)return;clear(h);h.appendChild(el('p','otr-truth','REPLAY is historical visualization only. It cannot reconstruct events that were never persisted and cannot execute, reverse, or mutate an event.'));
if(!rows.length){h.appendChild(el('p','otr-empty','No persisted events were returned for this member.'));return;}
var list=el('section','otr-list');rows.forEach(function(e,i){var item=el('article','otr-event');item.appendChild(el('span','otr-marker',String(i+1).padStart(2,'0')));item.appendChild(el('time',null,stamp(e.created_at)));item.appendChild(el('strong',null,e.event_type||'EVENT'));item.appendChild(el('span',null,e.route||'platform'));var meta=el('pre','otr-meta',JSON.stringify(e.metadata||{},null,2));meta.setAttribute('aria-label','Event metadata');item.appendChild(meta);list.appendChild(item);});h.appendChild(list);}
async function boot(){if(!host())return;try{var sb=window.__omegaSb;if(!sb){var mod=await import('/vendor/supabase-js.js');sb=window.__omegaSb=mod.createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q');}var session=(await sb.auth.getSession()).data.session;if(!session){show('Sign in to inspect your persisted event timeline.');return;}var result=await sb.from('omega_platform_events').select('id,event_type,route,metadata,created_at').eq('actor_user_id',session.user.id).order('created_at',{ascending:true}).limit(200);if(result.error){show('The persisted event source could not be read. No history is inferred.');return;}render(Array.isArray(result.data)?result.data:[]);}catch(e){show('The replay source could not be read. No history is inferred.');}}
window.OmegaTemporalReplay={boot:boot};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();