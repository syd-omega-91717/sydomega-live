/* Ω VISUAL RUNTIME — opening composition and visual-universe bridge.
   This module is deliberately additive. It keeps the existing omega-sculpture
   renderer and turns its landing mount into the visible front-door stage.
   No page architecture, route, component contract, or sculpture scene is
   replaced. The opening is a layered 3-D composition, not a rotating logo.
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

  function addUniverseSheet(){
    if(document.getElementById('omega-visual-runtime-css') ||
       document.querySelector('link[rel="stylesheet"][href$="omega-visual-universe.css"]')) return;
    var link=document.createElement('link');
    link.id='omega-visual-runtime-css';
    link.rel='stylesheet';
    link.href='/omega-visual-universe.css';
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

  addUniverseSheet();
  markRuntime();

  if(page!=='index') return;

  function installOpeningStage(){
    var mount=document.querySelector('.ohz-hero-art[data-omega-sculpture="signet"]') ||
      document.querySelector('.ohz-hero-art[data-omega-sculpture]');
    if(!mount || mount.dataset.omegaGenesisInstalled==='1') return !!mount;
    mount.dataset.omegaGenesisInstalled='1';
    mount.setAttribute('aria-label','SYD OMEGA 91717 sovereign genesis 3-D field');

    var reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var style=document.createElement('style');
    style.id='omega-genesis-opening-css';
    style.textContent='\
.ohz-hero-art[data-omega-sculpture]{position:relative;min-height:min(68vh,620px);isolation:isolate;overflow:visible;perspective:1100px;transform-style:preserve-3d}\
.ohz-hero-art[data-omega-sculpture] canvas{position:relative!important;z-index:1!important;opacity:.30!important;filter:saturate(.82) brightness(.82) contrast(1.05)!important;transform:none!important;mix-blend-mode:screen}\
.omega-genesis{position:absolute;inset:0;z-index:8;display:grid;place-items:center;pointer-events:none;transform-style:preserve-3d;perspective:1100px}\
.omega-genesis-depth{position:absolute;inset:4%;border:1px solid rgba(201,168,76,.12);border-radius:50%;transform:translateZ(-110px) rotateX(64deg) scaleY(.56);box-shadow:0 0 90px rgba(0,229,255,.04);opacity:.8}\
.omega-genesis-depth::before,.omega-genesis-depth::after{content:"";position:absolute;border:1px solid rgba(0,229,255,.10);border-radius:50%;inset:10%;transform:translateZ(55px)}\
.omega-genesis-depth::after{inset:21%;border-color:rgba(201,168,76,.16);transform:translateZ(90px)}\
.omega-genesis-halo{position:absolute;width:min(70vw,760px);height:min(70vw,760px);border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,.13) 0%,rgba(0,229,255,.045) 26%,transparent 68%);filter:blur(5px);transform:translateZ(-45px);animation:omegaGenesisHalo 9s ease-in-out infinite}\
.omega-genesis-core{position:relative;width:min(34vw,340px);height:min(34vw,340px);min-width:220px;min-height:220px;display:grid;place-items:center;transform-style:preserve-3d;transform:translateZ(70px) rotateX(2deg)}\
.omega-genesis-core::before{content:"";position:absolute;inset:7%;border:1px solid rgba(201,168,76,.45);border-radius:50%;box-shadow:0 0 55px rgba(201,168,76,.15),inset 0 0 45px rgba(0,229,255,.04);transform:translateZ(24px);animation:omegaGenesisBreathe 7s ease-in-out infinite}\
.omega-genesis-core::after{content:"";position:absolute;inset:17%;border:1px solid rgba(0,229,255,.24);border-radius:50%;box-shadow:0 0 34px rgba(0,229,255,.10);transform:translateZ(42px) rotateX(62deg) scaleY(.5)}\
.omega-genesis-orbit{position:absolute;inset:-8%;border:1px solid rgba(201,168,76,.22);border-radius:50%;transform:translateZ(10px) rotateX(66deg) rotateZ(-16deg) scaleY(.62);box-shadow:0 0 32px rgba(201,168,76,.06)}\
.omega-genesis-orbit::before,.omega-genesis-orbit::after{content:"";position:absolute;width:7px;height:7px;border-radius:50%;background:#E8C97A;box-shadow:0 0 18px rgba(232,201,122,.9);transform:translateZ(14px)}\
.omega-genesis-orbit::before{left:13%;top:47%}.omega-genesis-orbit::after{right:13%;top:47%;background:#00E5FF;box-shadow:0 0 18px rgba(0,229,255,.82)}\
.omega-genesis-mark{position:relative;z-index:5;font-family:var(--D,"Cinzel Decorative",Georgia,serif);font-size:clamp(150px,18vw,250px);line-height:.78;font-weight:400;letter-spacing:-.075em;color:#F7E0A0;text-shadow:2px 4px 0 rgba(73,53,15,.45),0 0 14px rgba(247,224,160,.80),0 0 46px rgba(201,168,76,.38),0 0 100px rgba(0,229,255,.12);transform:translateZ(85px) translateY(-3%);filter:drop-shadow(0 22px 18px rgba(0,0,0,.45))}\
.omega-genesis-mark::before{content:"";position:absolute;inset:18% 7%;border-radius:50%;border:1px solid rgba(232,201,122,.18);transform:translateZ(-20px);box-shadow:inset 0 0 24px rgba(0,229,255,.035)}\
.omega-genesis-mark::after{content:"";position:absolute;left:9%;right:9%;bottom:-23%;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.75),rgba(0,229,255,.42),transparent);box-shadow:0 0 18px rgba(201,168,76,.35)}\
.omega-genesis-horizon{position:absolute;left:8%;right:8%;bottom:12%;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.08) 14%,rgba(201,168,76,.54) 50%,rgba(0,229,255,.12) 86%,transparent);box-shadow:0 0 22px rgba(201,168,76,.14);transform:translateZ(15px)}\
.omega-genesis-horizon::after{content:"";position:absolute;left:22%;right:22%;top:-4px;height:9px;background:radial-gradient(ellipse,rgba(201,168,76,.18),transparent 70%);filter:blur(5px)}\
.omega-genesis-label{position:absolute;z-index:10;bottom:2%;left:50%;transform:translateX(-50%) translateZ(35px);display:flex;align-items:center;gap:12px;white-space:nowrap;font-family:var(--M,"Courier Prime",monospace);font-size:10px;letter-spacing:.38em;color:rgba(232,201,122,.78);text-transform:uppercase;text-shadow:0 0 12px rgba(201,168,76,.22)}\
.omega-genesis-label::before,.omega-genesis-label::after{content:"";width:48px;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.48))}.omega-genesis-label::after{background:linear-gradient(90deg,rgba(201,168,76,.48),transparent)}\
.omega-genesis-code{position:absolute;top:4%;right:3%;font-family:var(--M,"Courier Prime",monospace);font-size:9px;letter-spacing:.30em;color:rgba(0,229,255,.54);writing-mode:vertical-rl;transform:translateZ(40px)}\
@keyframes omegaGenesisBreathe{0%,100%{transform:translateZ(24px) scale(.985);opacity:.70}50%{transform:translateZ(24px) scale(1.018);opacity:1}}\
@keyframes omegaGenesisHalo{0%,100%{transform:translateZ(-45px) scale(.96);opacity:.62}50%{transform:translateZ(-45px) scale(1.04);opacity:1}}\
@media(max-width:1080px){.omega-genesis-core{width:min(54vw,340px);height:min(54vw,340px)}.omega-genesis-code{right:5%}}\
@media(max-width:700px){.ohz-hero-art[data-omega-sculpture]{min-height:380px}.omega-genesis-core{min-width:190px;min-height:190px;width:68vw;height:68vw}.omega-genesis-mark{font-size:clamp(124px,34vw,180px)}.omega-genesis-label{font-size:8px;letter-spacing:.24em}.omega-genesis-label::before,.omega-genesis-label::after{width:24px}.omega-genesis-code{display:none}.omega-genesis-depth{inset:7%}}\
@media(prefers-reduced-motion:reduce){.omega-genesis-core::before,.omega-genesis-halo{animation:none}.omega-genesis-core::before{opacity:.86}.omega-genesis-halo{opacity:.82}}\
';
    document.head.appendChild(style);

    var scene=document.createElement('div');
    scene.className='omega-genesis';
    scene.innerHTML='<div class="omega-genesis-depth"></div><div class="omega-genesis-halo"></div><div class="omega-genesis-core"><div class="omega-genesis-orbit"></div><div class="omega-genesis-mark" aria-hidden="true">Ω</div></div><div class="omega-genesis-horizon"></div><div class="omega-genesis-code" aria-hidden="true">91717 · GENESIS FIELD</div><div class="omega-genesis-label">THE CODE · THE FREQUENCY · THE LEGACY</div>';
    mount.appendChild(scene);

    if(!reduced){
      var lastX=0,lastY=0;
      mount.addEventListener('pointermove',function(ev){
        var rect=mount.getBoundingClientRect();
        var nx=((ev.clientX-rect.left)/Math.max(rect.width,1)-.5)*2;
        var ny=((ev.clientY-rect.top)/Math.max(rect.height,1)-.5)*2;
        lastX=nx; lastY=ny;
        scene.style.setProperty('--omega-parallax-x',(nx*8).toFixed(2)+'px');
        scene.style.setProperty('--omega-parallax-y',(ny*6).toFixed(2)+'px');
        scene.style.transform='translate3d('+lastX+'px,'+lastY+'px,0)';
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
