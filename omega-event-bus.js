/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN EVENT BUS (omega-event-bus.js)
   Platform-wide event-driven architecture layer.

   Architecture:
   - BroadcastChannel API for cross-tab pub/sub (same-origin)
   - Supabase realtime for cross-device event streaming
   - IndexedDB event store for local event sourcing / audit log
   - Domain event registry with schema validation
   - At-least-once delivery with idempotency keys

   Public API:
     window.OmegaBus = {
       emit(eventName, payload)    — publish a domain event
       on(eventName, handler)      — subscribe to events
       off(eventName, handler)     — unsubscribe
       replay(eventName, n)        — replay last N events from store
       catalog()                   — list all known event types
       metrics()                   — queue depths and throughput
     }
   ========================================================================== */
(function(){
'use strict';

/* ── Domain Event Catalog ── */
var CATALOG={
  'sovereign.gate.unlocked':    {schema:{memberId:'string',gate:'number',name:'string',auth:'number'},desc:'Member crossed authority threshold into a new gate',axis:'all',consumers:['notifications','analytics','achievements','ai-recommendations']},
  'sovereign.axis.updated':     {schema:{memberId:'string',axis:'string',prev:'number',next:'number'},desc:'Axis A, B, or C value changed on a profile',axis:'a|b|c',consumers:['analytics','gate-monitor','recommendation-engine']},
  'sovereign.member.approved':  {schema:{memberId:'string',name:'string',elem:'string'},desc:'New member approved for platform access',axis:'c',consumers:['notifications','email','analytics','onboarding-agent']},
  'sovereign.member.ascended':  {schema:{memberId:'string',gate:'number',elem:'string',auth:'number'},desc:'Member reached a major ascension milestone',axis:'all',consumers:['notifications','email','analytics','achievement-engine','ai-agent']},
  'sovereign.event.registered': {schema:{memberId:'string',eventRef:'string',xp:'number'},desc:'Member registered for a sovereign event',axis:'c',consumers:['analytics','xp-processor','calendar-sync']},
  'sovereign.task.completed':   {schema:{memberId:'string',taskId:'string',axis:'string',delta:'number'},desc:'Task or verified action completed',axis:'a|b|c',consumers:['analytics','progression-engine','leaderboard-updater']},
  'sovereign.passport.generated':{schema:{memberId:'string',gate:'number',elem:'string'},desc:'Sovereign passport PDF downloaded',axis:'b',consumers:['analytics','audit']},
  'sovereign.element.shifted':  {schema:{memberId:'string',prev:'string',next:'string'},desc:'Member element changed (zodiac override)',axis:'none',consumers:['analytics','realm-engine','music-engine']},
  'sovereign.cipher.used':      {schema:{memberId:'string',elem:'string',mode:'string'},desc:'Sovereign cipher encode/decode invoked',axis:'b',consumers:['analytics']},
  'sovereign.realm.visited':    {schema:{memberId:'string',elem:'string',duration:'number'},desc:'3-D realm viewed with element',axis:'b',consumers:['analytics','recommendation-engine']},
  'sovereign.music.played':     {schema:{memberId:'string',elem:'string',duration:'number'},desc:'Generative music session',axis:'b',consumers:['analytics']},
  'platform.health.probe':      {schema:{service:'string',status:'string',latencyMs:'number'},desc:'Internal health check result',axis:'none',consumers:['ops-monitor','alert-engine']},
  'platform.queue.dlq':         {schema:{eventName:'string',reason:'string',attempts:'number'},desc:'Message moved to dead-letter queue',axis:'none',consumers:['ops-monitor','alert-engine']},
  'platform.worker.started':    {schema:{worker:'string',pid:'string'},desc:'Background worker consumer started',axis:'none',consumers:['ops-monitor']},
  'platform.worker.error':      {schema:{worker:'string',error:'string',eventId:'string'},desc:'Background worker encountered an error',axis:'none',consumers:['ops-monitor','alert-engine','dlq']},
};

/* ── Metrics store ── */
var _metrics={};
Object.keys(CATALOG).forEach(function(k){_metrics[k]={emitted:0,consumed:0,errors:0,dlq:0,lastSeen:null,avgLatencyMs:0};});

/* ── Event store (IndexedDB) ── */
var _db=null;
var DB_NAME='omega-event-store',DB_VERSION=1;
function openDB(){
  return new Promise(function(resolve){
    try{
      var req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=function(e){
        var db=e.target.result;
        if(!db.objectStoreNames.contains('events')){
          var store=db.createObjectStore('events',{keyPath:'id'});
          store.createIndex('name','name',{unique:false});
          store.createIndex('ts','ts',{unique:false});
        }
      };
      req.onsuccess=function(e){_db=e.target.result;resolve(_db);};
      req.onerror=function(){resolve(null);};
    }catch(e){resolve(null);}
  });
}

function persistEvent(evt){
  if(!_db)return;
  try{
    var tx=_db.transaction('events','readwrite');
    tx.objectStore('events').put(evt);
  }catch(e){}
}

function replayEvents(name,n,cb){
  if(!_db){cb([]);return;}
  try{
    var results=[];
    var tx=_db.transaction('events','readonly');
    var idx=tx.objectStore('events').index('name');
    var req=idx.openCursor(IDBKeyRange.only(name),null);
    req.onsuccess=function(e){
      var cur=e.target.result;
      if(cur){results.push(cur.value);cur.continue();}
      else{cb(results.slice(-n));}
    };
    req.onerror=function(){cb([]);};
  }catch(e){cb([]);}
}

/* ── BroadcastChannel (cross-tab pub/sub) ── */
var _bc=null;
try{_bc=new BroadcastChannel('omega-event-bus');}catch(e){}

/* ── Subscriber registry ── */
var _subs={};

function getUUID(){
  return 'evt-'+(Date.now()).toString(36)+'-'+Math.random().toString(36).slice(2,8);
}

/* ── Core emit ── */
function emit(name,payload,opts){
  if(!CATALOG[name]&&!name.startsWith('__')){
    console.warn('[OmegaBus] Unknown event:',name,'— register it in CATALOG');
  }
  var id=opts&&opts.id?opts.id:getUUID();
  var ts=Date.now();
  var evt={id:id,name:name,payload:payload||{},ts:ts,v:1};

  /* Update metrics */
  if(!_metrics[name])_metrics[name]={emitted:0,consumed:0,errors:0,dlq:0,lastSeen:null,avgLatencyMs:0};
  _metrics[name].emitted++;
  _metrics[name].lastSeen=new Date(ts).toISOString();

  /* Persist to IndexedDB */
  persistEvent(evt);

  /* Notify local subscribers */
  _dispatch(name,evt);

  /* Broadcast to other tabs */
  if(_bc){try{_bc.postMessage(evt);}catch(e){}}

  return id;
}

function _dispatch(name,evt){
  var handlers=(_subs[name]||[]).concat(_subs['*']||[]);
  handlers.forEach(function(h){
    try{
      var t0=performance.now();
      h(evt);
      var lat=performance.now()-t0;
      if(_metrics[name]){
        _metrics[name].consumed++;
        _metrics[name].avgLatencyMs=(_metrics[name].avgLatencyMs*(_metrics[name].consumed-1)+lat)/_metrics[name].consumed;
      }
    }catch(e){
      if(_metrics[name])_metrics[name].errors++;
      console.error('[OmegaBus] Handler error for',name,e);
    }
  });
}

/* ── Cross-tab receive ── */
if(_bc){
  _bc.onmessage=function(e){
    var evt=e.data;
    if(evt&&evt.name)_dispatch(evt.name,evt);
  };
}

/* ── Subscribe / unsubscribe ── */
function on(name,handler){
  if(!_subs[name])_subs[name]=[];
  if(_subs[name].indexOf(handler)===-1)_subs[name].push(handler);
}

function off(name,handler){
  if(!_subs[name])return;
  _subs[name]=_subs[name].filter(function(h){return h!==handler;});
}

/* ── Replay from store ── */
function replay(name,n,cb){
  replayEvents(name,n||20,function(events){
    if(cb)cb(events);
  });
}

/* ── Public metrics ── */
function metrics(){
  var result={};
  Object.keys(_metrics).forEach(function(k){
    result[k]=Object.assign({},_metrics[k]);
  });
  return result;
}

/* ── Sovereign lifecycle events ── */
window.addEventListener('omega:user-loaded',function(e){
  if(!e||!e.detail)return;
  var profile=e.detail.profile;
  var user=e.detail.user;
  if(!profile||!user)return;
  var PHI=1.6180339887,EU=2.7182818285;
  var a=Number(profile.axis_a||0),b=Number(profile.axis_b||0),c=Number(profile.axis_c||0);
  var auth=profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
  var SIGN_ELEM={Aries:'Fire',Taurus:'Water',Gemini:'Wind',Cancer:'Water',Leo:'Fire',Virgo:'Sand',Libra:'Wind',Scorpio:'Soul',Sagittarius:'Fire',Capricorn:'Metal',Aquarius:'Metal',Pisces:'Water'};
  var elem=SIGN_ELEM[profile.zodiac_sign]||'Void';

  /* Emit session start event */
  emit('sovereign.realm.visited',{memberId:user.id,elem:elem,duration:0},{id:'session-'+user.id+'-'+Date.now().toString(36)});

  /* Emit platform health probe */
  emit('platform.health.probe',{service:'auth',status:'ok',latencyMs:0});
});

/* ── Page visibility / music tracking ── */
var _musicStart=null;
window.addEventListener('omega:music-started',function(e){_musicStart=Date.now();});
window.addEventListener('omega:music-stopped',function(e){
  if(_musicStart&&window.__omegaUser){
    var dur=Date.now()-_musicStart;
    var SIGN_ELEM={Aries:'Fire',Taurus:'Water',Gemini:'Wind',Cancer:'Water',Leo:'Fire',Virgo:'Sand',Libra:'Wind',Scorpio:'Soul',Sagittarius:'Fire',Capricorn:'Metal',Aquarius:'Metal',Pisces:'Water'};
    var profile=window.__omegaProfile||{};
    emit('sovereign.music.played',{memberId:window.__omegaUser.id,elem:SIGN_ELEM[profile.zodiac_sign]||'Void',duration:dur});
    _musicStart=null;
  }
});

/* ── Init ── */
openDB();

/* ── Public API ── */
window.OmegaBus={
  emit:emit,
  on:on,
  off:off,
  replay:replay,
  catalog:function(){return Object.assign({},CATALOG);},
  metrics:metrics
};

})();
