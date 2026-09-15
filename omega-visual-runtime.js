/* Ω VISUAL RUNTIME — page identity + visual-universe sheet.
   Front-door correction: the opening sculpture is no longer presented as a
   continuously rotating Omega. The existing 3-D layer remains available to
   the platform, but the landing page now presents a calmer sovereign-genesis
   composition: a centered Omega monument, depth rings, horizon light,
   restrained particles and the 91717 identity. This is additive and scoped
   to index.html only; other sculpture scenes and pages are untouched.
*/
(function(){
  'use strict';
  if(window.__OMEGA_VISUAL_RUNTIME__)return;
  window.__OMEGA_VISUAL_RUNTIME__=true;

  var d=document.documentElement;
  var p=(location.pathname.split('/').pop()||'index.html').replace(/\.html?$/i,'').toLowerCase()||'home';
  d.dataset.omegaPage=p;
  d.dataset.omegaVisual='active';

  if(!document.getElementById('omega-visual-runtime-css')&&!document.querySelector('link[rel="stylesheet"][href$="omega-visual-universe.css"]')){
    var l=document.createElement('link');
    l.id='omega-visual-runtime-css';
    l.rel='stylesheet';
    l.href='/omega-visual-universe.css';
    document.head.appendChild(l);
  }

  if(!document.querySelector('[data-omega-runtime-mark]')){
    var m=document.createElement('span');
    m.dataset.omegaRuntimeMark='true';
    m.setAttribute('aria-hidden','true');
    m.style.cssText='position:fixed;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden';
    m.textContent='SYD OMEGA visual runtime active: '+p;
    document.body.appendChild(m);
  }

  /* ─────────────────────────────────────────────────────────────────────
     FRONT DOOR — SOVEREIGN GENESIS COMPOSITION
     Scoped strictly to .ohz-hero-art on index.html. The platform's existing
     omega-sculpture renderer is not deleted or changed; it becomes a very
     subtle depth layer while this composition owns the opening presentation.

     Design intent:
       - no continuous logo rotation
       - Omega remains immediately legible
       - monumental rather than gadget-like
       - cinematic depth without visual clutter
       - gold/cyan identity retained
       - 91717 is present as identity, not decoration
       - motion is low-frequency breathing/light drift, not spinning
       - reduced-motion users receive the same composed still scene
  ───────────────────────────────────────────────────────────────────── */
  if(p!=='index') return;

  function installGenesisHero(){
    var mount=document.querySelector('.ohz-hero-art[data-omega-sculpture="signet"]');
    if(!mount||mount.dataset.omegaGenesisInstalled==='1') return;
    mount.dataset.omegaGenesisInstalled='1';
    mount.setAttribute('aria-label','SYD OMEGA 91717 sovereign genesis field');

    var style=document.createElement('style');
    style.id='omega-genesis-opening-css';
    style.textContent='\
.ohz-hero-art[data-omega-sculpture="signet"]{position:relative;min-height:min(62vh,520px);isolation:isolate;overflow:visible}\
.ohz-hero-art[data-omega-sculpture="signet"] canvas{opacity:.075!important;filter:saturate(.55) brightness(.75)!important;transform:none!important}\
.omega-genesis{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;z-index:4;overflow:visible}\
.omega-genesis-core{position:relative;width:min(30vw,310px);height:min(30vw,310px);min-width:210px;min-height:210px;display:grid;place-items:center}\
.omega-genesis-core::before{content:"";position:absolute;inset:7%;border:1px solid rgba(201,168,76,.28);border-radius:50%;box-shadow:0 0 70px rgba(201,168,76,.11),inset 0 0 50px rgba(0,229,255,.035);animation:omegaGenesisBreathe 7s ease-in-out infinite}\
.omega-genesis-core::after{content:"";position:absolute;inset:18%;border:1px solid rgba(0,229,255,.16);border-radius:50%;box-shadow:0 0 34px rgba(0,229,255,.08)}\
.omega-genesis-orbit{position:absolute;inset:-7%;border:1px solid rgba(201,168,76,.11);border-radius:50%;transform:rotate(-14deg) scaleY(.38);box-shadow:0 0 34px rgba(201,168,76,.045);}\
.omega-genesis-orbit::before,.omega-genesis-orbit::after{content:"";position:absolute;width:5px;height:5px;border-radius:50%;background:#E8C97A;box-shadow:0 0 14px rgba(232,201,122,.75)}\
.omega-genesis-orbit::before{left:18%;top:45%}.omega-genesis-orbit::after{right:18%;top:45%;background:#00E5FF;box-shadow:0 0 14px rgba(0,229,255,.65)}\
.omega-genesis-halo{position:absolute;inset:-17%;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,.10) 0%,rgba(0,229,255,.025) 34%,transparent 68%);filter:blur(4px);animation:omegaGenesisHalo 8s ease-in-out infinite}\
.omega-genesis-mark{position:relative;z-index:3;font-family:var(--D,"Cinzel Decorative",Georgia,serif);font-size:clamp(132px,17vw,220px);line-height:.8;font-weight:400;letter-spacing:-.07em;color:#F7E0A0;text-shadow:0 0 12px rgba(247,224,160,.72),0 0 42px rgba(201,168,76,.34),0 0 96px rgba(0,229,255,.10);transform:translateY(-3%)}\
.omega-genesis-mark::after{content:"";position:absolute;left:12%;right:12%;bottom:-21%;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.62),rgba(0,229,255,.35),transparent);box-shadow:0 0 16px rgba(201,168,76,.3)}\
.omega-genesis-label{position:absolute;z-index:5;bottom:2%;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;white-space:nowrap;font-family:var(--M,"Courier Prime",monospace);font-size:10px;letter-spacing:.38em;color:rgba(232,201,122,.72);text-transform:uppercase}\
.omega-genesis-label::before,.omega-genesis-label::after{content:"";width:42px;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.42))}.omega-genesis-label::after{background:linear-gradient(90deg,rgba(201,168,76,.42),transparent)}\
.omega-genesis-code{position:absolute;top:4%;right:2%;font-family:var(--M,"Courier Prime",monospace);font-size:9px;letter-spacing:.28em;color:rgba(0,229,255,.48);writing-mode:vertical-rl}\
.omega-genesis-horizon{position:absolute;left:8%;right:8%;bottom:13%;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.08) 16%,rgba(201,168,76,.46) 50%,rgba(0,229,255,.10) 84%,transparent);box-shadow:0 0 18px rgba(201,168,76,.12)}\
.omega-genesis-horizon::after{content:"";position:absolute;left:25%;right:25%;top:-3px;height:7px;background:radial-gradient(ellipse,rgba(201,168,76,.16),transparent 70%);filter:blur(4px)}\
@keyframes omegaGenesisBreathe{0%,100%{transform:scale(.985);opacity:.72}50%{transform:scale(1.015);opacity:1}}\
@keyframes omegaGenesisHalo{0%,100%{transform:scale(.96);opacity:.62}50%{transform:scale(1.04);opacity:1}}\
@media (max-width:1080px){.omega-genesis-core{width:min(55vw,310px);height:min(55vw,310px)}.omega-genesis-code{right:5%}}\
@media (max-width:700px){.ohz-hero-art[data-omega-sculpture="signet"]{min-height:340px}.omega-genesis-core{min-width:180px;min-height:180px;width:62vw;height:62vw}.omega-genesis-mark{font-size:clamp(118px,32vw,170px)}.omega-genesis-label{font-size:8px;letter-spacing:.28em}.omega-genesis-label::before,.omega-genesis-label::after{width:24px}.omega-genesis-code{display:none}.omega-genesis-orbit{inset:-2%}}\
@media (prefers-reduced-motion:reduce){.omega-genesis-core::before,.omega-genesis-halo{animation:none}.omega-genesis-core::before{opacity:.86}.omega-genesis-halo{opacity:.82}}\
';
    document.head.appendChild(style);

    var scene=document.createElement('div');
    scene.className='omega-genesis';
    scene.innerHTML='<div class="omega-genesis-halo"></div><div class="omega-genesis-core"><div class="omega-genesis-orbit"></div><div class="omega-genesis-mark" aria-hidden="true">Ω</div></div><div class="omega-genesis-horizon"></div><div class="omega-genesis-code" aria-hidden="true">91717 · GENESIS FIELD</div><div class="omega-genesis-label">THE CODE · THE FREQUENCY · THE LEGACY</div>';
    mount.appendChild(scene);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installGenesisHero,{once:true});
  else installGenesisHero();
})();