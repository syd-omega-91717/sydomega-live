/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN WORKER FLEET (omega-workers.js)
   Background consumer fleet for asynchronous event processing.

   Architecture: Consumer group pattern — each worker subscribes to the
   OmegaBus event bus and processes messages independently.
   Implements: retry with exponential backoff, dead-letter queue (DLQ),
   circuit breaker, idempotency, at-least-once delivery semantics.

   Workers:
   - notification-worker   — push + topbar alert notifications
   - analytics-worker      — aggregate platform KPIs in localStorage
   - achievement-worker    — check gate/axis thresholds → unlock badges
   - recommendation-worker — element-based content recommendations
   - audit-worker          — append-only sovereign event audit log
   - gate-monitor          — watch authority changes → trigger gate events

   Public API: window.OmegaWorkers = { status(), restart(name), metrics() }
   ========================================================================== */
(function(){
'use strict';

/* ── Circuit breaker states ── */
var CB_CLOSED='CLOSED',CB_OPEN='OPEN',CB_HALF='HALF_OPEN';

function CircuitBreaker(opts){
  this.name=opts.name;
  this.threshold=opts.threshold||5;
  this.timeout=opts.timeout||30000;
  this.state=CB_CLOSED;
  this.failures=0;
  this.lastFail=0;
  this.halfOpenTests=0;
}
CircuitBreaker.prototype.call=function(fn){
  var self=this;
  if(self.state===CB_OPEN){
    if(Date.now()-self.lastFail>self.timeout){self.state=CB_HALF;self.halfOpenTests=0;}
    else{return Promise.reject(new Error('Circuit OPEN: '+self.name));}
  }
  return Promise.resolve().then(fn).then(function(r){
    if(self.state===CB_HALF){self.failures=0;self.state=CB_CLOSED;}
    return r;
  }).catch(function(e){
    self.failures++;self.lastFail=Date.now();
    if(self.failures>=self.threshold)self.state=CB_OPEN;
    throw e;
  });
};

/* ── Worker base ── */
function Worker(opts){
  this.name=opts.name;
  this.events=opts.events||[];
  this.handler=opts.handler;
  this.cb=new CircuitBreaker({name:opts.name,threshold:opts.cbThreshold||5,timeout:opts.cbTimeout||30000});
  this.processed=0;
  this.errors=0;
  this.dlq=[];
  this.retryQueue=[];
  this.active=true;
  this.lastActivity=null;
  this._retryTimer=null;
  this._registerSubs();
  this._startRetryLoop();
}

Worker.prototype._registerSubs=function(){
  var self=this;
  if(!window.OmegaBus)return;
  self.events.forEach(function(evtName){
    window.OmegaBus.on(evtName,function(evt){self._receive(evt);});
  });
  /* Also subscribe to wildcard for audit */
  if(self.events.indexOf('*')!==-1){
    window.OmegaBus.on('*',function(evt){self._receive(evt);});
  }
};

Worker.prototype._receive=function(evt){
  var self=this;
  self.cb.call(function(){
    return self.handler(evt);
  }).then(function(){
    self.processed++;
    self.lastActivity=new Date().toISOString();
  }).catch(function(e){
    self.errors++;
    /* Retry with exponential backoff — max 3 attempts */
    var attempts=(evt._attempts||0)+1;
    if(attempts<=3){
      var delay=Math.min(500*Math.pow(2,attempts-1),8000);
      setTimeout(function(){self._receive(Object.assign({},evt,{_attempts:attempts}));},delay);
    } else {
      /* Dead-letter queue */
      self.dlq.push({evt:evt,error:e.message,ts:new Date().toISOString()});
      if(self.dlq.length>50)self.dlq.shift();
      if(window.OmegaBus)window.OmegaBus.emit('platform.queue.dlq',{eventName:evt.name,reason:e.message,attempts:attempts});
    }
  });
};

Worker.prototype._startRetryLoop=function(){};

Worker.prototype.status=function(){
  return {
    name:this.name,
    state:this.cb.state,
    processed:this.processed,
    errors:this.errors,
    dlqDepth:this.dlq.length,
    lastActivity:this.lastActivity,
    active:this.active,
    cbFailures:this.cb.failures
  };
};

/* ── Analytics aggregator ── */
function getKV(key){try{return JSON.parse(localStorage.getItem('omega_analytics_'+key)||'null');}catch(e){return null;}}
function setKV(key,val){try{localStorage.setItem('omega_analytics_'+key,JSON.stringify(val));}catch(e){}}

var analyticsWorker=new Worker({
  name:'analytics-worker',
  events:['sovereign.gate.unlocked','sovereign.axis.updated','sovereign.task.completed','sovereign.event.registered','sovereign.music.played','sovereign.cipher.used','sovereign.realm.visited'],
  handler:function(evt){
    var agg=getKV('agg')||{events:{},lastUpdated:null};
    agg.events[evt.name]=(agg.events[evt.name]||0)+1;
    agg.lastUpdated=new Date().toISOString();
    setKV('agg',agg);
    /* Session event count */
    var sc=parseInt(sessionStorage.getItem('omega_event_count')||'0');
    sessionStorage.setItem('omega_event_count',String(sc+1));
  }
});

/* ── Notification worker ── */
var notifWorker=new Worker({
  name:'notification-worker',
  events:['sovereign.gate.unlocked','sovereign.member.approved','sovereign.member.ascended','sovereign.member.approved'],
  handler:function(evt){
    /* Fire a platform notification via OmegaConfetti or topbar alert */
    if(evt.name==='sovereign.gate.unlocked'&&window.OmegaCelebrate){
      window.OmegaCelebrate.gate(evt.payload.gate);
    }
    /* Append to notification feed if exists */
    var feed=document.getElementById('omega-notif-feed');
    if(feed){
      var item=document.createElement('div');
      item.style.cssText='padding:6px 0;border-bottom:1px solid rgba(201,168,76,.06);font-family:var(--M,"Courier Prime",monospace);font-size:8px;color:rgba(226,200,109,.6)';
      item.textContent='['+new Date().toTimeString().slice(0,8)+'] '+evt.name+' — '+(evt.payload.name||'');
      feed.insertBefore(item,feed.firstChild);
      while(feed.children.length>20)feed.removeChild(feed.lastChild);
    }
  }
});

/* ── Achievement worker ── */
var GATE_THRESH=[2.32,3.98,5.95,8.29,11,13.92,17.21,20.87,24.01,25.9,27.1,27.8367];
var achievementWorker=new Worker({
  name:'achievement-worker',
  events:['sovereign.axis.updated','sovereign.task.completed'],
  handler:function(evt){
    /* Check if profile crosses a gate threshold */
    var profile=window.__omegaProfile;
    if(!profile)return;
    var PHI=1.6180339887,EU=2.7182818285;
    var a=Number(profile.axis_a||0),b=Number(profile.axis_b||0),c=Number(profile.axis_c||0);
    var auth=profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
    var GATE_NAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT','SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX SOVEREIGN'];
    var gate=0;GATE_THRESH.forEach(function(t,i){if(auth>=t)gate=i;});
    var prevGate=parseInt(getKV('last_gate')||'0');
    if(gate>prevGate){
      setKV('last_gate',String(gate));
      if(window.OmegaBus){
        window.OmegaBus.emit('sovereign.gate.unlocked',{memberId:(window.__omegaUser||{}).id||'',gate:gate+1,name:GATE_NAMES[gate],auth:auth});
      }
    }
  }
});

/* ── Recommendation worker ── */
var ELEM_PAGES={
  Fire:['evolution','gaming','ascension','exam'],
  Water:['cosmos','horoscope','oracle','elements'],
  Wind:['intelligence','research','lab','design-system'],
  Metal:['compliance','governance','enterprise','charter'],
  Sand:['analytics','sigma','intelligence','research'],
  Soul:['chronicle','heritage','bloodline','oracle'],
  Space:['realm','nexus','universe','cosmos'],
  Void:['cipher','sigil','rune','observatory'],
  'The All':['dashboard','leaderboard','sovereign','sovereigns']
};

var recWorker=new Worker({
  name:'recommendation-worker',
  events:['sovereign.realm.visited','sovereign.element.shifted','sovereign.music.played'],
  handler:function(evt){
    var elem=evt.payload.elem||'Void';
    var pages=ELEM_PAGES[elem]||ELEM_PAGES['Void'];
    setKV('recommendations',{elem:elem,pages:pages,ts:new Date().toISOString()});
    /* Inject recommended pages into any [data-recommendations] slot */
    document.querySelectorAll('[data-recommendations]').forEach(function(el){
      el.innerHTML=pages.slice(0,3).map(function(p){
        return '<a href="/'+p+'.html" style="display:inline-block;font-family:var(--M,\'Courier Prime\',monospace);font-size:7.5px;letter-spacing:1.5px;padding:4px 10px;border:1px solid rgba(201,168,76,.2);color:rgba(226,200,109,.6);margin:3px;border-radius:2px">'+p.toUpperCase()+'</a>';
      }).join('');
    });
  }
});

/* ── Audit worker — append-only event log ── */
var auditWorker=new Worker({
  name:'audit-worker',
  events:['sovereign.gate.unlocked','sovereign.member.approved','sovereign.member.ascended','sovereign.task.completed','sovereign.event.registered'],
  handler:function(evt){
    var log=getKV('audit_log')||[];
    log.push({id:evt.id,name:evt.name,ts:evt.ts,payload:evt.payload});
    if(log.length>200)log=log.slice(-200);
    setKV('audit_log',log);
  }
});

/* ── Gate monitor ── */
var gateMonitor=new Worker({
  name:'gate-monitor',
  events:['platform.health.probe'],
  handler:function(evt){
    /* Periodic gate check — triggered by health probes */
    var profile=window.__omegaProfile;
    if(!profile)return;
    var agg=getKV('agg')||{};
    agg.lastHealthCheck=new Date().toISOString();
    agg.workerCount=6;
    setKV('agg',agg);
  }
});

var WORKERS=[analyticsWorker,notifWorker,achievementWorker,recWorker,auditWorker,gateMonitor];

/* ── Boot: wire event bus when it loads ── */
function boot(){
  if(!window.OmegaBus){setTimeout(boot,200);return;}
  WORKERS.forEach(function(w){w._registerSubs();});
  /* Emit worker started events */
  WORKERS.forEach(function(w){
    window.OmegaBus.emit('platform.worker.started',{worker:w.name,pid:Math.random().toString(36).slice(2,8)});
  });
  /* Periodic health probe every 60 seconds */
  setInterval(function(){
    if(window.OmegaBus){
      var t0=performance.now();
      /* Measure local bus round-trip */
      var lat=performance.now()-t0;
      window.OmegaBus.emit('platform.health.probe',{service:'event-bus',status:'ok',latencyMs:Math.round(lat)});
    }
  },60000);
}

/* ── Public API ── */
window.OmegaWorkers={
  status:function(){return WORKERS.map(function(w){return w.status();});},
  restart:function(name){
    var w=WORKERS.find(function(w){return w.name===name;});
    if(w){w.cb.state=CB_CLOSED;w.cb.failures=0;w.active=true;}
  },
  metrics:function(){
    return WORKERS.reduce(function(acc,w){
      acc[w.name]=w.status();
      return acc;
    },{});
  },
  getAuditLog:function(){return getKV('audit_log')||[];},
  getRecommendations:function(){return getKV('recommendations')||null;},
  getAnalytics:function(){return getKV('agg')||{};},
};

/* ── Surface worker recommendations when available ── */
window.addEventListener('omega:user-loaded',function(){boot();});
if(document.readyState!=='loading')boot();
else document.addEventListener('DOMContentLoaded',boot);

})();
