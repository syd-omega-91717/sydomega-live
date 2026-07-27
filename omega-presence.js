/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN PRESENCE ENGINE
   Tracks member presence in real time using Supabase Realtime.
   Inspired by Discord's presence system.
   Records which page is open, pauses on tab hide, syncs every 30s.
   ========================================================================== */
(function(){
  if(window.__omegaPresenceActive) return;
  window.__omegaPresenceActive=true;

  var PAGE=location.pathname.replace('/','').replace('.html','').replace('-','_')||'home';
  var session_started=new Date().toISOString();

  function syncPresence(online){
    if(!window.__omegaSb) return;
    window.__omegaSb.auth.getSession().then(function(r){
      var s=r.data&&r.data.session;
      if(!s) return;
      var ded=window.OmegaChrono?window.OmegaChrono.getDedSec():0;
      window.__omegaSb.from('member_presence').upsert({
        user_id:s.user.id,
        is_online:online,
        current_page:online?PAGE:null,
        last_seen:new Date().toISOString(),
        session_started:online?session_started:null,
        dedication_today:ded,
        client_info:{ua:navigator.userAgent.slice(0,60),tz:Intl.DateTimeFormat().resolvedOptions().timeZone}
      }).catch(function(){});
    }).catch(function(){});
  }

  /* Sync on load and every 30s while active */
  var _syncIv=null;
  function startSync(){
    syncPresence(true);
    if(!_syncIv) _syncIv=setInterval(function(){syncPresence(true);},30000);
  }
  function stopSync(){
    syncPresence(false);
    if(_syncIv){clearInterval(_syncIv);_syncIv=null;}
  }

  document.addEventListener('visibilitychange',function(){
    if(document.hidden)stopSync(); else startSync();
  });
  window.addEventListener('blur',stopSync);
  window.addEventListener('focus',startSync);
  window.addEventListener('beforeunload',function(){syncPresence(false);});

  /* Start after omega-user populates */
  document.addEventListener('omega:populated',function(){
    setTimeout(startSync,500);
  });
  setTimeout(startSync,2000);
  window.OmegaPresence={sync:syncPresence};
})();
