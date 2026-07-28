/* ==========================================================================
   Ω SYD OMEGA 91717 — UNIVERSAL COMPONENT STATE MACHINE (omega-state.js)
   
   Directive: "Every component must have: purpose, logic, interaction,
   accessibility, responsiveness, animation, state management,
   loading state, error state, success state, empty state."
   
   Every element with data-omega-state gets managed automatically.
   
   States: idle → loading → success | error | empty
   
   Usage:
     <div data-omega-state="my-widget">
       <div data-state-loading>LOADING...</div>
       <div data-state-content>...actual content...</div>
       <div data-state-error></div>
       <div data-state-empty></div>
     </div>
     
     OmegaState.set('my-widget', 'loading')
     OmegaState.set('my-widget', 'success')
     OmegaState.set('my-widget', 'error', 'Failed to connect')
     OmegaState.set('my-widget', 'empty', 'No records found')
   ========================================================================== */
(function(){
  if(window.__omegaStateActive) return;
  window.__omegaStateActive = true;

  var _states = {}; /* key → current state */
  var PHI = 1.6180339887, EU = 2.7182818285;

  /* ── CSS INJECTION ────────────────────────────────────────────── */
  (function(){
    if(document.getElementById('omega-state-css')) return;
    var s = document.createElement('style');
    s.id = 'omega-state-css';
    s.textContent = `
      [data-omega-state] [data-state-loading],
      [data-omega-state] [data-state-error],
      [data-omega-state] [data-state-empty] { display:none }
      [data-omega-state][data-state="loading"] [data-state-content] { display:none }
      [data-omega-state][data-state="loading"] [data-state-loading] { display:flex;align-items:center;justify-content:center;gap:8px;padding:20px }
      [data-omega-state][data-state="error"] [data-state-content],
      [data-omega-state][data-state="error"] [data-state-loading] { display:none }
      [data-omega-state][data-state="error"] [data-state-error] { display:block }
      [data-omega-state][data-state="empty"] [data-state-content],
      [data-omega-state][data-state="empty"] [data-state-loading] { display:none }
      [data-omega-state][data-state="empty"] [data-state-empty] { display:block }
      @keyframes oa-state-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
      [data-omega-state] [data-state-content],[data-omega-state] [data-state-error],
      [data-omega-state] [data-state-empty]{animation:oa-state-in .25s ease both}
    `;
    document.head.appendChild(s);
  })();

  /* ── LOADING SPINNER HTML ─────────────────────────────────────── */
  var SPINNER = '<div style="width:16px;height:16px;border:2px solid rgba(201,168,76,.15);border-top-color:var(--gold,#C9A84C);border-radius:50%;animation:oa-spin 1s linear infinite"></div>'
    +'<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:8px;letter-spacing:2px;color:var(--muted,#8a8676)">LOADING</span>';

  var ERROR_HTML = function(msg){
    return '<div style="padding:14px;border:1px solid rgba(139,0,0,.25);border-radius:2px;background:rgba(139,0,0,.04);text-align:center">'
      +'<div style="font-family:var(--M,\'Courier Prime\',monospace);font-size:8px;letter-spacing:2px;color:var(--crim,#8B0000);margin-bottom:4px">&#9888; ERROR</div>'
      +'<div style="font-size:11px;color:rgba(233,230,220,.6)">'+(msg||'Failed to load data. Please refresh.')+'</div>'
      +'</div>';
  };

  var EMPTY_HTML = function(msg, icon){
    return '<div style="padding:28px;text-align:center">'
      +'<div style="font-family:var(--D,\'Cinzel Decorative\',serif);font-size:36px;color:rgba(201,168,76,.12);margin-bottom:10px">'+(icon||'\u03A9')+'</div>'
      +'<div style="font-family:var(--M,\'Courier Prime\',monospace);font-size:9px;letter-spacing:3px;color:rgba(138,134,118,.4)">'+(msg||'NO DATA AVAILABLE')+'</div>'
      +'</div>';
  };

  /* ── STATE MACHINE ────────────────────────────────────────────── */
  var OmegaState = {
    set: function(key, state, msg, icon){
      _states[key] = state;
      var el = document.querySelector('[data-omega-state="'+key+'"]');
      if(!el) return;
      el.dataset.state = state;

      /* Inject placeholder HTML into loading/error/empty slots if empty */
      var loadEl = el.querySelector('[data-state-loading]');
      var errEl  = el.querySelector('[data-state-error]');
      var emptyEl= el.querySelector('[data-state-empty]');

      if(loadEl && !loadEl.innerHTML.trim()) loadEl.innerHTML = SPINNER;
      if(errEl  && state==='error')  errEl.innerHTML  = ERROR_HTML(msg);
      if(emptyEl&& state==='empty') emptyEl.innerHTML = EMPTY_HTML(msg, icon);

      /* Announce to screen readers */
      el.setAttribute('aria-busy', state==='loading'?'true':'false');
      if(state==='error') el.setAttribute('aria-live','assertive');
      else el.removeAttribute('aria-live');

      /* Emit event for orchestration */
      try{ document.dispatchEvent(new CustomEvent('omega:state', {detail:{key:key,state:state,msg:msg}})); }catch(e){}
    },

    get: function(key){ return _states[key]||'idle'; },

    wrap: async function(key, fn, opts){
      opts = opts||{};
      this.set(key,'loading');
      try{
        var result = await fn();
        if(opts.isEmpty&&opts.isEmpty(result)){
          this.set(key,'empty',opts.emptyMsg,opts.emptyIcon);
        } else {
          this.set(key,'success');
          if(opts.onSuccess) opts.onSuccess(result);
        }
        return result;
      }catch(err){
        this.set(key,'error',opts.errorMsg||err.message||'An error occurred');
        if(opts.onError) opts.onError(err);
        /* Smart retry */
        if(opts.retry && !opts.retrying){
          var delay = opts.retryDelay||3000;
          setTimeout(function(){
            OmegaState.wrap(key, fn, Object.assign({},opts,{retrying:true}));
          }, delay);
        }
        throw err;
      }
    },

    init: function(){
      /* Auto-initialize all data-omega-state elements */
      document.querySelectorAll('[data-omega-state]').forEach(function(el){
        if(!el.dataset.stateInited){
          el.dataset.stateInited='1';
          /* Inject loading slot if missing */
          if(!el.querySelector('[data-state-loading]')){
            var l=document.createElement('div');
            l.setAttribute('data-state-loading','');
            l.innerHTML=SPINNER;
            el.insertBefore(l,el.firstChild);
          }
          /* Set initial state from data-state-default attr */
          var def=el.dataset.stateDefault||'idle';
          el.dataset.state=def;
        }
      });
    }
  };

  window.OmegaState = OmegaState;

  /* ── AUTO INIT ────────────────────────────────────────────────── */
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){ OmegaState.init(); });
  } else { OmegaState.init(); }

  /* Re-init after dynamic changes */
  document.addEventListener('omega:populated', function(){ setTimeout(OmegaState.init,100); });
})();
