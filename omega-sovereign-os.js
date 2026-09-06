/* ========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN OPERATING SYSTEM
   Central platform runtime: health, events, resilience, telemetry and visual evolution.
   ======================================================================== */
(function(){
  if(window.__omegaOS) return;
  window.__omegaOS=true;
  var OS_VERSION='1.3.1',PHI=1.6180339887,EU=2.7182818285,SESSION_ID=([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,function(c){return(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16);});
  var _listeners={},_user_id=null;
  var EventBus={on:function(e,f){(_listeners[e]||(_listeners[e]=[])).push(f);},off:function(e,f){if(_listeners[e])_listeners[e]=_listeners[e].filter(function(x){return x!==f;});},emit:function(e,d){(_listeners[e]||[]).forEach(function(f){try{f(d);}catch(x){}});try{document.dispatchEvent(new CustomEvent('omega:'+e,{detail:d,bubbles:false}));}catch(x){}}};
  function CircuitBreaker(name,opts){opts=opts||{};this.name=name;this.state='CLOSED';this.failures=0;this.threshold=opts.threshold||3;this.timeout=opts.timeout||10000;this._timer=null;}
  CircuitBreaker.prototype.call=function(fn,fallback){var s=this;if(s.state==='OPEN')return fallback?Promise.resolve(fallback()):Promise.reject(new Error('Circuit '+s.name+' OPEN'));return Promise.resolve().then(fn).then(function(r){s.failures=0;if(s.state==='HALF_OPEN')s.state='CLOSED';return r;}).catch(function(err){s.failures++;if(s.failures>=s.threshold){s.state='OPEN';EventBus.emit('circuit_open',{name:s.name,failures:s.failures});s._timer=setTimeout(function(){s.state='HALF_OPEN';s.failures=0;},s.timeout);}if(fallback)return fallback();throw err;});};
  var Health={_metrics:{},record:function(k,v,u){this._metrics[k]={value:v,unit:u||'ms',ts:Date.now()};},get:function(k){return this._metrics[k];},all:function(){return Object.assign({},this._metrics);}};
  function syncAuth(){if(!window.__omegaSb||!window.__omegaSb.auth)return;window.__omegaSb.auth.getSession().then(function(r){_user_id=r&&r.data&&r.data.session&&r.data.session.user&&r.data.session.user.id||null;}).catch(function(){_user_id=null;});}
  syncAuth();
  if(window.__omegaSb&&window.__omegaSb.auth&&window.__omegaSb.auth.onAuthStateChange)window.__omegaSb.auth.onAuthStateChange(function(_event,session){_user_id=session&&session.user?session.user.id:null;});
  window.addEventListener('load',function(){try{var n=performance.getEntriesByType('navigation')[0];if(n){Health.record('ttfb',Math.round(n.responseStart));Health.record('dom_complete',Math.round(n.domComplete));Health.record('load_event',Math.round(n.loadEventEnd));}var p=performance.getEntriesByName('first-contentful-paint')[0];if(p)Health.record('fcp',Math.round(p.startTime));EventBus.emit('page_loaded',{page:location.pathname,session:SESSION_ID});}catch(e){}});
  try{new PerformanceObserver(function(l){var e=l.getEntries();if(e.length)Health.record('lcp',Math.round(e[e.length-1].startTime));}).observe({type:'largest-contentful-paint',buffered:true});}catch(e){}
  var _session_start=Date.now(),_page=location.pathname.replace(/^\/|\.html$/g,'')||'home';
  function writeEvent(row){if(!window.__omegaSb||!_user_id)return Promise.resolve({skipped:true});row.user_id=_user_id;return window.__omegaSb.from('platform_events').insert(row);}
  window.addEventListener('beforeunload',function(){var d=Math.round((Date.now()-_session_start)/1000);Health.record('session_duration',d,'s');EventBus.emit('page_exit',{page:_page,duration:d,session:SESSION_ID});writeEvent({event_type:'session_end',page:_page,duration_s:d,session_id:SESSION_ID,metrics:Health.all()});});
  document.addEventListener('visibilitychange',function(){EventBus.emit(document.hidden?'session_hidden':'session_visible',{page:_page,session:SESSION_ID,ts:Date.now()});});
  var _sbCircuit=new CircuitBreaker('supabase_db',{threshold:3,timeout:15000});
  function safeQuery(fn,fallback){return _sbCircuit.call(fn,fallback||function(){return null;});}
  function flush(){if(!window.__omegaSb||!_user_id)return;safeQuery(function(){return writeEvent({event_type:'heartbeat',page:_page,session_id:SESSION_ID,metrics:{lcp:(Health.get('lcp')||{}).value,fcp:(Health.get('fcp')||{}).value,ttfb:(Health.get('ttfb')||{}).value,load:(Health.get('load_event')||{}).value},os_version:OS_VERSION});});}
  setTimeout(function(){flush();setInterval(flush,60000);},5000);
  window.addEventListener('error',function(e){EventBus.emit('js_error',{msg:e.message,file:e.filename,line:e.lineno,page:_page,session:SESSION_ID});});
  window.addEventListener('unhandledrejection',function(e){EventBus.emit('promise_error',{msg:String(e.reason),page:_page,session:SESSION_ID});});
  function loadScript(src,attr,ready){if(document.querySelector('script['+attr+']'))return;var s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(attr,'1');if(ready)s.onload=ready;(document.body||document.documentElement).appendChild(s);}
  function mountVisualLayer(){if(document.querySelector('link[data-omega-visual]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href='/omega-visual-evolution.css';l.setAttribute('data-omega-visual','1');(document.head||document.documentElement).appendChild(l);function rail(){if(document.querySelector('.omega-visual-rail'))return;var e=document.createElement('div');e.className='omega-visual-rail';e.setAttribute('aria-hidden','true');(document.body||document.documentElement).appendChild(e);}if(document.body)rail();else document.addEventListener('DOMContentLoaded',rail,{once:true});EventBus.emit('visual_layer_ready',{version:'3.0.0',page:_page});}
  mountVisualLayer();
  window.OmegaOS={version:OS_VERSION,session:SESSION_ID,events:EventBus,health:Health,circuit:CircuitBreaker,safeQuery:safeQuery,page:_page,PHI:PHI,EU:EU,APEX:27.8367,TRIAL:557,DEDICATION:33437,FORMULA:'sqrt(A³+B³+C³)×φ/e',visual:{version:'3.0.0',stylesheet:'/omega-visual-evolution.css'},auth:function(a,b,c){return Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;}};
})();
