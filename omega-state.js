/* ==========================================================================
   Ω SYD OMEGA 91717 — UNIVERSAL COMPONENT STATE MACHINE (omega-state.js)
   ========================================================================== */
(function(){
  if(window.__omegaStateActive) return;
  window.__omegaStateActive = true;
  var _states = {};
  var PHI = 1.6180339887, EU = 2.7182818285;

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

  function makeSpinner(){var box=document.createDocumentFragment(),spin=document.createElement('div'),label=document.createElement('span');spin.style.cssText='width:16px;height:16px;border:2px solid rgba(201,168,76,.15);border-top-color:var(--gold,#C9A84C);border-radius:50%;animation:oa-spin 1s linear infinite';label.style.cssText='font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:2px;color:var(--muted,#8a8676)';label.textContent='LOADING';box.appendChild(spin);box.appendChild(label);return box;}

  function setStateMessage(container, message, options){
    if(!container) return;
    options = options || {};
    container.textContent = '';
    var box = document.createElement('div');
    if(options.error){
      box.style.cssText = 'padding:14px;border:1px solid rgba(139,0,0,.25);border-radius:2px;background:rgba(139,0,0,.04);text-align:center';
      var title = document.createElement('div');
      title.style.cssText = 'font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:2px;color:var(--crim,#C4453C);margin-bottom:4px';
      title.textContent = 'ERROR';
      var detail = document.createElement('div');
      detail.style.cssText = 'font-size:12px;color:rgba(233,230,220,.6)';
      detail.textContent = String(message || 'Failed to load data. Please refresh.');
      box.appendChild(title);
      box.appendChild(detail);
    } else {
      box.style.cssText = 'padding:28px;text-align:center';
      var icon = document.createElement('div');
      icon.style.cssText = 'font-family:var(--D,\'Cinzel Decorative\',serif);font-size:36px;color:rgba(201,168,76,.12);margin-bottom:10px';
      icon.textContent = String(options.icon || 'Ω');
      var label = document.createElement('div');
      label.style.cssText = 'font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:3px;color:rgba(138,134,118,.4)';
      label.textContent = String(message || 'NO DATA AVAILABLE');
      box.appendChild(icon);
      box.appendChild(label);
    }
    container.appendChild(box);
  }

  var OmegaState = {
    set: function(key, state, msg, icon){
      _states[key] = state;
      var el = document.querySelector('[data-omega-state="'+key+'"]');
      if(!el) return;
      el.dataset.state = state;
      var loadEl = el.querySelector('[data-state-loading]');
      var errEl = el.querySelector('[data-state-error]');
      var emptyEl = el.querySelector('[data-state-empty]');
      if(loadEl && !loadEl.textContent.trim() && !loadEl.children.length){loadEl.replaceChildren(makeSpinner());}
      if(errEl && state==='error') setStateMessage(errEl, msg, {error:true});
      if(emptyEl && state==='empty') setStateMessage(emptyEl, msg, {icon:icon});
      el.setAttribute('aria-busy', state==='loading'?'true':'false');
      if(state==='error') el.setAttribute('aria-live','assertive');
      else el.removeAttribute('aria-live');
      try{ document.dispatchEvent(new CustomEvent('omega:state', {detail:{key:key,state:state,msg:msg}})); }catch(e){}
    },
    get: function(key){ return _states[key]||'idle'; },
    wrap: async function(key, fn, opts){
      opts = opts||{};
      this.set(key,'loading');
      try{
        var result = await fn();
        if(opts.isEmpty&&opts.isEmpty(result)) this.set(key,'empty',opts.emptyMsg,opts.emptyIcon);
        else { this.set(key,'success'); if(opts.onSuccess) opts.onSuccess(result); }
        return result;
      }catch(err){
        this.set(key,'error',opts.errorMsg||err.message||'An error occurred');
        if(opts.onError) opts.onError(err);
        if(opts.retry && !opts.retrying){
          var delay = opts.retryDelay||3000;
          setTimeout(function(){ OmegaState.wrap(key, fn, Object.assign({},opts,{retrying:true})); }, delay);
        }
        throw err;
      }
    },
    init: function(){
      document.querySelectorAll('[data-omega-state]').forEach(function(el){
        if(!el.dataset.stateInited){
          el.dataset.stateInited='1';
          if(!el.querySelector('[data-state-loading]')){
            var l=document.createElement('div');
            l.setAttribute('data-state-loading','');
            l.appendChild(makeSpinner());
            el.insertBefore(l,el.firstChild);
          }
          el.dataset.state=el.dataset.stateDefault||'idle';
        }
      });
    }
  };

  window.OmegaState = OmegaState;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ OmegaState.init(); });
  else OmegaState.init();
  document.addEventListener('omega:populated', function(){ setTimeout(OmegaState.init,100); });
})();
