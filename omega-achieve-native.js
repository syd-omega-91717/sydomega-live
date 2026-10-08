/* Ω ACHIEVE NATIVE — canonical provenance-first recognition projection. */
(function(root){
'use strict';
function client(){if(root.OmegaSB&&typeof root.OmegaSB.get==='function')return root.OmegaSB.get();return Promise.resolve(root.__omegaSb||null);}
async function load(){
 var sb=await client();if(!sb)throw new Error('DATABASE_CLIENT_UNAVAILABLE');
 var s=(await sb.auth.getSession()).data.session;if(!s||!s.user)throw new Error('SIGN_IN_REQUIRED');
 var uid=s.user.id;
 var specs=[
  ['tasks',sb.from('task_completions').select('id,task,task_name,task_type,axis,points_earned,completed_at').eq('user_id',uid).order('completed_at',{ascending:false}).limit(200)],
  ['evolution',sb.from('evolution_events').select('id,axis,note,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(200)],
  ['definitions',sb.from('omega_achievement_definitions').select('id,achievement_key,name,rule_version,active').limit(200)],
  ['achievements',sb.from('omega_user_achievements').select('id,achievement_id,verification_status,earned_at,verified_at').eq('user_id',uid).order('earned_at',{ascending:false}).limit(200)],
  ['verifications',sb.from('omega_achievement_verifications').select('id,user_achievement_id,verification_status,verified_at,verification_source').eq('user_id',uid).order('verified_at',{ascending:false}).limit(200)],
  ['certificates',sb.from('omega_certificates').select('id,user_id,achievement_id,issued_at,verification_status').eq('user_id',uid).order('issued_at',{ascending:false}).limit(200)],
  ['evidence',sb.from('omega_platform_evidence').select('id,event_id,evidence_type,created_at').eq('actor_id',uid).order('created_at',{ascending:false}).limit(200)]
 ];
 var results=await Promise.all(specs.map(function(x){return x[1];}));
 for(var i=0;i<results.length;i++)if(results[i].error)throw results[i].error;
 return {truth_state:'LIVE',tasks:results[0].data||[],evolution:results[1].data||[],definitions:results[2].data||[],achievements:results[3].data||[],verifications:results[4].data||[],certificates:results[5].data||[],evidence:results[6].data||[]};
}
function esc(v){return String(v==null?'—':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function render(d){
 var el=document.getElementById('achieve-native-state');if(!el)return;
 var cards=[['TASK EVIDENCE',d.tasks.length],['EVOLUTION EVENTS',d.evolution.length],['ACTIVE DEFINITIONS',d.definitions.filter(function(x){return x.active===true;}).length],['USER ACHIEVEMENTS',d.achievements.length],['VERIFICATIONS',d.verifications.length],['CERTIFICATES',d.certificates.length],['PLATFORM EVIDENCE',d.evidence.length]];
 el.innerHTML='<div class="native-grid">'+cards.map(function(c){return '<div class="native-card"><b>'+esc(c[1])+'</b><span>'+esc(c[0])+'</span></div>';}).join('')+'</div><div class="native-boundary">PROVENANCE: canonical achievement definitions, member achievement records, verification records and platform evidence are separate sources. A persisted achievement or certificate proves record existence; verification state is shown independently and is not inferred from display assets. No browser-side award minting or verification is introduced.</div>';
}
root.OmegaAchieveNative={load:load,render:render};
})(globalThis);
