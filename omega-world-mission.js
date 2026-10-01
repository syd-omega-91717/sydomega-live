/* Ω SYD OMEGA 91717 — DISTRICT MISSION ENTRY
 * Starts only the canonical server-defined mission for a City district.
 * No local mission state, XP, reward, rank, authority or payment is created.
 */
(function(){
  'use strict';
  if(window.OmegaWorldMission)return;

  var pending={};

  function key(){
    if(window.crypto&&typeof window.crypto.randomUUID==='function') return 'district-mission-'+window.crypto.randomUUID();
    if(window.crypto&&typeof window.crypto.getRandomValues==='function'){
      var bytes=new Uint8Array(16); window.crypto.getRandomValues(bytes);
      return 'district-mission-'+Array.from(bytes).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
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

  async function start(district){
    district=String(district||'').toLowerCase().trim();
    if(!district)return {accepted:false,reason:'missing_district'};
    if(pending[district])return pending[district];

    pending[district]=Promise.resolve().then(async function(){
      try{
        var sb=await client();
        var session=(await sb.auth.getSession()).data.session;
        if(!session)return {accepted:false,reason:'not_authenticated'};

        var world=window.OmegaPageWorld&&window.OmegaPageWorld.getManifest
          ?window.OmegaPageWorld.getManifest():null;
        var wm=window.__omegaWorldManifest||null;
        if(!wm){
          var wr=await fetch('/config/omega-world-manifest.json',{cache:'no-store'});
          if(!wr.ok)throw new Error('world manifest '+wr.status);
          wm=await wr.json(); window.__omegaWorldManifest=wm;
        }
        var d=(wm.districts||[]).find(function(x){return x.id===district;});
        if(!d||!d.missionKey)return {accepted:false,reason:'mission_not_configured'};

        var q=await sb.from('omega_missions')
          .select('id,mission_key,version,status')
          .eq('mission_key',d.missionKey)
          .eq('status','active')
          .order('version',{ascending:false})
          .limit(1)
          .maybeSingle();
        if(q.error)throw q.error;
        if(!q.data)return {accepted:false,reason:'mission_unavailable',missionKey:d.missionKey};

        var r=await sb.rpc('omega_start_mission',{
          p_mission_id:q.data.id,
          p_idempotency_key:key()
        });
        if(r.error)throw r.error;
        return {accepted:true,district:district,mission:r.data,missionKey:d.missionKey};
      }catch(e){
        return {accepted:false,reason:String(e&&e.message||e)};
      }finally{delete pending[district];}
    });
    return pending[district];
  }

  window.OmegaWorldMission={start:start};
})();
