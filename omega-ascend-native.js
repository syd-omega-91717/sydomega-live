/* Ω SYD OMEGA 91717 — ASCEND native consolidation */
(function(){
'use strict';
var PHI=1.6180339887,E=2.7182818285,APEX=27.8367;
var TH=[2.32,3.98,5.95,8.29,11,13.92,17.21,20.87,24.01,25.9,27.1,27.8367];
var GN=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT','SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX SOVEREIGN'];
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function state(s){var e=document.getElementById('oac-state');if(e){e.textContent=s;e.className=String(s).toLowerCase();}}
function run(sb){
 sb.auth.getSession().then(async function(res){
  var sess=res&&res.data&&res.data.session;if(!sess){state('UNAVAILABLE');return;}
  var u=sess.user, prRes=await sb.from('profiles').select('id,is_owner,access_approved,axis_a,axis_b,axis_c').eq('id',u.id).maybeSingle();
  if(prRes.error){state('UNAVAILABLE');return;} if(!prRes.data){state('EMPTY');return;}
  var p=prRes.data,a=Number(p.is_owner?9:p.axis_a||0),b=Number(p.is_owner?9:p.axis_b||0),c=Number(p.is_owner?9:p.axis_c||0);
  var auth=p.is_owner?APEX:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/E;
  var gi=TH.findIndex(function(t){return auth<t;});if(gi<0)gi=12;
  var gate=GN[Math.max(0,gi-1)], next=gi<12?TH[gi]:null;
  state('LIVE');
  document.getElementById('oac-auth').textContent=auth.toFixed(4);
  document.getElementById('oac-gate').textContent=gate+' · GATE '+Math.max(1,gi)+(next?' · NEXT '+next.toFixed(2):'');
  document.getElementById('oac-axes').textContent=a.toFixed(3)+' / '+b.toFixed(3)+' / '+c.toFixed(3);
  var tr=await sb.from('task_completions').select('id',{count:'exact',head:true}).eq('user_id',u.id);
  document.getElementById('oac-tasks').textContent=tr.error?'UNAVAILABLE':String(tr.count||0);
  var er=await sb.from('evolution_events').select('axis,note,created_at').eq('user_id',u.id).order('created_at',{ascending:false}).limit(6);
  if(er.error){document.getElementById('oac-events').textContent='UNAVAILABLE';}
  else{var ev=er.data||[];document.getElementById('oac-events').textContent=String(ev.length)+(ev.length===6?'+':'');document.getElementById('oac-recent').innerHTML=ev.length?ev.map(function(x){return'<div><b>'+esc((x.axis||'X').toUpperCase())+'</b><span>'+esc(x.note||'Evolution event recorded.')+'</span><time>'+esc(new Date(x.created_at).toLocaleString())+'</time></div>';}).join(''):'<span class="empty">EMPTY · no evolution events recorded for this member</span>';}
 }).catch(function(){state('UNAVAILABLE');});
}
function mount(){
 var host=document.querySelector('[data-omega-ascend-native]');if(!host)return;
 host.innerHTML='<div class="omega-ascend-native"><div class="omega-ascend-head"><span>CANONICAL ASCEND STATE</span><b id="oac-state">LOADING</b></div><div class="omega-ascend-grid"><article><small>AUTHORITY</small><strong id="oac-auth">—</strong><em id="oac-gate">—</em></article><article><small>AXES A / B / C</small><strong id="oac-axes">—</strong><em>PROFILE DERIVED</em></article><article><small>TASK COMPLETIONS</small><strong id="oac-tasks">—</strong><em>PERSISTED RECORDS</em></article><article><small>EVOLUTION EVENTS</small><strong id="oac-events">—</strong><em>PERSISTED RECORDS</em></article></div><div class="omega-ascend-links"><a href="/academy.html">ACADEMY</a><a href="/courses.html">COURSES</a><a href="/focus.html">FOCUS</a><a href="/domain-mastery.html">DOMAIN MASTERY</a><a href="/evolution.html">EVOLUTION</a></div><div class="omega-ascend-events" id="oac-recent"><span>Loading persisted progression events…</span></div><p class="omega-ascend-note">TRUTH BOUNDARY: authority is calculated from the existing profile axes using the established platform formula. Task/evolution counts are persisted records, not proof of external-world outcomes. Missing records remain EMPTY or UNAVAILABLE.</p></div>';
 var sb=window.__omegaSb;
 if(sb){run(sb);return;}
 import('/vendor/supabase-js.js').then(function(mod){sb=window.__omegaSb=mod.createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q');run(sb);}).catch(function(){state('UNAVAILABLE');});
}
window.OmegaAscendNative={refresh:mount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();