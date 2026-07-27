/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN OPERATING SYSTEM (omega-sovereign-os.js)
   
   The platform's central nervous system. Inspired by:
   - Google SRE: Error budgets, SLOs, automated incident detection
   - Netflix: Chaos engineering, circuit breakers, self-healing
   - Palantir Foundry: Operational intelligence, data ontology
   - SpaceX: First-principles reliability, autonomous failure recovery
   - Tesla: Real-time telemetry, over-the-air evolution
   
   Responsibilities:
   A. HEALTH MONITORING — Core Web Vitals, API latency, error rates
   B. EVENT BUS         — Platform-wide typed event system
   C. CIRCUIT BREAKERS  — Automatic degradation on failures
   D. SELF-HEALING      — Retry logic, fallback chains, recovery
   E. TELEMETRY         — All signals piped to Supabase for SRE dashboard
   F. LIFECYCLE         — Page load → session → exit tracking
   ========================================================================== */
(function(){
  if(window.__omegaOS) return;
  window.__omegaOS = true;

  var OS_VERSION = '1.0.0';
  var PHI = 1.6180339887, EU = 2.7182818285;
  var SESSION_ID = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,function(c){
    return (c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16);
  });

  /* ── A. EVENT BUS ─────────────────────────────────────────────── */
  var _listeners = {};
  var EventBus = {
    on: function(event, fn){ (_listeners[event]||(_listeners[event]=[])).push(fn); },
    off: function(event, fn){ if(_listeners[event]) _listeners[event]=_listeners[event].filter(function(f){return f!==fn;}); },
    emit: function(event, data){
      var handlers = _listeners[event]||[];
      handlers.forEach(function(fn){ try{fn(data);}catch(e){} });
      /* Also emit as DOM CustomEvent for cross-engine communication */
      try{ document.dispatchEvent(new CustomEvent('omega:'+event,{detail:data,bubbles:false})); }catch(e){}
    }
  };

  /* ── B. CIRCUIT BREAKER ───────────────────────────────────────── */
  function CircuitBreaker(name, opts){
    opts = opts||{};
    this.name = name;
    this.state = 'CLOSED'; /* CLOSED=normal, OPEN=failing, HALF_OPEN=testing */
    this.failures = 0;
    this.threshold = opts.threshold||3;
    this.timeout = opts.timeout||10000;
    this._timer = null;
  }
  CircuitBreaker.prototype.call = function(fn, fallback){
    var self = this;
    if(self.state==='OPEN'){
      if(fallback) return Promise.resolve(fallback());
      return Promise.reject(new Error('Circuit '+self.name+' OPEN'));
    }
    return Promise.resolve(fn()).then(function(result){
      self.failures = 0;
      if(self.state==='HALF_OPEN') self.state='CLOSED';
      return result;
    }).catch(function(err){
      self.failures++;
      if(self.failures>=self.threshold){
        self.state='OPEN';
        EventBus.emit('circuit_open',{name:self.name,failures:self.failures});
        self._timer = setTimeout(function(){ self.state='HALF_OPEN'; self.failures=0; }, self.timeout);
      }
      if(fallback) return fallback();
      throw err;
    });
  };

  /* ── C. HEALTH MONITOR ────────────────────────────────────────── */
  var Health = {
    _metrics: {},
    record: function(key, value, unit){
      this._metrics[key] = {value:value,unit:unit||'ms',ts:Date.now()};
    },
    get: function(key){ return this._metrics[key]; },
    all: function(){ return Object.assign({},this._metrics); }
  };

  /* Page load performance */
  window.addEventListener('load',function(){
    try{
      var nav = performance.getEntriesByType('navigation')[0];
      if(nav){
        Health.record('ttfb', Math.round(nav.responseStart));
        Health.record('dom_complete', Math.round(nav.domComplete));
        Health.record('load_event', Math.round(nav.loadEventEnd));
      }
      var paint = performance.getEntriesByName('first-contentful-paint')[0];
      if(paint) Health.record('fcp', Math.round(paint.startTime));
      EventBus.emit('page_loaded', {page: location.pathname, session: SESSION_ID});
    }catch(e){}
  });

  /* LCP observer */
  try{
    new PerformanceObserver(function(list){
      var e = list.getEntries();
      if(e.length) Health.record('lcp', Math.round(e[e.length-1].startTime));
    }).observe({type:'largest-contentful-paint',buffered:true});
  }catch(e){}

  /* ── D. SESSION LIFECYCLE ─────────────────────────────────────── */
  var _session_start = Date.now();
  var _page = location.pathname.replace(/^\/|\.html$/g,'') || 'home';

  /* Exit tracking */
  window.addEventListener('beforeunload',function(){
    var duration = Math.round((Date.now()-_session_start)/1000);
    Health.record('session_duration', duration, 's');
    EventBus.emit('page_exit',{page:_page,duration:duration,session:SESSION_ID});
    /* Beacon to Supabase (best-effort) */
    if(window.__omegaSb && navigator.sendBeacon){
      try{
        var sb = window.__omegaSb;
        sb.from('platform_events').insert({
          event_type:'session_end',
          page:_page,
          duration_s:duration,
          session_id:SESSION_ID,
          metrics:Health.all()
        }).then(function(){});
      }catch(e){}
    }
  });

  /* Visibility change — pause dedication when hidden */
  document.addEventListener('visibilitychange',function(){
    EventBus.emit(document.hidden?'session_hidden':'session_visible',{
      page:_page, session:SESSION_ID, ts:Date.now()
    });
  });

  /* ── E. SELF-HEALING SUPABASE WRAPPER ─────────────────────────── */
  var _sbCircuit = new CircuitBreaker('supabase_db',{threshold:3,timeout:15000});
  function safeQuery(fn, fallback){
    return _sbCircuit.call(fn, fallback||function(){ return null; });
  }

  /* ── F. PLATFORM TELEMETRY ────────────────────────────────────── */
  function flush(){
    if(!window.__omegaSb) return;
    safeQuery(function(){
      return window.__omegaSb.from('platform_events').insert({
        event_type:'heartbeat',
        page:_page,
        session_id:SESSION_ID,
        metrics:{
          lcp: (Health.get('lcp')||{}).value,
          fcp: (Health.get('fcp')||{}).value,
          ttfb:(Health.get('ttfb')||{}).value,
          load:(Health.get('load_event')||{}).value
        },
        os_version:OS_VERSION
      });
    });
  }
  /* First flush 5s after load, then every 60s */
  setTimeout(function(){
    flush();
    setInterval(flush,60000);
  },5000);

  /* ── G. ERROR INTERCEPTOR ─────────────────────────────────────── */
  window.addEventListener('error',function(e){
    EventBus.emit('js_error',{
      msg:e.message, file:e.filename, line:e.lineno,
      page:_page, session:SESSION_ID
    });
  });
  window.addEventListener('unhandledrejection',function(e){
    EventBus.emit('promise_error',{
      msg:String(e.reason), page:_page, session:SESSION_ID
    });
  });

  /* ── PUBLIC API ────────────────────────────────────────────────── */
  window.OmegaOS = {
    version: OS_VERSION,
    session: SESSION_ID,
    events: EventBus,
    health: Health,
    circuit: CircuitBreaker,
    safeQuery: safeQuery,
    page: _page,
    PHI: PHI,
    EU: EU,
    APEX: 27.8367,
    TRIAL: 557,
    DEDICATION: 33437,
    FORMULA: 'sqrt(A³+B³+C³)×φ/e',
    auth: function(a,b,c){
      return Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
    }
  };
})();
