/* Ω SYD OMEGA 91717 — Live Mission Board
   Server-authoritative UI. No local mission truth, XP, streaks, ranks, or
   fabricated quest definitions are stored in the browser. */
import { createClient } from '/vendor/supabase-js.js';

const SUPABASE_URL = 'https://ydqhzvvoyufiiqvzcjns.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q';
const sb = window.__omegaSb || (window.__omegaSb = createClient(SUPABASE_URL, SUPABASE_KEY));

const $ = (id) => document.getElementById(id);
const state = { user:null, missions:[], quests:[], missionStates:[], questStates:[], events:[], transitions:[] };

function esc(value){
  const map={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  return String(value ?? '').replace(/[&<>"']/g,function(ch){return map[ch];});
}
function reality(label,note){
  return '<div class="oms" data-omega-mission-state>'+
    '<div class="oms-title">MISSION STATE</div>'+
    '<span class="oms-status" data-state="'+esc(label)+'">'+esc(label)+'</span>'+
    '<p class="oms-note">'+esc(note)+'</p>'+
  '</div>';
}
function idempotency(prefix){
  const bytes=new Uint8Array(16);
  if(window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
  else for(let i=0;i<bytes.length;i++) bytes[i]=Math.floor(Math.random()*256);
  return prefix+'-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
function errText(error){
  return error?.message || error?.details || error?.hint || 'Operation failed';
}
function requiredTypes(mission){
  const r=mission?.completion_rule;
  return Array.isArray(r?.required_event_types) ? r.required_event_types.filter(Boolean) : [];
}
function evidenceFor(mission){
  const required=requiredTypes(mission);
  if(!required.length) return [];
  return required.map(type=>state.events.find(e=>e.event_type===type)).filter(Boolean);
}
function missionState(id){
  return state.missionStates.find(s=>s.mission_id===id);
}
function renderKpis(){
  const active=state.missions.filter(m=>m.status==='active').length;
  const activeMember=state.missionStates.filter(s=>s.status==='active').length;
  const completed=state.missionStates.filter(s=>s.status==='completed').length;
  const evidence=state.events.length;
  $('missionActiveCount').textContent=String(active);
  $('missionRunningCount').textContent=String(activeMember);
  $('missionCompletedCount').textContent=String(completed);
  $('missionEvidenceCount').textContent=String(evidence);
}
function renderMissions(){
  const root=$('dailyList');
  root.innerHTML='';
  if(!state.missions.length){
    root.innerHTML='<div class="empty"><strong>NO ACTIVE MISSIONS</strong><br><span>LIVE production state is empty by design. Mission definitions are not fabricated in the browser.</span></div>';
    return;
  }
  state.missions.forEach(m=>{
    const s=missionState(m.id);
    const required=requiredTypes(m);
    const matching=evidenceFor(m);
    const canComplete=Boolean(s?.status==='active' && required.length && matching.length===required.length);
    const card=document.createElement('article');
    card.className='mission-card'+(s?.status==='completed'?' completed':'');
    const status=s?.status||'available';
    const action=s?.status==='completed'
      ? '<button class="mc-action done" type="button" disabled>COMPLETE</button>'
      : s?.status==='active'
        ? (canComplete
          ? '<button class="mc-action" data-complete="'+esc(s.id)+'" type="button">COMPLETE WITH EVIDENCE</button>'
          : '<a class="mc-action" href="/evidence.html">ADD EVIDENCE</a>')
        : '<button class="mc-action" data-start="'+esc(m.id)+'" type="button">START</button>';
    const evidenceText=required.length
      ? (matching.length+'/'+required.length+' required evidence types')
      : 'Completion requires persisted member-owned evidence';
    card.innerHTML=
      '<div class="mc-icon">Ω</div>'+
      '<div class="mc-body">'+
        '<div class="mc-header"><div class="mc-title">'+esc(m.title)+'</div><span class="mc-tier">'+esc(status.toUpperCase())+'</span></div>'+
        '<div class="mc-desc">'+esc(m.description||'No mission description supplied.')+'</div>'+
        '<div class="mc-meta"><span class="mc-element">KEY '+esc(m.mission_key)+'</span><span class="mc-time">v'+esc(m.version)+'</span><span class="mc-element">'+esc(evidenceText)+'</span></div>'+
        '<div class="mc-progress"><div class="mc-progress-fill" style="width:'+(s?.status==='completed'?'100':s?.status==='active'?'50':'0')+'%"></div></div>'+
      '</div>'+action;
    root.appendChild(card);
  });
}
function renderQuests(){
  const root=$('weeklyList');
  root.innerHTML='';
  if(!state.quests.length){
    root.innerHTML='<div class="empty"><strong>NO ACTIVE QUESTS</strong><br><span>Quest definitions remain empty until real product definitions and completion rules exist.</span></div>';
    return;
  }
  state.quests.forEach(q=>{
    const s=state.questStates.find(x=>x.quest_id===q.id);
    const el=document.createElement('article');
    el.className='mission-card';
    el.innerHTML='<div class="mc-icon">◇</div><div class="mc-body"><div class="mc-header"><div class="mc-title">'+esc(q.title)+'</div><span class="mc-tier">'+esc((s?.status||'available').toUpperCase())+'</span></div><div class="mc-desc">'+esc(q.description||'No quest description supplied.')+'</div><div class="mc-meta"><span class="mc-element">KEY '+esc(q.quest_key)+'</span><span class="mc-time">v'+esc(q.version)+'</span></div></div>';
    root.appendChild(el);
  });
  $('legendaryList').innerHTML='<div class="empty">LEGENDARY QUESTS ARE NOT SEEDED. THIS IS A LIVE EMPTY STATE.</div>';
}
function renderHistory(){
  const root=$('historyList');
  root.innerHTML='';
  if(!state.transitions.length){
    root.innerHTML='<div class="empty">NO PERSISTED MISSION TRANSITIONS</div>';
    return;
  }
  state.transitions.slice(0,20).forEach(t=>{
    const row=document.createElement('div');
    row.className='hist-item';
    row.innerHTML='<span class="hi-icon">Ω</span><span class="hi-title">'+esc(t.from_status||'NEW')+' → '+esc(t.to_status)+'</span><span class="hi-date">'+esc(new Date(t.created_at).toLocaleString())+'</span>';
    root.appendChild(row);
  });
}
function renderScience(){
  const root=$('scienceLive');
  root.innerHTML='<div class="card"><div class="card-title">LIVE CONTRACT</div><div class="card-body">'+
    '<p>Mission definitions: <b>'+state.missions.length+'</b></p>'+
    '<p>Quest definitions: <b>'+state.quests.length+'</b></p>'+
    '<p>Member-owned evidence events loaded: <b>'+state.events.length+'</b></p>'+
    '<p>Mission state transitions loaded: <b>'+state.transitions.length+'</b></p>'+
    '<p class="oms-note">The former localStorage XP/rank/streak simulator has been removed. Progress is now displayed only from persisted production state.</p>'+
    '</div></div>';
}
async function load(){
  const session=(await sb.auth.getSession()).data.session;
  if(!session){location.replace('/account.html');return;}
  const profile=(await sb.from('profiles').select('is_owner,access_approved').eq('id',session.user.id).maybeSingle()).data||{};
  if(!profile.is_owner&&!profile.access_approved){location.replace('/pending.html');return;}
  state.user=session.user;
  window.__omegaUser=session.user;
  $('app').style.display='flex';
  const results=await Promise.all([
    sb.from('omega_missions').select('id,mission_key,version,title,description,status,completion_rule,max_attempts,updated_at').eq('status','active').order('updated_at',{ascending:false}),
    sb.from('omega_quests').select('id,quest_key,version,title,description,status,updated_at').eq('status','active').order('updated_at',{ascending:false}),
    sb.from('omega_member_mission_state').select('id,mission_id,status,attempt_count,started_at,completed_at,last_transition_at').order('last_transition_at',{ascending:false}),
    sb.from('omega_member_quest_state').select('id,quest_id,status,current_mission_id,started_at,completed_at,last_transition_at').order('last_transition_at',{ascending:false}),
    sb.from('omega_platform_events').select('id,event_type,route,created_at,metadata').eq('actor_user_id',session.user.id).order('created_at',{ascending:false}).limit(100),
    sb.from('omega_mission_transitions').select('id,member_mission_id,from_status,to_status,event_id,evidence_event_ids,graph_evidence_ids,idempotency_key,reason,created_at').order('created_at',{ascending:false}).limit(100)
  ]);
  const failed=results.find(r=>r.error);
  if(failed?.error){
    $('missionReality').innerHTML=reality('PARTIAL','The mission board could not load one or more persisted sources: '+errText(failed.error));
    return;
  }
  state.missions=results[0].data||[];
  state.quests=results[1].data||[];
  state.missionStates=results[2].data||[];
  state.questStates=results[3].data||[];
  state.events=results[4].data||[];
  state.transitions=results[5].data||[];
  $('missionReality').innerHTML=reality('LIVE','Mission definitions, member state, evidence events and transitions are read from persisted Supabase state.');
  renderKpis();renderMissions();renderQuests();renderHistory();renderScience();
}
async function startMission(id,button){
  button.disabled=true;
  const {error}=await sb.rpc('omega_start_mission',{p_mission_id:id,p_idempotency_key:idempotency('mission-start')});
  if(error){button.disabled=false;alert('Mission could not be started: '+errText(error));return;}
  await load();
}
async function completeMission(id,button){
  button.disabled=true;
  const mission=state.missions.find(m=>m.id===missionState(id)?.mission_id);
  const evidence=evidenceFor(mission||{});
  if(!evidence.length){button.disabled=false;alert('Persisted evidence is required before completion.');return;}
  const {error}=await sb.rpc('omega_complete_mission',{
    p_member_mission_id:id,
    p_evidence_event_ids:evidence.map(e=>e.id),
    p_graph_evidence_ids:[],
    p_idempotency_key:idempotency('mission-complete')
  });
  if(error){button.disabled=false;alert('Mission could not be completed: '+errText(error));return;}
  await load();
}
document.addEventListener('click',e=>{
  const start=e.target.closest('[data-start]');
  if(start){startMission(start.getAttribute('data-start'),start);return;}
  const complete=e.target.closest('[data-complete]');
  if(complete)completeMission(complete.getAttribute('data-complete'),complete);
});
load().catch(error=>{
  $('missionReality').innerHTML=reality('UNAVAILABLE','Mission board initialization failed safely: '+errText(error));
});
