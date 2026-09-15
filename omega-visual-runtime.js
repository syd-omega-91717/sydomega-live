/* Ω VISUAL RUNTIME — opening composition and visual-universe bridge.
   Additive only. The existing omega-sculpture renderer remains the dimensional
   object; the landing gateway is a separate architectural presentation layer.
   No route, component, renderer or page contract is replaced. */
(function(){
  'use strict';
  if(window.__OMEGA_VISUAL_RUNTIME__) return;
  window.__OMEGA_VISUAL_RUNTIME__=true;
  var root=document.documentElement;
  var page=(location.pathname||'/').split('/').pop()||'index.html';
  page=page.replace(/\.html?$/i,'').toLowerCase()||'index';
  root.dataset.omegaPage=page;
  root.dataset.omegaVisual='active';
  function addSheet(id,href){
    if(document.getElementById(id) || document.querySelector('link[rel="stylesheet"][href$="'+href+'"]')) return;
    var link=document.createElement('link'); link.id=id; link.rel='stylesheet'; link.href='/'+href;
    (document.head||document.documentElement).appendChild(link);
  }
  function markRuntime(){
    function mount(){
      if(!document.body || document.querySelector('[data-omega-runtime-mark]')) return;
      var mark=document.createElement('span'); mark.dataset.omegaRuntimeMark='true'; mark.setAttribute('aria-hidden','true');
      mark.style.cssText='position:fixed;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden';
      mark.textContent='SYD OMEGA visual runtime active: '+page; document.body.appendChild(mark);
    }
    if(document.body) mount(); else document.addEventListener('DOMContentLoaded',mount,{once:true});
  }
  root.style.setProperty('--omega-reading','clamp(14px,1.05vw,16px)');
  root.style.setProperty('--omega-leading','1.62');
  addSheet('omega-visual-runtime-css','omega-visual-universe.css');
  addSheet('omega-page-elevation-css','omega-page-elevation.css');
  markRuntime();
  if(page!=='index') return;
  addSheet('omega-opening-system-css','omega-opening-system.css');
  addSheet('omega-home-depth-correction-css','omega-home-depth-correction.css');
  addSheet('omega-entertainment-3d-css','omega-entertainment-3d.css');
  addSheet('omega-world-atmosphere-css','omega-world-atmosphere.css');
  function installOpeningStage(){
    var mount=document.querySelector('.ohz-hero-art[data-omega-sculpture="signet"]') || document.querySelector('.ohz-hero-art[data-omega-sculpture]');
    if(!mount || mount.dataset.omegaGatewayInstalled==='1') return !!mount;
    mount.dataset.omegaGatewayInstalled='1';
    mount.setAttribute('aria-label','SYD OMEGA 91717 sovereign genesis dimensional gateway');
    mount.setAttribute('data-sculpt-label','Omega Nexus architectural gateway connecting intelligence, gaming and cinema');
    var reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var scene=document.createElement('div'); scene.className='omega-gateway';
    scene.innerHTML='<div class="omega-gateway-chamber" aria-hidden="true">'
      +'<div class="omega-gateway-monolith left"></div><div class="omega-gateway-monolith right"></div>'
      +'<div class="omega-gateway-pillar left"></div><div class="omega-gateway-pillar right"></div>'
      +'<div class="omega-gateway-portal"><div class="omega-gateway-vault"></div>'
      +'<div class="omega-gateway-ring r1"></div><div class="omega-gateway-ring r2"></div><div class="omega-gateway-ring r3"></div><div class="omega-gateway-ring r4"></div>'
      +'<div class="omega-gateway-core"><div class="omega-gateway-mark">Ω</div></div></div>'
      +'<div class="omega-gateway-beam"></div><div class="omega-gateway-floor"></div>'
      +'<i class="omega-gateway-node"></i><i class="omega-gateway-node"></i><i class="omega-gateway-node"></i><i class="omega-gateway-node"></i>'
      +'<div class="omega-gateway-code">91717 · GENESIS FIELD</div><div class="omega-gateway-caption">THE CODE · THE FREQUENCY · THE LEGACY</div>'
      +'<div class="omega-gateway-worlds" aria-label="Entertainment worlds">'
      +'<a class="omega-world-card omega-world-game" href="/media.html" aria-label="Enter the gaming universe"><span class="omega-world-depth"></span><span class="omega-world-glyph" aria-hidden="true">◈</span><span class="omega-world-index">WORLD 01</span><span class="omega-world-title">GAMING</span><span class="omega-world-meta">ARENA · CHARACTERS · REWARDS</span><span class="omega-world-arrow" aria-hidden="true">→</span></a>'
      +'<a class="omega-world-card omega-world-cinema" href="/cinema.html" aria-label="Enter sovereign cinema"><span class="omega-world-depth"></span><span class="omega-world-glyph" aria-hidden="true">▶</span><span class="omega-world-index">WORLD 02</span><span class="omega-world-title">CINEMA</span><span class="omega-world-meta">SAGA · SERIES · UNIVERSE</span><span class="omega-world-arrow" aria-hidden="true">→</span></a>'
      +'</div>'
      +'<div class="omega-gateway-spine" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'
      +'</div>';
    mount.appendChild(scene);
    if(!reduced){
      mount.addEventListener('pointermove',function(ev){
        var rect=mount.getBoundingClientRect();
        var nx=((ev.clientX-rect.left)/Math.max(rect.width,1)-.5)*2;
        var ny=((ev.clientY-rect.top)/Math.max(rect.height,1)-.5)*2;
        scene.style.transform='translate3d('+(nx*4).toFixed(2)+'px,'+(ny*3).toFixed(2)+'px,0)';
      },{passive:true});
      mount.addEventListener('pointerleave',function(){scene.style.transform='translate3d(0,0,0)';},{passive:true});
    }
    return true;
  }
  function boot(){
    if(installOpeningStage()) return; var tries=0;
    var timer=setInterval(function(){if(installOpeningStage() || ++tries>=40) clearInterval(timer);},100);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
