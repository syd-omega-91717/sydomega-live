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
  ['definitions',sb.from('omega_achievement_definitions').select('achievement_id,version,title,description,achievement_type,verification_rule,reward_policy,lifecycle,created_at,updated_at').limit(200)],
  ['achievements',sb.from('omega_user_achievements').select('user_achievement_id,achievement_id,status,evidence_ref,verified_at,verified_by').eq('user_id',uid).order('verified_at',{ascending:false}).limit(200)],
  ['verifications',sb.from('omega_achievement_verifications').select('verification_id,user_achievement_id,verification_type,verifier,evidence,decision,decided_at,idempotency_key,omega_user_achievements!inner(user_id)').eq('omega_user_achievements.user_id',uid).order('decided_at',{ascending:false}).limit(200)],
  ['certificates',sb.from('omega_certificates').select('certificate_id,user_id,achievement_id,certificate_number,status,issued_at,revoked_at,metadata').eq('user_id',uid).order('issued_at',{ascending:false}).limit(200)],
  ['evidence',sb.from('omega_platform_evidence').select('id,event_id,evidence_type,recorded_at').eq('owner_user_id',uid).order('recorded_at',{ascending:false}).limit(200)]
 ];
 var results=await Promise.all(specs.map(function(x){return x[1];}));
 for(var i=0;i<results.length;i++)if(results[i].error)throw results[i].error;
 return {truth_state:'LIVE',tasks:results[0].data||[],evolution:results[1].data||[],definitions:results[2].data||[],achievements:results[3].data||[],verifications:results[4].data||[],certificates:results[5].data||[],evidence:results[6].data||[]};
}
function esc(v){return String(v==null?'—':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function render(d){
 var el=document.getElementById('achieve-native-state');if(!el)return;
 var cards=[['TASK EVIDENCE',d.tasks.length],['EVOLUTION EVENTS',d.evolution.length],['ACTIVE DEFINITIONS',d.definitions.filter(function(x){return String(x.lifecycle||'').toLowerCase()==='active';}).length],['USER ACHIEVEMENTS',d.achievements.length],['VERIFICATIONS',d.verifications.length],['CERTIFICATES',d.certificates.length],['PLATFORM EVIDENCE',d.evidence.length]];
 el.innerHTML='<div class="native-grid">'+cards.map(function(c){return '<div class="native-card"><b>'+esc(c[1])+'</b><span>'+esc(c[0])+'</span></div>';}).join('')+'</div><div class="native-boundary">PROVENANCE: canonical achievement definitions, member achievement records, verification records and platform evidence are separate sources. A persisted achievement or certificate proves record existence; verification state is shown independently and is not inferred from display assets. No browser-side award minting or verification is introduced.</div>';
}
root.OmegaAchieveNative={load:load,render:render};
})(globalThis);
