/* ==========================================================================
   Ω SYD OMEGA 91717 — LIVE DATA ENGINE (omega-live.js)
   
   Directive: "Every page should actively communicate with APIs, AI,
   databases, analytics, notifications, and event systems.
   Nothing should remain static unless intentionally designed that way."
   
   Capabilities:
   A. LIVE KPI BINDING — auto-populates data-live-kpi elements from Supabase
   B. REAL-TIME STATUS  — presence count, online members, platform pulse
   C. AUTO-REFRESH      — configurable refresh intervals per element
   D. LIVE FEED TICKER  — animated recent activity strip
   E. PLATFORM PULSE    — periodic health check + status indicator
   F. DATA-BIND ATTRS   — declarative binding: data-live="rpc:my_function"
   G. SMART RETRY       — exponential backoff on network failures
   ========================================================================== */
(function(){
  if(window.__omegaLiveActive) return;
  window.__omegaLiveActive = true;

  var _uid = null;
  var _profile = null;
  var _retries = {};
  var _pulseStatus = 'checking';
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  /* ── A. DECLARATIVE DATA BINDING ──────────────────────────────── */
  /* Usage: <span data-live="profile:axis_a" data-live-format="fixed:3"></span> */
  /* Usage: <div data-live="count:profiles" data-live-filter="access_approved:true"></div> */
  function setLiveState(el,state,text){
    if(!el)return;
    var previous=el.dataset.liveState;
    el.dataset.liveState=state;
    if(text!==undefined)el.textContent=text;
    else if(state==='loading'&&previous!=='live'&&previous!=='calculated')el.textContent='…';
  }

  function bindLiveElements(){
    document.querySelectorAll('[data-live]').forEach(function(el){
      if(el.dataset.liveBound==='1') return;
      var spec=el.dataset.live||'';
      var format=el.dataset.liveFormat||'';
      var refresh=parseInt(el.dataset.liveRefresh||'0');
      if(!window.__omegaSb||!_uid){
        setLiveState(el,'unavailable','—');
        delete el.dataset.liveBound;
        if(el.__omegaLiveRefreshId){clearInterval(el.__omegaLiveRefreshId);el.__omegaLiveRefreshId=null;}
        return;
      }
      el.dataset.liveBound='1';
      fetchLive(el,spec,format);
      if(refresh>0&&!el.__omegaLiveRefreshId)el.__omegaLiveRefreshId=setInterval(function(){
        if(document.visibilityState==='visible')fetchLive(el,spec,format);
      },refresh*1000);
    });
  }

  function stopLiveRefreshTimers(){
    document.querySelectorAll('[data-live]').forEach(function(el){
      if(el.__omegaLiveRefreshId){clearInterval(el.__omegaLiveRefreshId);el.__omegaLiveRefreshId=null;}
    });
  }

  function clearMemberLiveData(){
    stopLiveRefreshTimers();
    _profile=null;
    _uid=null;
    document.querySelectorAll('[data-live]').forEach(function(el){
      delete el.dataset.liveBound;
      setLiveState(el,'unavailable','—');
    });
  }

  function bindAuthStateListener(){
    var sb=window.__omegaSb;
    if(!sb||!sb.auth||typeof sb.auth.onAuthStateChange!=='function'||window.__omegaLiveAuthStateBound)return;
    window.__omegaLiveAuthStateBound=true;
    sb.auth.onAuthStateChange(function(event,session){
      if(event==='SIGNED_OUT'){
        clearMemberLiveData();
      }else if(event==='SIGNED_IN'&&session&&!_uid){
        document.querySelectorAll('[data-live]').forEach(function(el){delete el.dataset.liveBound;});
      }
    });
  }

  function resumeLiveRefreshTimers(){
    document.querySelectorAll('[data-live]').forEach(function(el){
      if(el.__omegaLiveRefreshId) return;
      var refresh=parseInt(el.dataset.liveRefresh||'0');
      if(refresh>0) el.__omegaLiveRefreshId=setInterval(function(){
        if(document.visibilityState==='visible') fetchLive(el,el.dataset.live,el.dataset.liveFormat||'');
      },refresh*1000);
    });
  }

  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='hidden') stopLiveRefreshTimers();
    else resumeLiveRefreshTimers();
  });
  window.addEventListener('pagehide',stopLiveRefreshTimers);
  window.addEventListener('pageshow',resumeLiveRefreshTimers);

  function fetchLive(el,spec,format){
    if(!el)return;
    if(!window.__omegaSb||!_uid){
      setLiveState(el,'unavailable','—');
      return;
    }
    var parts=String(spec||'').split(':');
    var type=parts[0];
    var target=parts[1];
    var sb=window.__omegaSb;
    setLiveState(el,'loading');
    if(type==='profile'){
      if(!_profile||!target||_profile[target]==null){
        setLiveState(el,'unavailable','—');
        return;
      }
      renderValue(el,_profile[target],format);
      setLiveState(el,'live');
      return;
    }
    if(type==='count'){
      if(!target){setLiveState(el,'unavailable','—');return;}
      var filter=el.dataset.liveFilter;
      var q=sb.from(target).select('id',{count:'exact',head:true});
      if(filter){var kv=filter.split(':');q=q.eq(kv[0],kv[1]==='true'?true:kv[1]);}
      q.then(function(r){
        if(r&&r.error){setLiveState(el,'error','—');return;}
        if(!r||r.count==null){setLiveState(el,'unavailable','—');return;}
        renderValue(el,r.count,format);
        setLiveState(el,'live');
      }).catch(function(){setLiveState(el,'error','—');});
      return;
    }
    if(type==='rpc'){
      if(!target){setLiveState(el,'unavailable','—');return;}
      sb.rpc(target).then(function(r){
        if(r&&r.error){setLiveState(el,'error','—');return;}
        if(!r||r.data==null){setLiveState(el,'unavailable','—');return;}
        renderValue(el,r.data,format);
        setLiveState(el,'live');
      }).catch(function(){setLiveState(el,'error','—');});
      return;
    }
    if(type==='auth'){
      if(!_profile||_profile.axis_a==null||_profile.axis_b==null||_profile.axis_c==null){
        setLiveState(el,'unavailable','—');
        return;
      }
      var a=Number(_profile.axis_a),b=Number(_profile.axis_b),c=Number(_profile.axis_c);
      if(!isFinite(a)||!isFinite(b)||!isFinite(c)){
        setLiveState(el,'unavailable','—');
        return;
      }
      var phi=1.6180339887,euler=2.7182818285;
      var auth=Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*phi/euler;
      renderValue(el,auth,format||'fixed:4');
      setLiveState(el,'calculated');
      return;
    }
    setLiveState(el,'unavailable','—');
  }

  function renderValue(el, val, format){
    if(val==null){el.textContent='--';return;}
    var fmt = format.split(':');
    var type=fmt[0], arg=fmt[1];
    if(type==='fixed') el.textContent=Number(val).toFixed(parseInt(arg)||2);
    else if(type==='count') el.textContent=Math.round(Number(val)).toLocaleString();
    else if(type==='pct') el.textContent=(Number(val)*100).toFixed(1)+'%';
    else if(type==='currency') el.textContent='$'+Number(val).toLocaleString();
    else el.textContent=String(val);
    /* Animate value change */
    el.style.animation='none';
    requestAnimationFrame(function(){
      el.style.animation='oa-count .3s ease';
    });
    if(window.OmegaAnimate&&window.OmegaAnimate.countUp&&type==='fixed'){
      window.OmegaAnimate.countUp(el, Number(val), {decimals:parseInt(arg)||4, duration:800});
    }
  }

  /* ── B. PLATFORM PULSE (real-time data connection status) ─────── */
  function createPulseIndicator(){
    var topbar = document.querySelector('.topbar');
    if(!topbar||document.getElementById('omega-pulse')) return;

    var dot = document.createElement('div');
    dot.id='omega-pulse';
    dot.title='Live data status';
    dot.setAttribute('aria-label','Live data status: '+_pulseStatus);
    dot.style.cssText='width:7px;height:7px;border-radius:50%;background:var(--muted,#666);flex-shrink:0;animation:oa-pulse 2s ease-in-out infinite;cursor:pointer';
    dot.addEventListener('click',function(){
      var msg=_pulseStatus==='connected'
        ? 'Live data connection verified.'
        : _pulseStatus==='unavailable'
          ? 'Live data connection is currently unavailable.'
          : 'Live data connection is being checked.';
      if(window.OmegaNotify)window.OmegaNotify.showToast(msg,_pulseStatus==='connected'?'success':'info');
    });
    var style=document.createElement('style');
    style.textContent='@keyframes oa-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)}}';
    document.head.appendChild(style);
    topbar.appendChild(dot);
    verifyPulse(dot);
  }

  function verifyPulse(dot){
    if(!window.__omegaSb){
      _pulseStatus='unavailable';
      dot.style.background='var(--red,#8B0000)';
      dot.setAttribute('aria-label','Live data status: unavailable');
      return;
    }
    window.__omegaSb.from('profiles').select('id',{count:'exact',head:true}).limit(1)
      .then(function(r){
        _pulseStatus=(r&&r.error)?'unavailable':'connected';
        dot.style.background=_pulseStatus==='connected'?'var(--green,#3fb27f)':'var(--red,#8B0000)';
        dot.setAttribute('aria-label','Live data status: '+_pulseStatus);
        dot.title='Live data status: '+_pulseStatus;
      })
      .catch(function(){
        _pulseStatus='unavailable';
        dot.style.background='var(--red,#8B0000)';
        dot.setAttribute('aria-label','Live data status: unavailable');
        dot.title='Live data status: unavailable';
      });
  }

  /* ── C. LIVE MEMBER COUNT ─────────────────────────────────────── */
  function updateMemberCount(){
    var elements=document.querySelectorAll('[data-live-members]');
    if(!elements.length)return;
    if(!window.__omegaSb){
      elements.forEach(function(el){setLiveState(el,'unavailable','—');});
      return;
    }
    elements.forEach(function(el){setLiveState(el,'loading');});
    window.__omegaSb.from('profiles').select('id',{count:'exact',head:true}).eq('access_approved',true)
      .then(function(r){
        elements.forEach(function(el){
          if(r&&r.error){setLiveState(el,'error','—');return;}
          if(!r||r.count==null){setLiveState(el,'unavailable','—');return;}
          setLiveState(el,'live',String(r.count));
        });
      }).catch(function(){elements.forEach(function(el){setLiveState(el,'error','—');});});
  }

  /* ── D. ACTIVITY TICKER ───────────────────────────────────────── */
  function startTicker(){
    var tickers=document.querySelectorAll('[data-live-ticker]');
    if(!tickers.length)return;
    if(!window.__omegaSb){
      tickers.forEach(function(ticker){setLiveState(ticker,'unavailable','—');});
      return;
    }
    tickers.forEach(function(ticker){setLiveState(ticker,'loading');});
    window.__omegaSb.from('activity_feed')
      .select('activity_type,title,created_at')
      .eq('is_public',true)
      .order('created_at',{ascending:false})
      .limit(5)
      .then(function(r){
        if(r&&r.error){tickers.forEach(function(ticker){setLiveState(ticker,'error','—');});return;}
        if(!r||!r.data||!r.data.length){tickers.forEach(function(ticker){setLiveState(ticker,'unavailable','—');});return;}
        tickers.forEach(function(ticker){
          var items=r.data;
          var i=0;
          function next(){
            var item=items[i%items.length];i++;
            ticker.style.animation='none';
            requestAnimationFrame(function(){
              ticker.style.animation='oa-fade-in .4s ease';
              ticker.innerHTML='<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:1.5px;color:rgba(201,168,76,.6)">'
                +'&#9670; '+esc(String(item.title||'').slice(0,60))+'</span>';
              setLiveState(ticker,'live');
            });
          }
          var timerId=null;
          function stop(){if(timerId){clearInterval(timerId);timerId=null;}}
          function start(){if(timerId||document.visibilityState!=='visible')return;timerId=setInterval(next,4000);}
          next();start();
          document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')stop();else start();});
          window.addEventListener('pagehide',stop);
          window.addEventListener('pageshow',start);
        });
      }).catch(function(){tickers.forEach(function(ticker){setLiveState(ticker,'error','—');});});
  }

  /* ── E. DATA-AUTO elements (pull data into [data-auto="table:col"]) ── */
  /* Shows skeleton while loading, then reveals content */
  function injectSkeletonCSS(){
    if(document.getElementById('omega-skel-css')) return;
    var s=document.createElement('style');s.id='omega-skel-css';
    s.textContent='.oa-skel{background:linear-gradient(90deg,rgba(201,168,76,.04) 25%,rgba(201,168,76,.08) 50%,rgba(201,168,76,.04) 75%);background-size:400% 100%;animation:skel-wave 1.5s ease-in-out infinite;border-radius:2px;height:1em;display:inline-block;min-width:60px}'
      +'@keyframes skel-wave{0%{background-position:100% 0}100%{background-position:-100% 0}}';
    document.head.appendChild(s);
  }

  /* ── INIT ─────────────────────────────────────────────────────── */
  document.addEventListener('omega:populated', function(e){
    _profile=e.detail&&e.detail.profile;
    _uid=_profile&&_profile.id;
    bindAuthStateListener();
    bindLiveElements();
    createPulseIndicator();
    updateMemberCount();
    setTimeout(startTicker,1000);
    injectSkeletonCSS();
  });

  /* Initialize placeholders even when a visitor is signed out and no profile
     population event will ever fire. A later authenticated population retries
     these bindings because unavailable bindings are not marked complete. */
  function initializeLiveShell(){
    bindLiveElements();
    createPulseIndicator();
    injectSkeletonCSS();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeLiveShell);
  else initializeLiveShell();

  /* Re-bind after dynamic content changes */
  var _bindObs = new MutationObserver(function(){ bindLiveElements(); });
  window.addEventListener('load',function(){
    _bindObs.observe(document.body,{childList:true,subtree:false});
  });

  window.OmegaLive = {
    bind: bindLiveElements,
    render: renderValue,
    pulse: createPulseIndicator
  };
})();
