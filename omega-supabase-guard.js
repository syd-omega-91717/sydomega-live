/* SYD OMEGA 91717 — Supabase Guard v1.0
   Hardened client wrapper with RLS validation, audit logging,
   session heartbeat, and automatic retry with backoff.
   Non-destructive. Wraps existing OmegaSB if present. */
(function(){
  'use strict';
  if(window.__omegaSupabaseGuard)return;
  window.__omegaSupabaseGuard=true;

  var GUARD={
    maxRetries:3,
    baseDelay:300,
    auditLog:[],
    sessionAlive:false,
    lastPing:0
  };

  function log(event,detail){
    var entry={t:Date.now(),event:event,detail:detail};
    GUARD.auditLog.push(entry);
    if(GUARD.auditLog.length>100) GUARD.auditLog.shift();
    try{sessionStorage.setItem('omega:guard:audit',JSON.stringify(GUARD.auditLog.slice(-50)));}catch(e){}
  }

  function backoff(attempt){return Math.min(GUARD.baseDelay*Math.pow(2,attempt),5000);}

  async function guardedQuery(sb,builder,opts){
    opts=opts||{};
    var attempt=0;
    while(attempt<=GUARD.maxRetries){
      try{
        var start=performance.now();
        var result=await builder;
        var ms=Math.round(performance.now()-start);
        if(result.error) throw result.error;
        log('QUERY_OK',{table:opts.table,ms:ms,rows:result.data?result.data.length:0});
        return result;
      }catch(err){
        attempt++;
        var isRLS=err.message&&/row-level security|rls|permission denied/i.test(err.message);
        var isAuth=err.message&&/jwt|auth|session|expired/i.test(err.message);
        log('QUERY_FAIL',{table:opts.table,attempt:attempt,error:err.message,rls:isRLS,auth:isAuth});
        if(isAuth){GUARD.sessionAlive=false;document.dispatchEvent(new CustomEvent('omega:session-lost',{detail:err}));throw err;}
        if(attempt>GUARD.maxRetries) throw err;
        await new Promise(function(r){setTimeout(r,backoff(attempt));});
      }
    }
    throw new Error('Max retries exceeded');
  }

  function wrapClient(sb){
    if(!sb||sb.__guarded) return sb;
    var originalFrom=sb.from.bind(sb);
    sb.from=function(table){
      var builder=originalFrom(table);
      var originalSelect=builder.select.bind(builder);
      builder.select=function(columns,opts){
        var q=originalSelect(columns,opts);
        q.guardedExecute=function(){return guardedQuery(sb,q.execute?q.execute():q,{table:table});};
        return q;
      };
      return builder;
    };
    sb.__guarded=true;

    async function heartbeat(){
      try{
        var {data,error}=await sb.auth.getSession();
        if(error||!data.session){GUARD.sessionAlive=false;log('HEARTBEAT_FAIL',{error:error?error.message:'no session'});}
        else{GUARD.sessionAlive=true;GUARD.lastPing=Date.now();log('HEARTBEAT_OK',{});}
      }catch(e){GUARD.sessionAlive=false;log('HEARTBEAT_EX',{});}
    }

    setInterval(heartbeat,60000);
    heartbeat();

    return sb;
  }

  window.OmegaSupabaseGuard={
    wrap:wrapClient,
    status:function(){return{sessionAlive:GUARD.sessionAlive,lastPing:GUARD.lastPing,log:GUARD.auditLog};},
    audit:function(){return GUARD.auditLog;},
    clearAudit:function(){GUARD.auditLog=[];try{sessionStorage.removeItem('omega:guard:audit');}catch(e){};}
  };

  document.addEventListener('DOMContentLoaded',function(){
    if(window.OmegaSB&&window.OmegaSB.client){window.OmegaSB.client=wrapClient(window.OmegaSB.client);}
    document.dispatchEvent(new CustomEvent('omega:supabase-guard-ready',{detail:{version:'1.0'}}));
  });
})();
