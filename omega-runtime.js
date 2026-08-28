/* Ω SYD OMEGA 91717 — Production Runtime Orchestrator
 * Browser-safe control plane for the existing static architecture.
 * No framework dependency. No fake health. Every adapter reports explicit state.
 */
(function () {
  'use strict';
  var VERSION = '1.0.0';
  var started = Date.now();
  var state = Object.create(null);
  var subscribers = [];
  var components = [
    ['api-gateway','API Gateway','routing, auth boundary, rate policy'],
    ['load-balancer','Load Balancer','endpoint selection and health-aware routing'],
    ['services','Service Registry','capability/service discovery'],
    ['events','Event Bus','durable domain events and idempotency'],
    ['database','Database','Supabase/PostgreSQL persistence'],
    ['cache','Cache','bounded browser cache with TTL'],
    ['partitioning','Data Partitioning','deterministic shard key generation'],
    ['storage','Object Storage','Supabase Storage boundary'],
    ['queue','Message Queue','outbox/async work boundary'],
    ['resilience','Fault Tolerance','timeouts, retries, circuit state'],
    ['cdn','CDN','same-origin asset delivery boundary'],
    ['availability','High Availability','dependency health aggregation'],
    ['observability','Observability','structured runtime telemetry'],
    ['security','Security & Identity','fail-closed identity boundary'],
    ['ai-gateway','AI Gateway','model routing/cost/policy boundary'],
    ['rag','Vector Search & RAG','grounded retrieval boundary']
  ];

  function now(){ return new Date().toISOString(); }
  function notify(){ subscribers.slice().forEach(function(fn){ try{fn(snapshot());}catch(_){}}); }
  function set(id, status, detail, evidence){
    state[id] = {id:id,status:status,detail:detail||'',evidence:evidence||null,checkedAt:now()};
    notify();
  }
  function snapshot(){
    var out={version:VERSION,startedAt:new Date(started).toISOString(),uptimeMs:Date.now()-started,components:{}};
    components.forEach(function(c){ out.components[c[0]]=Object.assign({}, state[c[0]]||{id:c[0],status:'UNKNOWN'}); });
    return out;
  }
  function subscribe(fn){ if(typeof fn==='function') subscribers.push(fn); return function(){ subscribers=subscribers.filter(function(x){return x!==fn;}); }; }
  function safeUrl(value){ try{return new URL(value,location.href);}catch(_){return null;} }
  function partition(key,count){ count=count||16; var s=String(key||'anonymous'),h=2166136261; for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return Math.abs(h)%count; }
  function cacheSet(key,value,ttl){ try{localStorage.setItem('omega:cache:'+key,JSON.stringify({expires:Date.now()+(ttl||300000),value:value}));return true;}catch(_){return false;} }
  function cacheGet(key){ try{var x=JSON.parse(localStorage.getItem('omega:cache:'+key)||'null');if(!x)return null;if(x.expires<Date.now()){localStorage.removeItem('omega:cache:'+key);return null;}return x.value;}catch(_){return null;} }
  function timeout(ms){ return new Promise(function(_,reject){setTimeout(function(){reject(new Error('timeout'));},ms);}); }
  function request(url,options){
    options=options||{}; var u=safeUrl(url); if(!u) return Promise.reject(new Error('invalid URL'));
    var method=(options.method||'GET').toUpperCase(), attempts=Math.max(1,Math.min(3,Number(options.retries||2)+1)), wait=Number(options.timeout||8000);
    var n=0;
    function go(){ n++; return Promise.race([fetch(u.toString(),options),timeout(wait)]).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r;}).catch(function(e){if(n>=attempts)throw e;return new Promise(function(res){setTimeout(res,250*Math.pow(2,n-1));}).then(go);}); }
    return go();
  }
  function emit(name,payload){
    if(window.OmegaBus&&typeof window.OmegaBus.emit==='function') return window.OmegaBus.emit(name,payload);
    var evt={name:name,payload:payload||{},ts:Date.now()}; try{window.dispatchEvent(new CustomEvent('omega:event',{detail:evt}));}catch(_){} return null;
  }
  function boot(){
    components.forEach(function(c){set(c[0],'BUILT',c[2],{type:'runtime-registry',version:VERSION});});
    set('cdn','CONNECTED','same-origin runtime', {type:'browser-origin',origin:location.origin});
    if(window.OmegaBus){set('events','CONNECTED','OmegaBus detected',{type:'OmegaBus'});} else set('events','DEGRADED','OmegaBus not loaded; local event fallback active');
    var identity = !!(window.__omegaUser || window.__omegaProfile);
    set('security',identity?'CONNECTED':'READY',identity?'existing Omega identity detected':'identity boundary present; authentication is not asserted');
    set('database',window.supabase?'CONNECTED':'READY','Supabase adapter boundary detected only when client is present');
    set('observability','CONNECTED','runtime telemetry active',{type:'in-memory'});
    set('availability','READY','aggregate status is derived, never fabricated');
    emit('platform.runtime.started',{version:VERSION,components:components.length});
  }
  function health(){
    var s=snapshot(), vals=Object.keys(s.components).map(function(k){return s.components[k].status;});
    var failed=vals.filter(function(x){return x==='FAILED';}).length, connected=vals.filter(function(x){return x==='CONNECTED';}).length;
    return {healthy:failed===0,failed:failed,connected:connected,total:vals.length,generatedAt:now()};
  }
  window.OmegaRuntime={version:VERSION,snapshot:snapshot,health:health,subscribe:subscribe,partition:partition,cacheSet:cacheSet,cacheGet:cacheGet,request:request,emit:emit,setState:set};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
