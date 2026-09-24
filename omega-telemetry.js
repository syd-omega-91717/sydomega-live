/* ==========================================================================
   Ω SYD OMEGA 91717 — TELEMETRY & USER JOURNEY ANALYTICS (omega-telemetry.js)
   
   Directive: "Every user action triggers useful system behavior.
   Every subsystem integrates with the rest of the platform.
   Missing telemetry / Missing analytics — fix both."
   
   Inspired by:
   - Mixpanel: action tracking, funnel analysis, cohort retention
   - Amplitude: user journey mapping, session replay concept
   - Google Analytics 4: event-based measurement protocol
   - Palantir: operational intelligence from behavioral signals
   
   Events tracked:
   - page_view: page, referrer, session
   - cta_click: button label, page, context
   - tab_switch: from, to, page
   - search_query: query, results_count
   - auth_event: type (login/logout/trial_start)
   - gate_view: gate number, user auth score
   - agent_interact: agent name, query length
   - error_encountered: type, page, context
   ========================================================================== */
(function(){
  if(window.__omegaTelemetryActive) return;
  window.__omegaTelemetryActive = true;

  var _session = (function(){
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,function(c){
      try{return(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16);}catch(e){return Math.floor(Math.random()*16).toString(16);}
    });
  })();
  var _page = location.pathname.replace(/^\/|\.html$/g,'')||'home';
  var _uid = null;
  var _queue = []; /* batch before Supabase is ready */
  var _ready = false;

  /* ── TRACK FUNCTION ───────────────────────────────────────────── */
  function track(event_type, properties){
    var evt = {
      event_type: event_type,
      page: _page,
      session_id: _session,
      user_id: _uid||null,
      properties: properties||{},
      ts: new Date().toISOString()
    };

    /* Emit to OmegaOS event bus */
    if(window.OmegaOS) window.OmegaOS.events.emit('telemetry:'+event_type, evt);

    if(_ready && window.__omegaSb){
      window.__omegaSb.from('telemetry_events')
        .insert({
          user_id:_uid,
          event_type:event_type,
          page:_page,
          session_id:_session,
          properties:evt.properties
        })
        .catch(function(e){ console.warn('[Omega] non-critical async operation failed:', e); });
    } else {
      _queue.push(evt);
    }
  }

  /* ── FLUSH QUEUE ONCE SB READY ────────────────────────────────── */
  function flush(){
    if(!window.__omegaSb||!_uid) return;
    _ready = true;
    var q = _queue.splice(0);
    if(!q.length) return;
    window.__omegaSb.from('telemetry_events')
      .insert(q.map(function(e){ return {user_id:_uid,event_type:e.event_type,page:_page,session_id:_session,properties:e.properties}; }))
      .catch(function(e){ console.warn('[Omega] non-critical async operation failed:', e); });
  }

  /* ── AUTO TRACK PAGE VIEW ─────────────────────────────────────── */
  track('page_view',{referrer:document.referrer.slice(0,100),title:document.title});

  /* ── AUTO TRACK CTA CLICKS ────────────────────────────────────── */
  document.addEventListener('click',function(e){
    var btn = e.target.closest('button,a[role="button"],[data-track]');
    if(!btn) return;
    var label = btn.textContent.trim().slice(0,60)||btn.getAttribute('aria-label')||btn.dataset.track||'button';
    track('cta_click',{label:label,tag:btn.tagName.toLowerCase(),class:(btn.className||'').slice(0,60)});
  },true);

  /* ── AUTO TRACK TAB SWITCHES ──────────────────────────────────── */
  document.addEventListener('click',function(e){
    var btn = e.target.closest('.tab-btn');
    if(!btn) return;
    track('tab_switch',{tab:btn.textContent.trim().slice(0,40),page:_page});
  },true);

  /* ── AUTO TRACK SEARCH ────────────────────────────────────────── */
  document.addEventListener('omega:search_performed',function(e){
    track('search_query',e.detail||{});
  });

  /* ── AUTO TRACK ERRORS ────────────────────────────────────────── */
  if(window.OmegaOS){
    window.OmegaOS.events.on('js_error',function(d){ track('error_encountered',d); });
    window.OmegaOS.events.on('threat_signal',function(d){ track('threat_detected',d); });
  }

  /* ── GATE VIEW TRACKING ───────────────────────────────────────── */
  document.addEventListener('omega:populated',function(e){
    var pr=e.detail&&e.detail.profile;
    if(!pr) return;
    _uid=pr.id;flush();
    var PHI=1.6180339887,EU=2.7182818285;
    var a=Number(pr.axis_a||0.001),b=Number(pr.axis_b||0.001),c=Number(pr.axis_c||0.001);
    var auth=pr.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
    var GATES=[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.517,27.8367];
    var gate=GATES.findIndex(function(g){return auth<g;});
    track('session_start',{
      auth:auth.toFixed(4),
      gate:gate<0?12:gate+1,
      element:pr.element||'?',
      sign:pr.sign||'?',
      is_owner:pr.is_owner||false
    });
  });

  /* ── SESSION END ──────────────────────────────────────────────── */
  window.addEventListener('beforeunload',function(){
    track('session_end',{duration_s:Math.round((Date.now()-performance.timing.navigationStart)/1000)});
  });

  /* ── PUBLIC API ───────────────────────────────────────────────── */
  window.OmegaTelemetry = {
    track: track,
    session: _session,
    page: _page
  };
})();
