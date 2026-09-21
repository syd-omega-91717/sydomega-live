/**
 * Phase C.3: Emblem Integration Layer
 * Wires SVG emblems into navigation and activates the universal content-page
 * sigil layer. Existing page logic remains authoritative.
 */
(function(){
  if(window.OmegaEmblemIntegration)return;
  var checkCatalog=setInterval(function(){
    if(!window.OmegaEmblems)return;
    clearInterval(checkCatalog);init();
  },50);
  function init(){
    window.OmegaEmblemIntegration={renderEmblem:renderEmblem,enhanceNavItem:enhanceNavItem,injectSidebarEmblems:injectSidebarEmblems};
    document.addEventListener('DOMContentLoaded',injectSidebarEmblems);
    if(document.readyState!=='loading')injectSidebarEmblems();
    setupCursorTracking();
    loadContentSigils();
  }
  function renderEmblem(pageFilename,options){
    options=options||{};
    var emblem=window.OmegaEmblems.get(pageFilename);if(!emblem)return null;
    var size=options.size||32,color=options.color||'currentColor';
    var wrapper=document.createElement('div');wrapper.className='emblem-icon';
    wrapper.style.cssText='display:inline-flex;align-items:center;justify-content:center;width:'+size+'px;height:'+size+'px;flex-shrink:0;';
    wrapper.innerHTML=emblem.svg.replace(/viewBox="[^"]*"/,'viewBox="0 0 64 64"').replace(/stroke="currentColor"/g,'stroke="'+color+'"').replace(/fill="currentColor"/g,'fill="'+color+'"');
    return wrapper;
  }
  function enhanceNavItem(navElement,pageFilename){
    if(!navElement)return;
    var emblem=window.OmegaEmblems.get(pageFilename);if(!emblem)return;
    var domainColor='var(--'+emblem.domain.toLowerCase()+'-accent, var(--gold))';
    navElement.style.setProperty('--domain-color',domainColor);navElement.classList.add('nav-emblem-enhanced');navElement.setAttribute('data-emblem-domain',emblem.domain);
    if(!navElement.querySelector('.emblem-icon')){var emblemEl=renderEmblem(pageFilename,{size:24});if(emblemEl)navElement.insertBefore(emblemEl,navElement.firstChild);}
  }
  function injectSidebarEmblems(){
    var sidebar=document.getElementById('omega-side')||document.querySelector('.side');if(!sidebar)return;
    sidebar.querySelectorAll('a[href], .nav-item').forEach(function(item){
      var href=item.getAttribute('href')||'',pageFilename=href.split('/').pop()||'';
      if(pageFilename&&pageFilename.endsWith('.html'))enhanceNavItem(item,pageFilename);
    });
  }
  function setupCursorTracking(){
    var rAFId=null;
    function onPointerMove(e){
      if(rAFId)return;
      rAFId=requestAnimationFrame(function(){
        rAFId=null;var x=e.clientX,y=e.clientY;
        document.querySelectorAll('.card,.kpi,.kpi-card,.glass,.glass-cyan').forEach(function(el){
          var rect=el.getBoundingClientRect();
          if(x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom){
            el.style.setProperty('--mx',((x-rect.left)/rect.width)*100+'%');
            el.style.setProperty('--my',((y-rect.top)/rect.height)*100+'%');
          }
        });
      });
    }
    try{document.addEventListener('pointermove',onPointerMove,{passive:true});}catch(e){document.addEventListener('pointermove',onPointerMove);}
  }
  function loadContentSigils(){
    if(document.querySelector('script[data-omega-content-sigils]'))return;
    var s=document.createElement('script');s.src='/omega-content-sigil-system.js';s.defer=true;s.setAttribute('data-omega-content-sigils','1');
    function append(){if(document.body)document.body.appendChild(s);else document.addEventListener('DOMContentLoaded',function(){if(document.body)document.body.appendChild(s);});}
    append();
  }
})();
