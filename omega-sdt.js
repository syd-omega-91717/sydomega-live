/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN GAMIFICATION ENGINE (SDT v2)
   
   Research basis:
   - Deci & Ryan — Self-Determination Theory (autonomy/competence/relatedness)
   - Riot Games — core/meta/social loop architecture
   - Nintendo — positive feedback every 30-90 seconds of active engagement
   - Epic Games — seasonal track meta-loop (Battle Pass model)
   - Stack Overflow — reputation threshold gates for privileges
   
   SDT Implementation:
   A) AUTONOMY: Members choose WHICH pillar/track to focus on first
   B) COMPETENCE: Calibrated challenge at every axis level, clear progress signals
   C) RELATEDNESS: Leaderboard, presence widget, peer rank awareness
   
   Loop Architecture (Riot model):
   CORE LOOP:  action(task) → reward(+0.001 axis) → reinvestment(next task)
   META LOOP:  daily dedication → authority gates → tier unlock
   SOCIAL LOOP: daily snapshot → leaderboard rank → peer comparison
   ========================================================================== */
(function(){
  if(window.__omegaSDTActive) return;
  window.__omegaSDTActive=true;

  var PHI=1.6180339887,EU=2.7182818285;
  var GATES=[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.5170,27.8367];
  var GATE_NAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT','SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX'];

  /* ── A. AUTONOMY: Track choice persistence ──────────────────────────── */
  /* Remember which track the member prefers — respect choice across sessions */
  window.OmegaSDT = {
    getPreferredTrack: function(){return localStorage.getItem('omega_track')||null;},
    setPreferredTrack: function(t){localStorage.setItem('omega_track',t);},
    getPreferredAxis: function(){return localStorage.getItem('omega_axis')||'a';},
    setPreferredAxis: function(a){localStorage.setItem('omega_axis',a);}
  };

  /* ── B. COMPETENCE: Gate detection + celebration ────────────────────── */
  var _lastGate=-1;
  function getGateIdx(auth){
    for(var i=GATES.length-1;i>=0;i--){if(auth>=GATES[i])return i;}
    return -1;
  }
  function checkGateUnlock(auth){
    var gi=getGateIdx(auth);
    var stored=parseInt(localStorage.getItem('omega_last_gate')||'-1');
    if(gi>stored){
      localStorage.setItem('omega_last_gate',gi);
      celebrateGate(gi);
    }
  }
  function celebrateGate(gi){
    if(gi<0||gi>=GATE_NAMES.length) return;
    /* Haptic feedback (mobile, Apple HIG pattern) */
    if(navigator.vibrate) navigator.vibrate([40,30,60,30,80]);
    /* Visual celebration */
    var overlay=document.createElement('div');
    overlay.id='omega-gate-celebrate';
    overlay.setAttribute('role','alert');
    overlay.setAttribute('aria-live','assertive');
    overlay.style.cssText='position:fixed;inset:0;z-index:9998;background:rgba(2,2,6,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;animation:fadeIn .3s ease';
    var gateColor=['#C9A84C','#C9A84C','#00E5FF','#C9A84C','#3fb27f','#9B6BF0','#C9A84C','#00E5FF','#E2C86D','#9B6BF0','#E2C86D','#C9A84C'][gi];
    overlay.innerHTML='<style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}</style>'
      +'<div style="font-family:\'Cinzel Decorative\',serif;font-size:clamp(10px,2vw,13px);letter-spacing:4px;color:'+gateColor+';animation:rise .5s .1s both">GATE UNLOCKED</div>'
      +'<div style="font-family:\'Cinzel Decorative\',serif;font-size:clamp(32px,8vw,72px);color:'+gateColor+';margin:12px 0;line-height:1;animation:rise .5s .2s both">'+(gi+1)+'</div>'
      +'<div style="font-family:\'Cinzel Decorative\',serif;font-size:clamp(16px,4vw,28px);color:'+gateColor+';animation:rise .5s .3s both">'+GATE_NAMES[gi]+'</div>'
      +'<div style="font-family:\'Courier Prime\',monospace;font-size:9px;letter-spacing:3px;color:rgba(138,134,118,.6);margin-top:14px;animation:rise .5s .4s both">AUTH THRESHOLD '+GATES[gi].toFixed(4)+'</div>'
      +'<div style="font-family:\'Courier Prime\',monospace;font-size:8px;letter-spacing:2px;color:rgba(138,134,118,.4);margin-top:8px;animation:rise .5s .5s both">\u03A9 SYD OMEGA 91717 &middot; SOVEREIGN PROGRESSION</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click',function(){document.body.removeChild(overlay);});
    setTimeout(function(){if(overlay.parentNode)document.body.removeChild(overlay);},4500);
  }

  /* ── C. RELATEDNESS: Positive feedback pulse ────────────────────────── */
  /* Nintendo principle: positive feedback every 30-90 seconds */
  /* Show micro-affirmations when member completes tasks */
  window.OmegaSDT.pulse=function(axis,delta,newAuth){
    checkGateUnlock(newAuth);
    /* Micro-toast (bottom center, 3 seconds) */
    var toast=document.createElement('div');
    toast.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:5000;font-family:\'Courier Prime\',monospace;font-size:9px;letter-spacing:2px;padding:8px 16px;background:rgba(2,2,6,.95);border:1px solid rgba(201,168,76,.3);border-radius:2px;color:var(--gold,#C9A84C);white-space:nowrap;animation:fadeIn .25s ease';
    var axLabel={a:'KNOWLEDGE',b:'MASTERY',c:'CONTRIBUTION'}[axis]||'AXIS';
    toast.textContent='+'+Number(delta||0.001).toFixed(3)+' \u2192 AXIS '+axLabel+' \u00b7 AUTH='+Number(newAuth||0).toFixed(4);
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    document.body.appendChild(toast);
    setTimeout(function(){if(toast.parentNode)document.body.removeChild(toast);},3000);
  };

  /* ── Listen for progression events ─────────────────────────────────── */
  document.addEventListener('omega:task',function(e){
    if(e.detail){
      window.OmegaSDT.pulse(e.detail.axis,e.detail.points,e.detail.auth);
    }
  });

  /* ── Init: check gate on page load ─────────────────────────────────── */
  document.addEventListener('omega:populated',function(e){
    var pr=e.detail&&e.detail.profile;
    if(!pr||pr.is_owner) return;
    var a=Number(pr.axis_a||0.001),b=Number(pr.axis_b||0.001),c=Number(pr.axis_c||0.001);
    var auth=Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
    checkGateUnlock(auth);
    window.OmegaSDT.currentAuth=auth;
    window.OmegaSDT.currentGate=getGateIdx(auth);
  });

  window.OmegaSDT.getGateIdx=getGateIdx;
  window.OmegaSDT.GATES=GATES;
  window.OmegaSDT.GATE_NAMES=GATE_NAMES;
})();
