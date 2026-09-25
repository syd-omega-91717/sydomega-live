/**
 * Ω SYD OMEGA 91717 — Emblem Integration
 * Canonical visual bridge for navigation, page doors and content disclosure.
 */
(function(){
  'use strict';
  if(window.OmegaEmblemIntegration)return;
  function init(){
    if(window.OmegaEmblemIntegration)return;
    window.OmegaEmblemIntegration={
      renderEmblem:renderEmblem,
      enhanceNavItem:enhanceNavItem,
      injectSidebarEmblems:injectSidebarEmblems,
      ensurePageDoor:ensurePageDoor
    };
    injectSidebarEmblems();
    setupCursorTracking();
    loadContentSigils();
  }
  function renderEmblem(pageFilename,options){
    options=options||{};
    var emblem=window.OmegaEmblems&&window.OmegaEmblems.get?pageFilename?window.OmegaEmblems.get(pageFilename):null:null;
    if(!emblem)return null;
    var size=options.size||32,color=options.color||'currentColor';
    var wrapper=document.createElement('span');
    wrapper.className='emblem-icon';
    wrapper.style.cssText='display:inline-flex;align-items:center;justify-content:center;width:'+size+'px;height:'+size+'px;flex:0 0 auto;';
    wrapper.innerHTML=emblem.svg.replace(/stroke="currentColor"/g,'stroke="'+color+'"').replace(/fill="currentColor"/g,'fill="'+color+'"');
    return wrapper;
  }
  function enhanceNavItem(navElement,pageFilename){
    if(!navElement||!window.OmegaEmblems||!window.OmegaEmblems.get)return;
    var emblem=window.OmegaEmblems.get(pageFilename);if(!emblem)return;
    navElement.classList.add('nav-emblem-enhanced');
    navElement.setAttribute('data-emblem-domain',emblem.domain||'UNKNOWN');
    if(!navElement.querySelector('.emblem-icon')){
      var el=renderEmblem(pageFilename,{size:22});
      if(el)navElement.insertBefore(el,navElement.firstChild);
    }
  }
  function injectSidebarEmblems(){
    var sidebar=document.getElementById('omega-side')||document.querySelector('.side');if(!sidebar)return;
    sidebar.querySelectorAll('a[href],.nav-item').forEach(function(item){
      var href=item.getAttribute('href')||'',page=href.split('/').pop()||'';
      if(/\.html(?:#.*)?$/.test(page))enhanceNavItem(item,page.split('#')[0]);
    });
  }
  function setupCursorTracking(){
    if(document.documentElement.dataset.omegaCursorLayer==='1')return;
    document.documentElement.dataset.omegaCursorLayer='1';
    var raf=0;
    document.addEventListener('pointermove',function(e){
      if(raf)return;
      raf=requestAnimationFrame(function(){
        raf=0;
        document.documentElement.style.setProperty('--omega-pointer-x',Math.round(e.clientX)+'px');
        document.documentElement.style.setProperty('--omega-pointer-y',Math.round(e.clientY)+'px');
      });
    },{passive:true});
  }
  function loadContentSigils(){
    if(document.querySelector('script[data-omega-content-sigils]'))return;
    var s=document.createElement('script');s.src='/omega-content-sigil-system.js';s.defer=true;s.setAttribute('data-omega-content-sigils','1');
    function append(){if(document.body)document.body.appendChild(s);else document.addEventListener('DOMContentLoaded',function(){if(document.body)document.body.appendChild(s);},{once:true});}
    append();
  }
  function ensurePageDoor(){if(window.OmegaContentSigils&&OmegaContentSigils.mountDoor)OmegaContentSigils.mountDoor();}
  var tries=0;
  function wait(){
    if(window.OmegaEmblems){init();return;}
    if(++tries<120)setTimeout(wait,50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait,{once:true});else wait();
})();