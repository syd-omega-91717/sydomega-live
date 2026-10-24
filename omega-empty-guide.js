/* ==========================================================================
   Ω omega-empty-guide.js — a first step where a page would show only zeros

   A new member's money pages rendered rows of $0 with nothing saying what to
   do (measured 2026-10-19: wallet, treasury, investment, revenue, budget and
   wealth, every KPI zero). This draws one card under a row of figures while
   EVERY figure in it reads zero, naming the first action; it disappears the
   moment any figure is non-zero. It never writes or invents a value (CLAUDE.md
   8.1 class 9): it reads the page's own numbers and only points at the page's
   own controls.

     <div class="kpi-row"
          data-omega-empty-guide="No accounts recorded yet."
          data-omega-empty-cta="Add your first account"
          data-omega-empty-go=".tab-btn[data-tab='accounts']"   (optional: clicked first; 'a | b' clicks in order)
          data-omega-empty-focus="#tab-accounts">               (optional: scrolled to, first field focused)

   Figures watched: .kpi-n .kpi-v .stat-num .nw-val inside the element, or the
   element itself (data-omega-empty-watch="self"). A row with no figures yet
   (built later by the page's script) waits; the MutationObserver re-checks.
   The first verdict waits 1.2s after load so a member whose data is still
   arriving does not see the card flash.
   ========================================================================== */
(function(){
  'use strict';
  if(window.OmegaEmptyGuide) return;

  var ZERO=/^\s*[$€£Ω]?\s*-?0+(?:[.,]0+)?\s*%?\s*$|^\s*(?:--|—|–)\s*$/;
  var FIGURES='.kpi-n,.kpi-v,.stat-num,.nw-val';

  function css(){
    if(document.getElementById('omega-empty-guide-css')) return;
    var s=document.createElement('style');s.id='omega-empty-guide-css';
    s.textContent=
      '.oeg{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;'+
      'margin:12px 0 18px;padding:14px 18px;border:1px dashed color-mix(in srgb,var(--gold,#C9A84C) 45%,transparent);'+
      'border-radius:10px;background:color-mix(in srgb,var(--gold,#C9A84C) 6%,transparent)}'+
      '.oeg-t{font-family:var(--R,system-ui,sans-serif);font-size:15px;color:var(--ink,#E9E6DC)}'+
      '.oeg-t small{display:block;margin-top:2px;font-size:12px;color:var(--muted,#9A978C)}'+
      '.oeg-b{font-family:var(--M,monospace);font-size:12px;letter-spacing:.12em;text-transform:uppercase;'+
      'padding:10px 16px;min-height:40px;border-radius:8px;border:1px solid var(--gold,#C9A84C);'+
      'background:var(--gold,#C9A84C);color:#0A0A0F;cursor:pointer}'+
      '.oeg-b:focus-visible{outline:2px solid var(--cyan,#00E5FF);outline-offset:2px}';
    document.head.appendChild(s);
  }

  function figures(host){
    if(host.getAttribute('data-omega-empty-watch')==='self') return [host];
    return Array.prototype.slice.call(host.querySelectorAll(FIGURES));
  }
  function allZero(host){
    var f=figures(host);
    if(!f.length) return false;
    for(var i=0;i<f.length;i++){ if(!ZERO.test(f[i].textContent||'')) return false; }
    return true;
  }

  function act(host){
    var go=host.getAttribute('data-omega-empty-go');
    var focus=host.getAttribute('data-omega-empty-focus');
    /* A '|' list is clicked in order: a page whose form sits in another tab
       needs the tab first, then the form's own opener. */
    if(go) go.split('|').forEach(function(sel){ var g=document.querySelector(sel.trim()); if(g) g.click(); });
    var t=focus?document.querySelector(focus):null;
    if(!t) return;
    t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
    var field=t.matches('input,select,textarea')?t:t.querySelector('input:not([type=hidden]),select,textarea');
    if(field) setTimeout(function(){ try{ field.focus({preventScroll:true}); }catch(_){ field.focus(); } },250);
  }

  function card(host){
    var c=document.createElement('div');c.className='oeg';c.setAttribute('role','note');
    var t=document.createElement('div');t.className='oeg-t';
    t.textContent=host.getAttribute('data-omega-empty-guide');
    var sub=document.createElement('small');sub.textContent='These figures fill in from what you record here.';
    t.appendChild(sub);
    c.appendChild(t);
    var cta=host.getAttribute('data-omega-empty-cta');
    if(cta){
      var b=document.createElement('button');b.type='button';b.className='oeg-b';b.textContent=cta+' →';
      b.addEventListener('click',function(){ act(host); });
      c.appendChild(b);
    }
    return c;
  }

  function sync(host){
    var empty=allZero(host);
    if(empty && !host._oeg){ host._oeg=card(host); host.insertAdjacentElement('afterend',host._oeg); }
    else if(!empty && host._oeg){ host._oeg.remove(); host._oeg=null; }
  }

  function arm(host){
    if(host._oegArmed) return; host._oegArmed=true;
    sync(host);
    new MutationObserver(function(){ sync(host); })
      .observe(host,{subtree:true,childList:true,characterData:true});
  }

  function boot(){
    css();
    document.querySelectorAll('[data-omega-empty-guide]').forEach(arm);
  }
  function start(){ setTimeout(boot,1200); }
  if(document.readyState==='complete') start(); else window.addEventListener('load',start);

  window.OmegaEmptyGuide={ refresh:boot, isEmpty:allZero };
})();
