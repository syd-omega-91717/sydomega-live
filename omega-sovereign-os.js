/* ========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN OPERATING SYSTEM (omega-sovereign-os.js)
   Central platform runtime: health, events, resilience, telemetry and visual evolution.
   ======================================================================== */
(function(){
  if(window.__omegaOS) return;
  window.__omegaOS = true;

  var OS_VERSION = '1.3.0';
  var PHI = 1.6180339887, EU = 2.7182818285;
  var SESSION_ID = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,function(c){
    return (c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16);
  });

  var _listeners = {};
  var EventBus = {
    on:function(event,fn){(_listeners[event]||(_listeners[event]=[])).push(fn);},
    off:function(event,fn){if(_listeners[event]) _listeners[event]=_listeners[event].filter(function(f){return f!==fn;});},
    emit:function(event,data){
      (_listeners[event]||[]).forEach(function(fn){try{fn(data);}catch(e){}});
      try{document.dispatchEvent(new CustomEvent('omega:'+event,{detail:data,bubbles:false}));}catch(e){}
    }
  };

  function CircuitBreaker(name,opts){
    opts=opts||{};this.name=name;this.state='CLOSED';this.failures=0;
    this.threshold=opts.threshold||3;this.timeout=opts.timeout||10000;this._timer=null;
  }
  CircuitBreaker.prototype.call=function(fn,fallback){
    var self=this;
    if(self.state==='OPEN') return fallback?Promise.resolve(fallback()):Promise.reject(new Error('Circuit '+self.name+' OPEN'));
    return Promise.resolve().then(fn).then(function(result){self.failures=0;if(self.state==='HALF_OPEN')self.state='CLOSED';return result;}).catch(function(err){
      self.failures++;
      if(self.failures>=self.threshold){self.state='OPEN';EventBus.emit('circuit_open',{name:self.name,failures:self.failures});self._timer=setTimeout(function(){self.state='HALF_OPEN';self.failures=0;},self.timeout);}
      if(fallback)return fallback();throw err;
    });
  };

  var Health={_metrics:{},record:function(key,value,unit){this._metrics[key]={value:value,unit:unit||'ms',ts:Date.now()};},get:function(key){return this._metrics[key];},all:function(){return Object.assign({},this._metrics);}};
  window.addEventListener('load',function(){
    try{
      var nav=performance.getEntriesByType('navigation')[0];
      if(nav){Health.record('ttfb',Math.round(nav.responseStart));Health.record('dom_complete',Math.round(nav.domComplete));Health.record('load_event',Math.round(nav.loadEventEnd));}
      var paint=performance.getEntriesByName('first-contentful-paint')[0];if(paint)Health.record('fcp',Math.round(paint.startTime));
      EventBus.emit('page_loaded',{page:location.pathname,session:SESSION_ID});
    }catch(e){}
  });
  try{new PerformanceObserver(function(list){var e=list.getEntries();if(e.length)Health.record('lcp',Math.round(e[e.length-1].startTime));}).observe({type:'largest-contentful-paint',buffered:true});}catch(e){}

  var _session_start=Date.now(),_page=location.pathname.replace(/^\/|\.html$/g,'')||'home';
  window.addEventListener('beforeunload',function(){
    var duration=Math.round((Date.now()-_session_start)/1000);Health.record('session_duration',duration,'s');
    EventBus.emit('page_exit',{page:_page,duration:duration,session:SESSION_ID});
    if(window.__omegaSb&&navigator.sendBeacon){try{window.__omegaSb.from('platform_events').insert({event_type:'session_end',page:_page,duration_s:duration,session_id:SESSION_ID,metrics:Health.all()}).then(function(){});}catch(e){}}
  });
  document.addEventListener('visibilitychange',function(){EventBus.emit(document.hidden?'session_hidden':'session_visible',{page:_page,session:SESSION_ID,ts:Date.now()});});

  var _sbCircuit=new CircuitBreaker('supabase_db',{threshold:3,timeout:15000});
  function safeQuery(fn,fallback){return _sbCircuit.call(fn,fallback||function(){return null;});}
  function flush(){
    if(!window.__omegaSb)return;
    safeQuery(function(){return window.__omegaSb.from('platform_events').insert({event_type:'heartbeat',page:_page,session_id:SESSION_ID,metrics:{lcp:(Health.get('lcp')||{}).value,fcp:(Health.get('fcp')||{}).value,ttfb:(Health.get('ttfb')||{}).value,load:(Health.get('load_event')||{}).value},os_version:OS_VERSION});});
  }
  setTimeout(function(){flush();setInterval(flush,60000);},5000);

  window.addEventListener('error',function(e){EventBus.emit('js_error',{msg:e.message,file:e.filename,line:e.lineno,page:_page,session:SESSION_ID});});
  window.addEventListener('unhandledrejection',function(e){EventBus.emit('promise_error',{msg:String(e.reason),page:_page,session:SESSION_ID});});

  function loadScript(src,attr,ready){
    if(document.querySelector('script['+attr+']'))return;
    var s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(attr,'1');
    if(ready)s.onload=ready;
    (document.body||document.documentElement).appendChild(s);
  }
  function mountVisualLayer(){
    if(document.querySelector('link[data-omega-visual]')) return;
    var link=document.createElement('link');link.rel='stylesheet';link.href='/omega-visual-evolution.css';link.setAttribute('data-omega-visual','1');
    (document.head||document.documentElement).appendChild(link);
    function rail(){if(document.querySelector('.omega-visual-rail'))return;var el=document.createElement('div');el.className='omega-visual-rail';el.setAttribute('aria-hidden','true');(document.body||document.documentElement).appendChild(el);}
    if(document.body)rail();else document.addEventListener('DOMContentLoaded',rail,{once:true});
    EventBus.emit('visual_layer_ready',{version:'3.0.0',page:_page});
  }
  function mountCinematicEngine(){
    loadScript('/omega-cinematic-engine.js','data-omega-cinematic',function(){EventBus.emit('cinematic_engine_loaded',{version:'1.1.0',page:_page});});
    EventBus.emit('cinematic_engine_ready',{version:'1.1.0',page:_page});
  }
  function mountApexVisual(){
    loadScript('/omega-apex-visual.js','data-omega-apex',function(){EventBus.emit('apex_visual_loaded',{version:'1.0.0',page:_page});});
  }

  mountVisualLayer();
  mountCinematicEngine();
  mountApexVisual();

  window.OmegaOS={version:OS_VERSION,session:SESSION_ID,events:EventBus,health:Health,circuit:CircuitBreaker,safeQuery:safeQuery,page:_page,PHI:PHI,EU:EU,APEX:27.8367,TRIAL:557,DEDICATION:33437,FORMULA:'sqrt(A³+B³+C³)×φ/e',visual:{version:'3.0.0',stylesheet:'/omega-visual-evolution.css',cinematic:'/omega-cinematic-engine.js',apex:'/omega-apex-visual.js'},auth:function(a,b,c){return Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;}};
})();
