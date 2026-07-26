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
  return Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
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
window.omegaCompleteTask = async function(taskName, taskType, description){
  if(!window.__omegaSb) return {ok:false,error:'no_client'};
  var axis=AXIS_MAP[taskType]||'a';
  try{
    var r=await window.__omegaSb.rpc('complete_task',{
      p_task_name: taskName,
      p_task_type: taskType||'knowledge',
      p_axis_type: axis,
      p_description: description||taskName,
      p_points: STEP,
    });
    if(r.error) throw r.error;
    var d=r.data||{};
    /* Update UI live */
    if(window.__omegaPopulate && d.new_profile){
      window.__omegaPopulate(d.new_profile, window.__omegaUser);
    }
    /* Emit event */
    document.dispatchEvent(new CustomEvent('omega:task',{detail:{
      task:taskName, axis:axis, points:STEP,
      new_a:d.axis_a, new_b:d.axis_b, new_c:d.axis_c, auth:d.authority
    }}));
    return {ok:true, data:d};
  }catch(e){
    /* Graceful offline fallback: update display optimistically */
    var pr=window.__omegaProfile||{};
    var na=Number(pr.axis_a||GENESIS);
    var nb=Number(pr.axis_b||GENESIS);
    var nc=Number(pr.axis_c||GENESIS);
    if(axis==='a') na=Math.min(APEX,na+STEP);
    if(axis==='b') nb=Math.min(APEX,nb+STEP);
    if(axis==='c') nc=Math.min(APEX,nc+STEP);
    var auth=calcAuth(na,nb,nc);
    document.querySelectorAll('[id^="user-auth"],[id^="ph-auth"],[id^="pf-auth"]').forEach(function(el){
      el.textContent=auth.toFixed(4);
    });
    return {ok:false, offline:true, error:e.message};
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
      el.style.borderColor='var(--crim,#8B0000)';
      setTimeout(function(){el.style.borderColor='';},2000);
    }
  });
};

/* ── Auto-wire data-task buttons on every page ───────────────────── */
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('[data-task]').forEach(function(el){
    var taskName=el.getAttribute('data-task');
    var taskType=el.getAttribute('data-task-type')||'knowledge';
    window.omegaTaskButton(el, taskName, taskType);
  });
});

/* ── Expose ──────────────────────────────────────────────────────── */
window.OmegaMatrix={calcAuth:calcAuth,GENESIS:GENESIS,APEX:APEX,STEP:STEP,TOTAL_NODES:TOTAL_NODES,PHI:PHI,EU:EU};
window.__omegaMatrix=window.OmegaMatrix;

})();
