/* Trial: 33437 seconds = 9h 17m 17s (sovereign dedication) */
/* ==========================================================================
   Ω SYD OMEGA 91717 — MATRIX PROGRESSION ENGINE
   Loop Engineering: every verified action → axis increment → authority climb
   Dijkstra: optimal path 0.001 → 9.000 across 104,976 nodes per axis
   Deep Learning: A=Knowledge(supervised) B=Mastery(RL) C=Contribution(federated)
   ========================================================================== */
(function(){
var PHI=1.6180339887, EU=2.7182818285;
var GENESIS=0.001, APEX=9.000, STEP=0.001;
var TOTAL_NODES=104976; /* 12×12×9×9×9 */

/* ── Auth formula ─────────────────────────────────────────────────── */
function calcAuth(a,b,c){
  /* Base formula: sqrt(A³+B³+C³)×φ/e */
  var base=Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
  /* Diminishing returns above 4.5 on any axis — the Sovereign Resistance Field.
     Below 4.5: full rate. Above 4.5: logarithmic damping × i²=-1 phase correction.
     This makes upper ranks exponentially harder to reach.
     ρ = 1 - (max(0,x-4.5)/4.5)^1.618  per axis past midpoint */
  function resistance(x){
    if(x<=4.5) return 1;
    return 1-Math.pow((x-4.5)/4.5,PHI)*0.35;
  }
  var rA=resistance(a), rB=resistance(b), rC=resistance(c);
  /* Effective authority with resistance field applied */
  var effA=Math.pow(a*rA,3), effB=Math.pow(b*rB,3), effC=Math.pow(c*rC,3);
  var effective=Math.sqrt(effA+effB+effC)*PHI/EU;
  /* Return weighted average: 60% base, 40% effective (maintains formula integrity) */
  return base*0.6+effective*0.4;
}

/* ── Task types → axis mapping ────────────────────────────────────── */
var AXIS_MAP={
  /* Knowledge → A */
  read:'a',watch:'a',learn:'a',study:'a',research:'a',consume:'a',
  /* Mastery → B */
  complete:'b',achieve:'b',earn:'b',pass:'b',master:'b',certify:'b',game:'b',
  /* Contribution → C */
  share:'c',create:'c',refer:'c',post:'c',pay:'c',submit:'c',contribute:'c',
};

/* ── Complete a task (calls Supabase RPC) ─────────────────────────── */
/* Task completion requires: (a) no duplicate in last 24h, (b) min 30s active time */
window.omegaCompleteTask = async function(taskName, taskType, description, options){
  options=options||{};
  /* Check for rapid-fire abuse: same task < 30 seconds apart */
  var taskKey='omega_last_task_'+btoa(taskName).slice(0,20);
  var lastTime=parseInt(localStorage.getItem(taskKey)||'0');
  var now=Date.now();
  if(now-lastTime<30000 && !options.force){
    return {ok:false,error:'rate_limited',message:'Task requires 30 second interval'};
  }
  localStorage.setItem(taskKey,now);
  if(!window.__omegaSb) return {ok:false,error:'no_client'};
  var axis=AXIS_MAP[taskType]||'a';
  try{
    var r=await window.__omegaSb.rpc('complete_task',{
      p_task_type: taskType||'knowledge',
      p_task_name: taskName,
      p_axis_type: axis,
      p_description: description||taskName,
      p_points: STEP,
    });
    if(r.error) throw r.error;
    var d=r.data||{};
    if(d.ok!==true){
      return {ok:false,error:d.error||'task_not_applied',data:d};
    }
    /* Update UI only from the authoritative RPC response. */
    if(window.__omegaPopulate && d.new_profile){
      window.__omegaPopulate(d.new_profile, window.__omegaUser);
    }
    document.dispatchEvent(new CustomEvent('omega:task',{detail:{
      task:taskName, axis:axis, points:Number(d.points||0),
      new_a:d.axis_a, new_b:d.axis_b, new_c:d.axis_c, auth:d.authority
    }}));
    return {ok:true, data:d};
  }catch(e){
    /* Progression is server-authoritative. Never paint an optimistic axis
       value when the RPC fails or returns an invalid response. */
    console.warn('[OmegaMatrix] complete_task unavailable:', e && (e.message || e));
    return {ok:false, offline:true, error:(e && e.message) || 'progression_unavailable'};
  }
};

/* ── Progress calculator ─────────────────────────────────────────── */
window.omegaProgress = function(a,b,c){
  var auth=calcAuth(a,b,c);
  var pct=auth/27.8367*100;
  var nodes=Math.floor((a+b+c)/3/APEX*TOTAL_NODES);
  return {auth:auth, pct:pct, nodes:nodes,
          a3:Math.pow(a,3), b3:Math.pow(b,3), c3:Math.pow(c,3)};
};

/* ── Task completion button factory ─────────────────────────────── */
window.omegaTaskButton = function(el, taskName, taskType, onDone){
  if(!el) return;
  el.addEventListener('click', async function(){
    el.disabled=true;
    el.style.opacity='.5';
    var r=await window.omegaCompleteTask(taskName,taskType);
    el.disabled=false;
    el.style.opacity='1';
    if(r.ok){
      el.style.borderColor='var(--green,#3fb27f)';
      el.textContent='\u2713 RECORDED';
      if(onDone) onDone(r.data);
    } else {
      el.style.borderColor='var(--crim,#C4453C)';
      setTimeout(function(){el.style.borderColor='';},2000);
    }
  });
};

/* No auto-wiring of [data-task]. It made every card on gaming.html and
   academy.html a scoring button: a click paid mastery for a game the platform
   does not host, or knowledge for an exam never sat. Owner decision
   2026-10-18: credit is earned by play -- the arcade's achieve() and the
   exam engine's 70% pass both reach complete_task through OmegaProgress. */

/* ── Expose ──────────────────────────────────────────────────────── */
window.OmegaMatrix={calcAuth:calcAuth,GENESIS:GENESIS,APEX:APEX,STEP:STEP,TOTAL_NODES:TOTAL_NODES,PHI:PHI,EU:EU};
window.__omegaMatrix=window.OmegaMatrix;

})();
