/* ==========================================================================
   Ω SYD OMEGA 91717 — THREAT INTELLIGENCE ENGINE (omega-threat.js)
   
   Zero Trust security layer for the client. Inspired by:
   - Palantir Gotham: behavioral anomaly detection
   - Cloudflare Zero Trust: verify every request, trust nothing
   - Google BeyondCorp: identity-aware access
   - OWASP ASVS Level 2: client-side security controls
   - DARPA: adversarial threat modeling
   
   Capabilities:
   A. BEHAVIORAL ANOMALY — detect unusual activity patterns
   B. SESSION INTEGRITY   — detect session hijacking signals
   C. INPUT VALIDATION    — sanitise all platform inputs
   D. CONTENT INTEGRITY  — detect DOM tampering / injections
   E. RATE LIMIT CLIENT  — prevent brute force from browser
   F. SUSPICIOUS SIGNALS — log and alert on threat indicators
   ========================================================================== */
(function(){
  if(window.__omegaThreatActive) return;
  window.__omegaThreatActive = true;

  var THREAT_LEVEL = 0; /* 0=clean 1=watch 2=suspicious 3=block */
  var _signals = [];
  var _rateLimitBuckets = {};
  var _sessionStart = Date.now();
  var _actionCount = 0;

  function signal(type, detail, severity){
    severity = severity||1;
    THREAT_LEVEL = Math.min(3, THREAT_LEVEL + severity);
    _signals.push({type:type,detail:detail,severity:severity,ts:Date.now()});
    /* Emit to OS event bus if available */
    if(window.OmegaOS) window.OmegaOS.events.emit('threat_signal',{type:type,detail:detail,level:THREAT_LEVEL});
    /* Log to Supabase if level >= 2 */
    if(THREAT_LEVEL>=2&&window.__omegaSb){
      try{
        window.__omegaSb.auth.getSession().then(function(r){
          var uid=(r.data&&r.data.session)?r.data.session.user.id:'anonymous';
          window.__omegaSb.from('threat_events').insert({
            user_id:uid,
            threat_type:type,
            threat_level:THREAT_LEVEL,
            detail:JSON.stringify(detail),
            page:location.pathname,
            user_agent:navigator.userAgent.slice(0,200)
          }).catch(function(){});
        });
      }catch(e){}
    }
  }

  /* ── A. BEHAVIORAL ANOMALY ────────────────────────────────────── */
  var _lastAction = Date.now();
  var _rapidActions = 0;
  document.addEventListener('click',function(){
    _actionCount++;
    var now=Date.now();
    var gap=now-_lastAction;
    if(gap<80){ _rapidActions++; if(_rapidActions>20) signal('rapid_clicks',{gap:gap,count:_rapidActions},1); }
    else { _rapidActions=0; }
    _lastAction=now;
  },true);

  /* ── B. SESSION INTEGRITY ─────────────────────────────────────── */
  var _storedAgent = navigator.userAgent;
  setInterval(function(){
    if(navigator.userAgent!==_storedAgent){
      signal('ua_change',{was:_storedAgent.slice(0,50),now:navigator.userAgent.slice(0,50)},2);
    }
  },30000);

  /* Detect console clearing (common in devtools attacks) */
  var _consoleClear=0;
  var origClear=console.clear;
  console.clear=function(){_consoleClear++;if(_consoleClear>3)signal('console_clear',{count:_consoleClear},1);origClear&&origClear.apply(this,arguments);};

  /* ── C. RATE LIMITER (client-side) ──────────────────────────── */
  window.OmegaThrottle = function(key, maxCalls, windowMs){
    var now=Date.now();
    var bucket=_rateLimitBuckets[key]||{calls:[],blocked:false};
    bucket.calls=bucket.calls.filter(function(t){return now-t<windowMs;});
    if(bucket.calls.length>=maxCalls){
      if(!bucket.blocked){ signal('rate_limit',{key:key,calls:bucket.calls.length},1); bucket.blocked=true; }
      _rateLimitBuckets[key]=bucket;
      return false;
    }
    bucket.calls.push(now);
    bucket.blocked=false;
    _rateLimitBuckets[key]=bucket;
    return true;
  };

  /* ── D. INPUT SANITISER ──────────────────────────────────────── */
  window.OmegaSanitise = function(input){
    if(typeof input!=='string') return '';
    return input
      .replace(/[<>]/g,'')
      .replace(/javascript:/gi,'')
      .replace(/on\w+\s*=/gi,'')
      .replace(/script/gi,'')
      .replace(/eval\s*\(/gi,'')
      .slice(0,2000);
  };

  /* ── E. DOM INTEGRITY ────────────────────────────────────────── */
  /* Watch for unexpected script injections */
  if(window.MutationObserver){
    var _domObs=new MutationObserver(function(mutations){
      mutations.forEach(function(m){
        m.addedNodes.forEach(function(n){
          if(n.tagName==='SCRIPT'&&!n.getAttribute('data-omega')&&!n.src){
            signal('inline_script_injected',{content:(n.textContent||'').slice(0,100)},2);
          }
        });
      });
    });
    _domObs.observe(document.documentElement,{childList:true,subtree:true});
  }

  /* ── F. VISIBILITY INTEGRITY ─────────────────────────────────── */
  /* Detect if page is in iframe (clickjacking) */
  try{
    if(window.self!==window.top){
      signal('iframe_embed',{parent:document.referrer.slice(0,100)},2);
    }
  }catch(e){}

  /* ── PUBLIC API ─────────────────────────────────────────────── */
  window.OmegaThreat = {
    level:function(){return THREAT_LEVEL;},
    signals:function(){return _signals.slice(-20);},
    throttle:window.OmegaThrottle,
    sanitise:window.OmegaSanitise,
    clear:function(){THREAT_LEVEL=0;_signals=[];}
  };
})();
