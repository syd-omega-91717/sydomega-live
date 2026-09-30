/* Ω SYD OMEGA 91717 — WORLD ACTION RECORDER
 * Records only authenticated member-owned action_started events through the
 * governed public RPC. It never awards XP, money, authority or achievements.
 */
(function(){
  'use strict';
  if(window.OmegaWorldAction)return;
  var pending={};
  function key(){
    if(window.crypto&&typeof window.crypto.randomUUID==='function') return 'world-action-'+window.crypto.randomUUID();
    if(window.crypto&&typeof window.crypto.getRandomValues==='function'){
      var bytes=new Uint8Array(16); window.crypto.getRandomValues(bytes);
      return 'world-action-'+Array.from(bytes).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
    }
    throw new Error('secure idempotency key generator unavailable');
  }
  async function client(){
    if(window.OmegaSB&&typeof window.OmegaSB.get==='function'){
      var c=window.OmegaSB.get(); return c&&typeof c.then==='function'?await c:c;
    }
    if(window.__omegaSb)return window.__omegaSb;
    throw new Error('supabase client unavailable');
  }
  async function record(input){
    input=input||{};
    var district=String(input.district||'').toLowerCase().trim();
    var action=String(input.action||'').toLowerCase().trim();
    var route=String(input.route||location.pathname).trim();
    if(!district||!action)return {accepted:false,reason:'missing_action'};
    var id=key(); if(pending[id])return pending[id];
    pending[id]=Promise.resolve().then(async function(){
      try{
        var sb=await client();
        var s=(await sb.auth.getSession()).data.session;
        if(!s)return {accepted:false,reason:'not_authenticated'};
        var r=await sb.rpc('omega_record_world_action',{
          p_district:district,p_action:action,p_route:route,p_idempotency_key:id
        });
        if(r.error)throw r.error;
        return {accepted:true,eventId:r.data};
      }catch(e){
        return {accepted:false,reason:String(e&&e.message||e)};
      }finally{delete pending[id];}
    });
    return pending[id];
  }
  window.OmegaWorldAction={record:record};
})();