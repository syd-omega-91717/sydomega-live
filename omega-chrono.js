/* ==========================================================================
   Ω SYD OMEGA 91717 — DUAL SOVEREIGN CHRONOMETER ENGINE
   
   CHRONO A: TRIAL COUNTDOWN
   · Duration: 9 minutes 17 seconds = 557 seconds
   · Starts: the moment admin/owner grants access approval
   · Behavior: counts DOWN on every page, auto-logout at zero
   · Authority: only owner can renew / extend / grant permanent
   
   CHRONO B: DEDICATION TRACKER
   · Duration target: 9 hours 17 minutes 17 seconds = 33,437 seconds
   · Counts UP every second the member is actively on the platform
   · PAUSES when browser tab is hidden / user leaves / logs out
   · RESUMES on return — tracks cumulative daily dedication
   · Stored in localStorage + synced to Supabase every 60s
   ========================================================================== */
(function(){
  var TRIAL_TOTAL       = 557;    /* 9 min 17 sec — trial countdown */
  var DEDICATION_TARGET = 33437;  /* 9h 17m 17s — daily dedication goal */
  var STORAGE_KEY       = 'omega_dedication_today';
  var SYNC_KEY          = 'omega_ded_date';

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function fmtHMS(sec){
    sec=Math.max(0,Math.floor(sec));
    var h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
    return (h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
  }
  function fmtMS(sec){
    sec=Math.max(0,Math.floor(sec));
    var m=Math.floor(sec/60),s=sec%60;
    return (m<10?'0':'')+m+':'+(s<10?'0':'')+s;
  }
  function today(){ return new Date().toISOString().slice(0,10); }

  /* ═══════════════════════════════════════════════════════════════════════
     CHRONO A — TRIAL COUNTDOWN
     Injected at top of every page when member is on an active trial
     ═══════════════════════════════════════════════════════════════════════ */
  function injectTrialBar(expiresAt, startsAt){
    if(document.getElementById('omega-trial-bar')) return;
    var bar=document.createElement('div');
    bar.id='omega-trial-bar';
    bar.style.cssText='position:fixed;top:0;left:0;right:0;z-index:8000;background:rgba(2,2,6,.97);border-bottom:1px solid rgba(201,168,76,.3);display:flex;align-items:center;gap:clamp(8px,2vw,20px);padding:7px clamp(12px,3vw,28px);box-shadow:0 2px 20px rgba(201,168,76,.1);flex-wrap:wrap';
    
    bar.innerHTML=
      '<div style="font-family:\'Cinzel Decorative\',serif;font-size:8px;color:rgba(201,168,76,.6);letter-spacing:2px;flex-shrink:0">\u03A9 TRIAL ACCESS</div>'
      +'<div style="flex-shrink:0;text-align:center">'
        +'<div style="font-family:\'Cinzel Decorative\',serif;font-size:clamp(18px,3vw,24px);color:#C9A84C;line-height:1" id="trial-time-display">09:17</div>'
        +'<div style="font-family:\'Courier Prime\',monospace;font-size:6px;letter-spacing:2px;color:rgba(138,134,118,.5)">9 MIN 17 SEC TRIAL</div>'
      +'</div>'
      +'<div style="flex:1;min-width:80px">'
        +'<div id="trial-bar-track" style="height:3px;background:rgba(201,168,76,.08);border-radius:2px;overflow:hidden">'
          +'<div id="trial-bar-fill" style="height:100%;background:#C9A84C;border-radius:2px;transition:width .9s linear;width:100%"></div>'
        +'</div>'
        +'<div style="font-family:\'Courier Prime\',monospace;font-size:7px;letter-spacing:1.5px;color:rgba(138,134,118,.4);margin-top:3px;text-align:center">GRANTED: '+new Date(startsAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}).toUpperCase()+'</div>'
      +'</div>'
      +'<div style="font-family:\'Courier Prime\',monospace;font-size:7px;letter-spacing:1.5px;color:rgba(138,134,118,.5);flex-shrink:0">OWNER RENEWS</div>';

    document.body.insertBefore(bar,document.body.firstChild);
    /* push page content down */
    setTimeout(function(){
      var h=bar.offsetHeight+4;
      document.querySelectorAll('.topbar').forEach(function(t){if(getComputedStyle(t).position==='sticky')t.style.top=h+'px';});
    },100);

    /* tick */
    function tick(){
      var rem=Math.max(0,new Date(expiresAt)-Date.now());
      var remSec=rem/1000;
      var pct=Math.min(100,remSec/TRIAL_TOTAL*100);
      var td=document.getElementById('trial-time-display');
      var tf=document.getElementById('trial-bar-fill');
      if(td) td.textContent=fmtMS(remSec);
      if(tf)  tf.style.width=pct.toFixed(2)+'%';
      if(td){
        if(remSec<120)  td.style.color='#8B0000';
        else if(remSec<300) td.style.color='#ff9900';
        else td.style.color='#C9A84C';
      }
      if(rem<=0){
        if(td){td.textContent='EXPIRED';td.style.color='#8B0000';}
        if(window.__omegaSb){window.__omegaSb.auth.signOut().catch(function(){});}
        setTimeout(function(){
          if(window.location.pathname!=='/pending.html')
            window.location.replace('/pending.html?expired=1');
        },2000);
        return;
      }
      setTimeout(tick,1000);
    }
    tick();
  }

  window.__omegaStartTrialChrono=function(expiresISO,startsISO){
    if(!expiresISO) return;
    var rem=new Date(expiresISO)-Date.now();
    if(rem<=0){
      /* Already expired — sign out */
      if(window.__omegaSb) window.__omegaSb.auth.signOut().catch(function(){});
      if(window.location.pathname!=='/pending.html')
        window.location.replace('/pending.html?expired=1');
      return;
    }
    var starts=startsISO||new Date(new Date(expiresISO).getTime()-TRIAL_TOTAL*1000).toISOString();
    injectTrialBar(expiresISO,starts);
  };

  /* ═══════════════════════════════════════════════════════════════════════
     CHRONO B — DEDICATION TRACKER
     Counts active seconds on-platform. Pauses on tab hide / focus loss.
     Syncs to Supabase every 60s. Resets at midnight.
     ═══════════════════════════════════════════════════════════════════════ */
  var _dedSec=0;
  var _dedActive=false;
  var _dedInterval=null;
  var _lastSync=0;

  function dedLoad(){
    var d=today();
    if(localStorage.getItem(SYNC_KEY)!==d){
      localStorage.setItem(SYNC_KEY,d);
      localStorage.setItem(STORAGE_KEY,'0');
      _dedSec=0;
    } else {
      _dedSec=parseInt(localStorage.getItem(STORAGE_KEY)||'0');
    }
  }

  function dedSave(){
    localStorage.setItem(STORAGE_KEY,String(_dedSec));
    localStorage.setItem(SYNC_KEY,today());
  }

  function dedSync(){
    if(!window.__omegaSb) return;
    window.__omegaSb.auth.getSession().then(function(r){
      var s=r.data&&r.data.session;
      if(!s) return;
      /* Upsert today's dedication seconds.

         onConflict is required, not optional: user_dedication has
         UNIQUE(user_id, date), but an upsert with no conflict target defaults
         to the PRIMARY KEY, and this payload carries no id -- so PostgREST
         sends a plain insert every time. Proven against the live database:
         the first tick of a day inserts, and every tick after it raises
         23505 unique_violation, so the timer froze at whatever it read first
         each day and never advanced.

         The failure was invisible twice over: .catch() never fires because the
         Supabase client resolves to {data, error} rather than throwing, and
         until the GRANT was added the request never reached the constraint at
         all. */
      window.__omegaSb.from('user_dedication').upsert({
        user_id:s.user.id,
        date:today(),
        seconds_today:_dedSec,
        target_seconds:DEDICATION_TARGET,
        updated_at:new Date().toISOString()
      },{onConflict:'user_id,date'}).then(function(res){
        if(res&&res.error){
          console.warn('[omega-chrono] dedication sync failed:',res.error.message);
        }
      });
    }).catch(function(){});
  }

  function dedStart(){
    if(_dedActive||_dedInterval) return;
    _dedActive=true;
    _dedInterval=setInterval(function(){
      _dedSec++;
      dedSave();
      updateDedUI();
      /* Sync every 60s */
      if(_dedSec-_lastSync>=60){_lastSync=_dedSec;dedSync();}
    },1000);
  }

  function dedStop(){
    if(!_dedActive) return;
    _dedActive=false;
    clearInterval(_dedInterval);
    _dedInterval=null;
    dedSave();
    dedSync();
  }

  function updateDedUI(){
    var pct=Math.min(100,_dedSec/DEDICATION_TARGET*100);
    var el=document.getElementById('omega-ded-bar-fill');
    if(el) el.style.width=pct.toFixed(2)+'%';
    var td=document.getElementById('omega-ded-time');
    if(td) td.textContent=fmtHMS(_dedSec)+' / '+fmtHMS(DEDICATION_TARGET);
    var pct_el=document.getElementById('omega-ded-pct');
    if(pct_el) pct_el.textContent=pct.toFixed(1)+'%';
  }

  /* Inject dedication widget at bottom of page */
  function injectDedWidget(){
    if(document.getElementById('omega-ded-widget')) return;
    var w=document.createElement('div');
    w.id='omega-ded-widget';
    w.style.cssText='position:fixed;bottom:44px;right:14px;z-index:1999;background:rgba(2,2,6,.9);border:1px solid rgba(0,229,255,.15);border-radius:3px;padding:8px 12px;min-width:180px;box-shadow:0 4px 20px rgba(0,0,0,.4)';
    /* bottom:44px sits inside nav.js's 66px #omega-mob bar on a phone, so the
       widget was clipped by it and also collided with the controls dock.
       Measured at 375px; this clears both. */
    if(!document.getElementById('omega-ded-widget-css')){
      var ds=document.createElement('style');
      ds.id='omega-ded-widget-css';
      ds.textContent='@media(max-width:760px){#omega-ded-widget{bottom:150px!important}}';
      (document.head||document.documentElement).appendChild(ds);
    }
    w.innerHTML=
      '<div style="font-family:\'Courier Prime\',monospace;font-size:7px;letter-spacing:2px;color:rgba(0,229,255,.5);margin-bottom:5px">\u03A9 DEDICATION TODAY</div>'
      +'<div id="omega-ded-time" style="font-family:\'Cinzel Decorative\',serif;font-size:11px;color:#00E5FF;line-height:1;margin-bottom:5px">00:00:00 / 09:17:17</div>'
      +'<div style="height:3px;background:rgba(0,229,255,.08);border-radius:2px;overflow:hidden">'
        +'<div id="omega-ded-bar-fill" style="height:100%;background:var(--cyan,#00E5FF);border-radius:2px;width:0%;transition:width 1s linear"></div>'
      +'</div>'
      +'<div id="omega-ded-pct" style="font-family:\'Courier Prime\',monospace;font-size:7px;color:rgba(0,229,255,.4);margin-top:3px;text-align:right">0.0%</div>';
    document.body.appendChild(w);
    updateDedUI();
  }

  /* Visibility & focus handlers — pause/resume */
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){dedStop();}else{dedStart();}
  });
  window.addEventListener('blur',function(){dedStop();});
  window.addEventListener('focus',function(){dedStart();});
  window.addEventListener('beforeunload',function(){dedStop();});

  /* ── AUTO-CHECK on every page load ─────────────────────────────────── */
  function autoCheck(){
    var tries=0;
    var iv=setInterval(function(){
      tries++;
      if(window.__omegaSb){
        window.__omegaSb.auth.getSession().then(function(r){
          var s=r.data&&r.data.session;
          if(!s){clearInterval(iv);return;}
          return window.__omegaSb.from('profiles')
            .select('is_owner,is_trial,trial_expires_at,access_approved')
            .eq('id',s.user.id).maybeSingle()
            .then(function(r2){
              var pr=r2.data||{};
              if(pr.is_owner){clearInterval(iv);return;}
              /* TRIAL CHRONO A */
              if(pr.is_trial&&pr.trial_expires_at&&new Date(pr.trial_expires_at)>new Date()){
                var starts=new Date(new Date(pr.trial_expires_at).getTime()-TRIAL_TOTAL*1000).toISOString();
                window.__omegaStartTrialChrono(pr.trial_expires_at,starts);
              } else if(pr.is_trial&&pr.trial_expires_at&&new Date(pr.trial_expires_at)<=new Date()){
                /* Expired — sign out */
                window.__omegaSb.auth.signOut().then(function(){
                  window.location.replace('/pending.html?expired=1');
                });
                clearInterval(iv);return;
              }
              /* DEDICATION CHRONO B — for all approved members */
              if(pr.access_approved){
                dedLoad();
                injectDedWidget();
                dedStart();
              }
              clearInterval(iv);
            });
        }).catch(function(){});
      }
      if(tries>20) clearInterval(iv);
    },500);
  }

  /* Also trigger when profile is populated */
  document.addEventListener('omega:populated',function(e){
    var pr=e.detail&&e.detail.profile;
    if(!pr||pr.is_owner) return;
    if(pr.is_trial&&pr.trial_expires_at&&new Date(pr.trial_expires_at)>new Date()){
      var starts=new Date(new Date(pr.trial_expires_at).getTime()-TRIAL_TOTAL*1000).toISOString();
      window.__omegaStartTrialChrono(pr.trial_expires_at,starts);
    }
    if(pr.access_approved){
      dedLoad();injectDedWidget();dedStart();
    }
  });

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',autoCheck);
  } else { autoCheck(); }

  /* Expose */
  window.OmegaChrono={
    TRIAL_TOTAL:TRIAL_TOTAL,
    DEDICATION_TARGET:DEDICATION_TARGET,
    getDedSec:function(){return _dedSec;},
    getDedPct:function(){return Math.min(100,_dedSec/DEDICATION_TARGET*100);}
  };

})();
