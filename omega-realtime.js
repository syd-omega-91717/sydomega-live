/* ==========================================================================
   Ω SYD OMEGA 91717 — REAL-TIME INTELLIGENCE ENGINE (omega-realtime.js)
   
   Makes every page alive with live Supabase subscriptions.
   Nothing is static. Everything updates the moment it changes.
   
   Inspired by:
   - Bloomberg Terminal: real-time data, every number breathing
   - Palantir Operations: live operational feeds
   - PostHog: real-time product analytics
   - Supabase Realtime: Postgres change events via websocket
   
   Subscriptions:
   A. MEMBER PULSE     — active member count, live join/leave events
   B. PLATFORM EVENTS  — task completions, gate unlocks, achievements
   C. AI ACTIVITY      — concierge queries, agent activations
   D. THREAT STREAM    — security events (owner only)
   E. GATE EVENTS      — member progressions through authority gates
   F. TICKER           — rotating live announcements across bottom bar
   ========================================================================== */
(function(){
  if(window.__omegaRealtimeActive) return;
  window.__omegaRealtimeActive = true;

  var _subs=[];
  var _profile=null;
  var _onlineCount=0;
  var _eventFeed=[];
  var _ticker=null;
  var _tickerItems=[];

  /* ── LIVE MEMBER COUNT ─────────────────────────────────────────── */
  function startMemberPulse(){
    if(!window.__omegaSb) return;
    /* Poll every 30s for now — Realtime requires RLS-enabled tables with REPLICA IDENTITY FULL */
    refreshMemberCount();
    setInterval(refreshMemberCount,30000);
  }

  function refreshMemberCount(){
    if(!window.__omegaSb) return;
    window.__omegaSb.from('profiles').select('id',{count:'exact',head:true}).eq('access_approved',true)
      .then(function(r){
        _onlineCount=r.count||0;
        /* Animate any [data-live-members] element */
        document.querySelectorAll('[data-live-members]').forEach(function(el){
          animateNum(el,_onlineCount);
        });
        /* Update specific KPI */
        var kpi=document.getElementById('rt-members');
        if(kpi) animateNum(kpi,_onlineCount);
        /* Emit to event bus */
        if(window.OmegaOS)window.OmegaOS.events.emit('realtime:members',{count:_onlineCount});
      }).catch(function(){});
  }

  /* ── LIVE ACTIVITY FEED ──────────────────────────────────────────── */
  async function pollActivityFeed(){
    if(!window.__omegaSb) return;
    try{
      var r=await window.__omegaSb.from('activity_feed').select('activity_type,title,created_at').eq('is_public',true).order('created_at',{ascending:false}).limit(10);
      if(r.data&&r.data.length){
        _tickerItems=r.data.map(function(e){
          var ago=timeAgo(new Date(e.created_at));
          return e.title+' \u00b7 '+ago;
        });
        _eventFeed=r.data;
        /* Emit */
        if(window.OmegaOS)window.OmegaOS.events.emit('realtime:activity',{items:r.data});
        /* Inject into any [data-live-ticker] */
        startTicker();
      }
    }catch(e){}
  }

  /* ── REALTIME SUPABASE CHANNEL ─────────────────────────────────── */
  function subscribeRealtimeChannel(){
    if(!window.__omegaSb) return;
    try{
      /* Subscribe to platform_events table for INSERT events */
      var ch=window.__omegaSb.channel('platform-live')
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'platform_events'},function(payload){
          var evType=payload.new&&payload.new.event_type||'event';
          if(window.OmegaOS)window.OmegaOS.events.emit('realtime:platform_event',payload.new);
          /* Show toast for notable events */
          if(evType==='session_start'&&window.OmegaNotify){
            window.OmegaNotify.showToast('Member active \u00b7 Platform alive','info');
          }
        })
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'activity_feed'},function(payload){
          var item=payload.new;
          if(!item) return;
          _tickerItems.unshift(item.title||'Sovereign event');
          if(_tickerItems.length>20) _tickerItems.pop();
          startTicker();
          if(window.OmegaOS)window.OmegaOS.events.emit('realtime:new_activity',item);
        })
        .subscribe(function(status){
          if(window.OmegaOS)window.OmegaOS.events.emit('realtime:channel_status',{status:status});
        });
      _subs.push(ch);
    }catch(e){}
  }

  /* ── LIVE TICKER STRIP ─────────────────────────────────────────── */
  function injectTicker(){
    if(document.getElementById('omega-ticker-strip')) return;
    var strip=document.createElement('div');
    strip.id='omega-ticker-strip';
    strip.setAttribute('aria-live','polite');
    strip.setAttribute('aria-label','Live platform activity');
    /* bottom:0 with z-index 200 puts this entirely inside nav.js's 66px
       #omega-mob bar (z-index 9990), so on a phone the live feed has always
       been 100% covered -- measured at 375x667 as y 639..667 against the
       bar's 618..667. Sits directly on top of the bar instead. */
    if(!document.getElementById('omega-ticker-strip-css')){
      var ss=document.createElement('style');
      ss.id='omega-ticker-strip-css';
      ss.textContent='@media(max-width:760px){#omega-ticker-strip{bottom:66px!important}}';
      (document.head||document.documentElement).appendChild(ss);
    }
    strip.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:200;background:rgba(2,2,6,.9);border-top:1px solid rgba(201,168,76,.08);padding:5px var(--pad,20px);display:flex;align-items:center;gap:12px;overflow:hidden;height:28px';
    strip.innerHTML='<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:3px;color:rgba(201,168,76,.4);flex-shrink:0">\u03A9 LIVE</span>'
      +'<span id="omega-ticker-text" style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:1px;color:rgba(138,134,118,.5);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">LOADING LIVE FEED\u2026</span>'
      +'<span id="omega-rt-members" style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:2px;color:rgba(201,168,76,.3);flex-shrink:0">\u25cf <span data-live-members>--</span> SOVEREIGN</span>';
    document.body.appendChild(strip);
    /* Adjust page bottom padding */
    var main=document.querySelector('.main,main');
    if(main) main.style.paddingBottom='36px';
    _ticker=document.getElementById('omega-ticker-text');
  }

  var _tickerIdx=0;
  function startTicker(){
    if(!_ticker||!_tickerItems.length) return;
    clearInterval(window.__omegaTickerInterval);
    function show(){
      if(!_tickerItems.length) return;
      _ticker.style.opacity='0';
      setTimeout(function(){
        _ticker.textContent=_tickerItems[_tickerIdx%_tickerItems.length]||'';
        _ticker.style.opacity='1';
        _tickerIdx++;
      },200);
    }
    show();
    window.__omegaTickerInterval=setInterval(show,5000);
  }

  /* ── ANIMATED NUMBER ───────────────────────────────────────────── */
  function animateNum(el,target){
    if(!el) return;
    var current=parseInt(el.textContent)||0;
    if(current===target){el.textContent=target;return;}
    var dur=600,start=performance.now();
    function step(now){
      var p=Math.min((now-start)/dur,1);
      var ease=1-Math.pow(1-p,3);
      el.textContent=Math.round(current+(target-current)*ease);
      if(p<1) requestAnimationFrame(step);
      else el.textContent=target;
    }
    requestAnimationFrame(step);
  }

  /* ── PLATFORM HEALTH BAR ────────────────────────────────────────────
     This drew a hardcoded 87 as a green bar on dashboard.html, titled
     "Platform health: 87/100", to every approved member. The comment above it
     described a heuristic -- "green if no open incidents" -- that was never
     written: nothing counted incidents and nothing computed a score. It is
     CLAUDE.md 8.1 class 9, fabricated data rendered as fact, and neither
     existing fabrication gate could see it: no Math.random(), no backdated
     timestamp, no money.

     There is a real signal already being recorded. bg.js wraps fetch during
     parse and keeps window.__omegaData = {inflight, ok, failed}, counting only
     this platform's own backend (supabase.co, /rest/v1/, /auth/v1/,
     /functions/v1/) and counting a 4xx as an answer rather than a failure. So
     the bar now reports what this session actually observed.

     Below one settled request it asserts NOTHING -- an indeterminate track and
     a title that says so, the same rule omega-sparkline.js follows in drawing
     nothing below two real readings. A number no measurement supports is worse
     than no number. */
  function updateHealthBar(){
    var bar=document.getElementById('omega-health-bar');
    if(!bar) return;
    var d=window.__omegaData;
    var seen=d?(d.ok||0)+(d.failed||0):0;
    if(!seen){
      bar.style.width='100%';
      bar.style.background='var(--line,rgba(201,168,76,.15))';
      bar.title='Platform health: no backend request has settled yet this session';
      bar.setAttribute('aria-label',bar.title);
      return;
    }
    var score=Math.round((d.ok||0)/seen*100);
    bar.style.width=score+'%';
    bar.style.background=score>=85?'var(--green,#3fb27f)':score>=70?'var(--solar,#E2C86D)':'var(--crim,#C4453C)';
    bar.title=(d.ok||0)+' of '+seen+' platform requests succeeded this session'+
      (d.failed?' ('+d.failed+' failed)':'');
    bar.setAttribute('aria-label',bar.title);
  }

  /* The mission bar's status light had the same defect as the bar above and a
     worse consequence: #health-dot shipped a hardcoded green background and
     #health-label the literal word OPERATIONAL, with no writer anywhere in the
     repository. It asserted the platform was healthy whether or not it was --
     including while every request the member made was failing. Same measured
     signal, and it says nothing until something has settled. */
  function updateHealthLight(){
    var dot=document.getElementById('health-dot'),lab=document.getElementById('health-label');
    if(!dot&&!lab) return;
    var d=window.__omegaData;
    var seen=d?(d.ok||0)+(d.failed||0):0;
    var colour,text;
    if(!seen){ colour='var(--muted,#8a8676)'; text='AWAITING SIGNAL'; }
    else {
      var pct=(d.ok||0)/seen*100;
      colour=pct>=85?'var(--green,#3fb27f)':pct>=70?'var(--solar,#E2C86D)':'var(--crim,#C4453C)';
      text=pct>=85?'OPERATIONAL':pct>=70?'DEGRADED':'FAILING';
    }
    if(dot){ dot.style.background=colour; }
    if(lab){
      /* i18n owns this node's text through data-i18n; drop the binding once a
         measurement replaces the static string, or apply() would overwrite it
         with the English literal on the next language change. */
      lab.removeAttribute('data-i18n');
      lab.textContent=text;
      lab.title=seen?((d.ok||0)+' of '+seen+' platform requests succeeded this session')
                    :'No backend request has settled yet this session';
    }
  }

  /* ── INIT ──────────────────────────────────────────────────────── */
  document.addEventListener('omega:populated',function(e){
    _profile=e.detail&&e.detail.profile;
    injectTicker();
    startMemberPulse();
    pollActivityFeed().then(startTicker);
    subscribeRealtimeChannel();
    updateHealthBar();
    updateHealthLight();
    /* Re-read as requests settle: bg.js's recorder emits this on every
       observed response, so the bar tracks the session instead of freezing at
       whatever had settled when the profile arrived. */
    document.addEventListener('omega:fetch-settled',function(){
      updateHealthBar(); updateHealthLight();
    });
    /* Refresh activity every 2 minutes */
    setInterval(pollActivityFeed,120000);
  });

  function timeAgo(d){
    var diff=Math.round((Date.now()-d.getTime())/1000);
    if(diff<60) return diff+'s ago';
    if(diff<3600) return Math.round(diff/60)+'m ago';
    if(diff<86400) return Math.round(diff/3600)+'h ago';
    return Math.round(diff/86400)+'d ago';
  }

  window.OmegaRealtime={
    members:function(){return _onlineCount;},
    feed:function(){return _eventFeed.slice(0,5);},
    refresh:function(){refreshMemberCount();pollActivityFeed();}
  };
})();
