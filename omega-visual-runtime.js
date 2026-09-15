/* Ω VISUAL RUNTIME — opening composition and visual-universe bridge.
   Additive only. The existing omega-sculpture renderer remains the dimensional
   object; this runtime adds a restrained gateway around it and never rotates
   the Omega mark. Page architecture, routes and component contracts remain
   unchanged.
*/
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
    var link=document.createElement('link');
    link.id=id;
    link.rel='stylesheet';
    link.href='/'+href;
    (document.head||document.documentElement).appendChild(link);
  }

  function markRuntime(){
    function mount(){
      if(!document.body || document.querySelector('[data-omega-runtime-mark]')) return;
      var mark=document.createElement('span');
      mark.dataset.omegaRuntimeMark='true';
      mark.setAttribute('aria-hidden','true');
      mark.style.cssText='position:fixed;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden';
      mark.textContent='SYD OMEGA visual runtime active: '+page;
      document.body.appendChild(mark);
    }
    if(document.body) mount();
    else document.addEventListener('DOMContentLoaded',mount,{once:true});
  }

  addSheet('omega-visual-runtime-css','omega-visual-universe.css');
  markRuntime();
  if(page!=='index') return;
  addSheet('omega-opening-system-css','omega-opening-system.css');

  function installOpeningStage(){
    var mount=document.querySelector('.ohz-hero-art[data-omega-sculpture="signet"]') || document.querySelector('.ohz-hero-art[data-omega-sculpture]');
    if(!mount || mount.dataset.omegaGatewayInstalled==='1') return !!mount;
    mount.dataset.omegaGatewayInstalled='1';
    mount.setAttribute('aria-label','SYD OMEGA 91717 sovereign genesis dimensional field');

    var reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var scene=document.createElement('div');
    scene.className='omega-gateway';
    scene.innerHTML='<div class="omega-gateway-field" aria-hidden="true"><i class="omega-gateway-node"></i><i class="omega-gateway-node"></i><i class="omega-gateway-node"></i><i class="omega-gateway-node"></i></div><div class="omega-gateway-core"><div class="omega-gateway-mark" aria-hidden="true">Ω</div></div><div class="omega-gateway-horizon" aria-hidden="true"></div><div class="omega-gateway-rule" aria-hidden="true"></div><div class="omega-gateway-code" aria-hidden="true">91717 · GENESIS FIELD</div><div class="omega-gateway-caption">THE CODE · THE FREQUENCY · THE LEGACY</div>';
    mount.appendChild(scene);

    if(!reduced){
      mount.addEventListener('pointermove',function(ev){
        var rect=mount.getBoundingClientRect();
        var nx=((ev.clientX-rect.left)/Math.max(rect.width,1)-.5)*2;
        var ny=((ev.clientY-rect.top)/Math.max(rect.height,1)-.5)*2;
        scene.style.transform='translate3d('+(nx*5).toFixed(2)+'px,'+(ny*4).toFixed(2)+'px,0)';
      },{passive:true});
      mount.addEventListener('pointerleave',function(){scene.style.transform='translate3d(0,0,0)';},{passive:true});
    }
    return true;
  }

  function boot(){
    if(installOpeningStage()) return;
    var tries=0;
    var timer=setInterval(function(){
      if(installOpeningStage() || ++tries>=40) clearInterval(timer);
    },100);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
