/* Ω DATA RUNTIME — bounded, cache-aware, truth-safe reads.
   It optimizes client access without becoming an authorization layer. */
(function(){
  'use strict';
  if(window.OmegaData)return;

  var DEFAULT={maxConcurrent:6,timeoutMs:10000,maxTimeoutMs:30000,defaultPageSize:25,maxPageSize:100,cacheTtlMs:15000,maxCacheEntries:128,retryableAttempts:2};
  var config=Object.assign({},DEFAULT);
  var active=0,waiters=[],cache=new Map(),inflight=new Map();

  function now(){return Date.now();}
  function enqueue(){
    if(active<config.maxConcurrent){active++;return Promise.resolve();}
    return new Promise(function(resolve){waiters.push(resolve);}).then(function(){active++;});
  }
  function release(){
    active=Math.max(0,active-1);
    var next=waiters.shift();if(next)next();
  }
  function bounded(v,fallback,min,max){v=Number(v);return isFinite(v)?Math.min(max,Math.max(min,v)):fallback;}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function prune(){
    while(cache.size>config.maxCacheEntries)cache.delete(cache.keys().next().value);
  }
  function key(name,args){return String(name)+':'+JSON.stringify(args||{});}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}

  async function query(name,executor,opts){
    opts=opts||{};
    if(typeof executor!=='function')return {ok:false,state:'UNKNOWN',error:'executor-required'};
    var timeout=bounded(opts.timeoutMs,config.timeoutMs,1,config.maxTimeoutMs);
    var pageSize=bounded(opts.pageSize,config.defaultPageSize,1,config.maxPageSize);
    var args=Object.assign({},opts.args||{});
    if(opts.collection!==false)args.limit=pageSize;
    var k=key(name,args);
    var fresh=cache.get(k);
    if(fresh&&now()-fresh.at<config.cacheTtlMs)
      return {ok:true,state:'LIVE',data:clone(fresh.data),cached:true,ageMs:now()-fresh.at};

    if(inflight.has(k))return inflight.get(k);

    var task=(async function(){
      await enqueue();
      try{
        var attempts=opts.retry===false?1:config.retryableAttempts;
        var last=null;
        for(var i=0;i<attempts;i++){
          try{
            var result=await Promise.race([
              Promise.resolve().then(function(){return executor(args);}),
              new Promise(function(_,reject){setTimeout(function(){var e=new Error('OmegaData timeout');e.code='TIMEOUT';reject(e);},timeout);})
            ]);
            if(result&&result.error)throw result.error;
            var data=result&&Object.prototype.hasOwnProperty.call(result,'data')?result.data:result;
            cache.set(k,{at:now(),data:clone(data)});prune();
            return {ok:true,state:'LIVE',data:data,cached:false,ageMs:0};
          }catch(e){
            last=e;
            if(i+1<attempts)await sleep(150*(i+1));
          }
        }
        if(window.omegaRuntime&&typeof window.omegaRuntime.record==='function')
          window.omegaRuntime.record('omega_data_read_failed',{name:name,code:last&&last.code||'READ_FAILED'});
        return {ok:false,state:last&&last.code==='TIMEOUT'?'UNAVAILABLE':'UNKNOWN',error:{name:last&&last.name||'Error',message:last&&last.message||'Read failed'}};
      }finally{release();inflight.delete(k);}
    })();
    inflight.set(k,task);
    return task;
  }

  function clear(prefix){
    if(!prefix)return cache.clear();
    Array.from(cache.keys()).forEach(function(k){if(k.indexOf(prefix)===0)cache.delete(k);});
  }
  function configure(next){
    next=next||{};
    if(next.maxConcurrent)config.maxConcurrent=bounded(next.maxConcurrent,config.maxConcurrent,1,32);
    if(next.timeoutMs)config.timeoutMs=bounded(next.timeoutMs,config.timeoutMs,1,config.maxTimeoutMs);
    if(next.maxPageSize)config.maxPageSize=bounded(next.maxPageSize,config.maxPageSize,1,500);
    if(next.cacheTtlMs)config.cacheTtlMs=bounded(next.cacheTtlMs,config.cacheTtlMs,0,300000);
    return Object.assign({},config);
  }
  window.OmegaData={version:'1.0.0',query:query,clear:clear,configure:configure,budgets:function(){return Object.assign({},config,{active:active,queued:waiters.length,cacheEntries:cache.size});}};
})();
