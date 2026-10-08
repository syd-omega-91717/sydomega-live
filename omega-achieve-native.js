/* Ω ACHIEVE NATIVE — provenance-first recognition projection. */
(function(root){
'use strict';
function client(){if(root.OmegaSB&&typeof root.OmegaSB.get==='function')return root.OmegaSB.get();return Promise.resolve(root.__omegaSb||null);}
async function load(){
 var sb=await client();if(!sb)throw new Error('DATABASE_CLIENT_UNAVAILABLE');
 var s=(await sb.auth.getSession()).data.session;if(!s||!s.user)throw new Error('SIGN_IN_REQUIRED');
 var uid=s.user.id;
 var specs=[
  ['profile',sb.from('profiles').select('axis_a,axis_b,axis_c,is_owner,access_approved').eq('id',uid).maybeSingle()],
  ['tasks',sb.from('task_completions').select('id,task,task_name,task_type,axis,points_earned,completed_at').eq('user_id',uid).order('completed_at',{ascending:false}).limit(200)],
  ['evolution',sb.from('evolution_events').select('id,axis,note,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(200)],
  ['trophies',sb.from('trophies').select('id,trophy_num,trophy_name,milestone,tier,earned_at,issued_at').eq('user_id',uid).order('earned_at',{ascending:false})],
  ['medals',sb.from('medals').select('id,medal_num,earned_at,issued_at').eq('user_id',uid).order('earned_at',{ascending:false})],
  ['certificates',sb.from('certificates').select('id,cert_num,title,milestone,issued_at').eq('user_id',uid).order('issued_at',{ascending:false})]
 ];
 var results=await Promise.all(specs.map(function(x){return x[1];}));
 var out={truth_state:'LIVE',profile:results[0].data||{},tasks:results[1].data||[],evolution:results[2].data||[],trophies:results[3].data||[],medals:results[4].data||[],certificates:results[5].data||[],evidence:{truth_state:'UNAVAILABLE',count:null}};
 for(var i=0;i<results.length;i++)if(results[i].error)throw results[i].error;
 try{var e=await sb.from('omega_platform_evidence').select('id,event_id,evidence_type,created_at').eq('actor_id',uid).order('created_at',{ascending:false}).limit(200);if(e.error)throw e.error;out.evidence={truth_state:e.data&&e.data.length?'LIVE':'EMPTY',count:(e.data||[]).length};}catch(_){out.evidence={truth_state:'UNAVAILABLE',count:null};}
 return out;
}
function esc(v){return String(v==null?'—':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function render(d){
 var el=document.getElementById('achieve-native-state');if(!el)return;
 var total=d.tasks.length+d.evolution.length+d.trophies.length+d.medals.length+d.certificates.length;
 var cards=[['TASK EVIDENCE',d.tasks.length],['EVOLUTION EVENTS',d.evolution.length],['TROPHIES',d.trophies.length],['MEDALS',d.medals.length],['CERTIFICATES',d.certificates.length],['LINKED EVIDENCE',d.evidence.count==null?'—':d.evidence.count]];
 el.innerHTML='<div class="native-grid">'+cards.map(function(c){return '<div class="native-card"><b>'+esc(c[1])+'</b><span>'+esc(c[0])+'</span></div>';}).join('')+'</div><div class="native-boundary">PROVENANCE: '+esc(total)+' persisted recognition/progression records are readable for this member. A trophy, medal or certificate row proves record existence only; it does not independently prove that the underlying award rule was correctly executed. Rule verification remains authoritative elsewhere.</div>';
}
root.OmegaAchieveNative={load:load,render:render};
})(globalThis);
