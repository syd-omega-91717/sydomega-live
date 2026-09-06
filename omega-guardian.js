/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN GUARDIAN (omega-guardian.js)
   
   Zero Trust continuous authentication. Inspired by Google BeyondCorp,
   Cloudflare Access, and DARPA's Zero Trust Architecture framework.
   
   Principle: "Never trust, always verify."
   Every privileged action is re-verified at the moment of execution.
   
   Capabilities:
   A. ACTION GATES    — Wrap privileged actions with auth verification
   B. SESSION HEALTH  — Continuous session validity scoring (0-100)
   C. RISK SCORING    — Real-time risk score per action context
   D. AUTO-REVOCATION — Expire sessions that score below threshold
   E. AUDIT TRAIL     — Every verified/denied action is logged
   ========================================================================== */
(function(){
  if(window.__omegaGuardianActive) return;
  window.__omegaGuardianActive = true;

  var _sessionScore=100;  /* 0=revoked, 100=pristine */
  var _lastVerified=Date.now();
  var _deniedCount=0;
  var _uid=null;

  /* ── RISK FACTORS (reduces session score) ─────────────────────── */
  var RISK_EVENTS={
    'threat_signal':     function(d){return d.severity>1?-15:-5;},
    'rate_limit':        function()  {return -10;},
    'ua_change':         function()  {return -20;},
    'console_clear':     function()  {return -5;},
    'iframe_embed':      function()  {return -25;},
    'long_idle':         function()  {return -10;},  /* > 30 min inactive */
  };

  /* ── REQUIRED AUTH LEVEL per action type ─────────────────────── */
  var ACTION_LEVELS={
    'read':           0,    /* any member */
    'task_complete':  20,   /* low risk */
    'profile_update': 40,   /* medium risk */
    'payment':        80,   /* high risk, must re-verify */
    'erasure':        90,   /* critical */
    'admin':          100,  /* owner only */
  };

  /* ── SESSION HEALTH SCORE ─────────────────────────────────────── */
  function adjustScore(delta){
    _sessionScore=Math.max(0,Math.min(100,_sessionScore+delta));
    if(window.OmegaOS)window.OmegaOS.events.emit('guardian:score_change',{score:_sessionScore});
    if(_sessionScore<20){
      /* Critical: force re-auth */
      _forceReauth();
    }
  }

  function _forceReauth(){
    if(window.OmegaNotify)window.OmegaNotify.showToast('SESSION SECURITY CHECK REQUIRED. PLEASE RE-AUTHENTICATE.','error');
    setTimeout(function(){
      if(window.__omegaSb)window.__omegaSb.auth.signOut().then(function(){location.replace('/account.html?reason=security');});
    },3000);
  }

  /* ── ZERO TRUST ACTION GATE ───────────────────────────────────── */
  async function gate(actionType, fn, context){
    var requiredScore=ACTION_LEVELS[actionType]||0;
    if(_sessionScore<requiredScore){
      _deniedCount++;
      _logAudit(actionType,'denied',context,'score_too_low:'+_sessionScore+'<'+requiredScore);
      if(window.OmegaNotify)window.OmegaNotify.showToast('ACTION DENIED: Security score insufficient.','error');
      if(window.OmegaTelemetry)window.OmegaTelemetry.track('guardian_denied',{action:actionType,score:_sessionScore});
      throw new Error('Guardian denied: '+actionType);
    }

    /* Check with backend gate() for high-privilege actions (grant_permanent_access, revoke_member, extend_trial) */
    var isHighPrivilege=actionType==='admin'||actionType==='payment'||actionType==='erasure';
    if(isHighPrivilege&&window.__omegaSb){
      try{
        var gateCheck=await window.__omegaSb.rpc('check_gate',{p_action:actionType,p_risk_score:_sessionScore});
        if(gateCheck.error||!gateCheck.data||!gateCheck.data.passed){
          _deniedCount++;
          _logAudit(actionType,'denied',context,'backend_gate_check_failed');
          if(window.OmegaNotify)window.OmegaNotify.showToast('ACTION DENIED by security gate. Risk score: '+_sessionScore+'/100','error');
          throw new Error('Guardian gate denied: '+actionType);
        }
      }catch(err){
        _logAudit(actionType,'denied',context,'gate_rpc_error:'+err.message);
        if(window.OmegaNotify)window.OmegaNotify.showToast('Security verification failed. Please try again.','error');
        throw err;
      }
    }

    /* Verify session is still valid */
    var now=Date.now();
    if(now-_lastVerified>900000&&requiredScore>=40){  /* 15 min */
      if(window.__omegaSb){
        var r=await window.__omegaSb.auth.getSession();
        if(!r.data.session){_forceReauth();throw new Error('Session expired');}
        _lastVerified=now;
      }
    }
    _logAudit(actionType,'allowed',context,'score:'+_sessionScore);
    try{return await fn();}
    catch(err){
      adjustScore(-5); /* failed action = minor risk increase */
      throw err;
    }
  }

  function _logAudit(action, outcome, context, reason){
    var entry={ts:new Date().toISOString(),action:action,outcome:outcome,reason:reason,score:_sessionScore,uid:_uid||'?'};
    if(window.OmegaTelemetry)window.OmegaTelemetry.track('guardian_audit',entry);
    if(window.OmegaOS)window.OmegaOS.events.emit('guardian:audit',entry);
  }

  /* ── IDLE DETECTION ───────────────────────────────────────────── */
  var _lastActivity=Date.now();
  ['mousemove','keydown','click','scroll','touchstart'].forEach(function(ev){
    document.addEventListener(ev,function(){_lastActivity=Date.now();},true);
  });
  setInterval(function(){
    var idle=Date.now()-_lastActivity;
    if(idle>1800000) adjustScore(-10);  /* 30 min idle */
  },300000);  /* check every 5 min */

  /* ── LISTEN TO THREAT ENGINE ──────────────────────────────────── */
  if(window.OmegaOS){
    Object.keys(RISK_EVENTS).forEach(function(event){
      window.OmegaOS.events.on(event,function(d){
        adjustScore(RISK_EVENTS[event](d));
      });
    });
  }

  /* ── VISUAL SCORE INDICATOR (guardian badge in topbar) ─────────── */
  function updateBadge(){
    var badge=document.getElementById('omega-guardian-badge');
    if(!badge) return;
    var col=_sessionScore>=70?'var(--green,#3fb27f)':_sessionScore>=40?'var(--solar,#E2C86D)':'var(--crim,#C4453C)';
    badge.style.color=col;
    badge.title='Guardian Score: '+_sessionScore+'/100';
    badge.textContent=_sessionScore;
  }
  function injectGuardianBadge(){
    if(document.getElementById('omega-guardian-badge')) return;
    var badge=document.createElement('span');
    badge.id='omega-guardian-badge';
    badge.style.cssText='font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:1px;color:var(--green,#3fb27f);cursor:pointer;flex-shrink:0;min-width:28px;text-align:center';
    badge.setAttribute('aria-label','Session security score');
    badge.title='Guardian Score: 100/100';
    badge.textContent='100';
    badge.addEventListener('click',function(){
      if(window.OmegaNotify)window.OmegaNotify.showToast('GUARDIAN SCORE: '+_sessionScore+'/100 \u00b7 Zero Trust Session Active','info');
    });
    var topbar=document.querySelector('.topbar');
    if(topbar) topbar.appendChild(badge);
  }

  /* ── INIT ─────────────────────────────────────────────────────── */
  document.addEventListener('omega:populated',function(e){
    var pr=e.detail&&e.detail.profile;
    if(pr){_uid=pr.id;injectGuardianBadge();}
  });
  setInterval(updateBadge,2000);

  window.OmegaGuardian={
    gate:gate,
    score:function(){return _sessionScore;},
    adjust:adjustScore,
    ACTION_LEVELS:ACTION_LEVELS
  };
})();
