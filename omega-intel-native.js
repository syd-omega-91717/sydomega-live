/* Ω INTEL — native evidence/activity adapters.
   Read-only composition over canonical production tables. */
(function(){
'use strict';
function el(id){return document.getElementById(id);}
function add(p,t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!==undefined)n.textContent=String(x);p.appendChild(n);return n;}
function clear(n){if(n)n.replaceChildren();}
async function run(){
 var host=el('intel-native-observations');if(!host)return;
 clear(host);
 var sb;
 try{sb=window.OmegaSB&&await window.OmegaSB.get();}catch(e){add(host,'p','intel-native-empty','UNAVAILABLE · database client failed.');return;}
 if(!sb){add(host,'p','intel-native-empty','UNAVAILABLE · database client unavailable.');return;}
 var session;
 try{session=(await sb.auth.getSession()).data.session;}catch(e){add(host,'p','intel-native-empty','UNAVAILABLE · session check failed.');return;}
 if(!session||!session.user){add(host,'p','intel-native-empty','UNAVAILABLE · sign in to inspect member intelligence.');return;}
 var r=await sb.from('omega_platform_events').select('id,event_type,created_at').eq('actor_user_id',session.user.id).order('created_at',{ascending:false}).limit(8);
 if(r.error){add(host,'p','intel-native-empty','PARTIAL · canonical event fabric unavailable.');return;}
 if(!r.data||!r.data.length){add(host,'p','intel-native-empty','EMPTY · no canonical member events are currently persisted.');return;}
 r.data.forEach(function(row){
   var a=add(host,'article','intel-native-observation');
   add(a,'span','intel-native-state','LIVE · PERSISTED');
   add(a,'strong',null,row.event_type||'EVENT');
   add(a,'small',null,new Date(row.created_at).toLocaleString());
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
window.OmegaIntelNative=Object.freeze({refresh:run});
})();