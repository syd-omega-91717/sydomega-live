/* Ω LIFE SURFACE — persisted member projection adapter; read-only. */
(function(){
'use strict';
function client(){if(window.OmegaSB&&typeof window.OmegaSB.get==='function')return window.OmegaSB.get();return Promise.resolve(window.__omegaSb||null);}
function text(id,value){var e=document.getElementById(id);if(e)e.textContent=value;}
function clear(e){if(e)e.replaceChildren();}
function card(root,label,value,note){
 var c=document.createElement('div');c.className='life-surface-card';
 var b=document.createElement('b');b.textContent=label;c.appendChild(b);
 var s=document.createElement('strong');s.textContent=String(value);c.appendChild(s);
 if(note){var n=document.createElement('span');n.textContent=note;c.appendChild(n);}
 root.appendChild(c);
}
async function boot(){
 var grid=document.getElementById('life-member-surface-grid');if(!grid)return;
 var sb=await client().catch(function(){return null;});
 if(!sb){text('life-surface-truth','UNAVAILABLE');return;}
 var session=(await sb.auth.getSession().catch(function(){return {data:{session:null}}})).data.session;
 if(!session){text('life-surface-truth','SIGN IN REQUIRED');return;}
 var r=await sb.from('omega_member_life_surface').select('*').maybeSingle();
 if(r.error||!r.data){text('life-surface-truth',r.error?'PARTIAL · SOURCE FAILED':'UNAVAILABLE');return;}
 var s=r.data,p=s.projects||{},m=s.missions||{},q=s.quests||{},t=s.tasks||{},mem=s.ai_memory||{},n=s.notifications||{},a=s.activity||{},pr=s.progression||{};
 clear(grid);
 card(grid,'PROJECTS',p.count||0,(p.active_count||0)+' active');
 card(grid,'MISSIONS',m.owned_state_count||0,(m.active_count||0)+' active · '+(m.completed_count||0)+' completed');
 card(grid,'QUESTS',q.owned_state_count||0,(q.completed_count||0)+' completed');
 card(grid,'TASKS',t.completion_count||0,String(t.points_earned||0)+' points observed');
 card(grid,'AI MEMORY',mem.memory_count||0,(mem.ready_embedding_count||0)+' ready embeddings');
 card(grid,'NOTIFICATIONS',n.notification_count||0,(n.unread_count||0)+' unread');
 card(grid,'ACTIVITY',a.event_count||0,(a.evidence_count||0)+' platform evidence');
 card(grid,'PROGRESSION',pr.evolution_event_count||0,(pr.domain_mastery_count||0)+' mastery records');
 card(grid,'UNAVAILABLE DOMAINS','EXPLICIT','skills · goals · ideas · credentials · achievement definitions');
 text('life-surface-truth',s.truth_state==='LIVE'?'LIVE · PERSISTED PROJECTION':'PARTIAL');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();