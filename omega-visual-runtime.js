/* Ω VISUAL RUNTIME — opening composition and visual-universe bridge.
   Additive only. The existing omega-sculpture renderer remains the dimensional
   object; the landing gateway and atlas are presentation layers.
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
  addSheet('omega-world-design-system-css','omega-world-design-system.css');
  addSheet('omega-spatial-system-css','omega-spatial-system.css');
  markRuntime();
  if(page!=='index') return;
  addSheet('omega-opening-system-css','omega-opening-system.css');
  addSheet('omega-home-depth-correction-css','omega-home-depth-correction.css');
  addSheet('omega-entertainment-3d-css','omega-entertainment-3d.css');
  addSheet('omega-world-atmosphere-css','omega-world-atmosphere.css');
  addSheet('omega-world-atlas-css','omega-world-atlas.css');
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
      +'<a class="omega-world-card omega-world-game" href="/gaming.html" aria-label="Enter the gaming universe"><span class="omega-world-depth"></span><span class="omega-world-glyph" aria-hidden="true">◈</span><span class="omega-world-index">WORLD 01</span><span class="omega-world-title">GAMING</span><span class="omega-world-meta">ARENA · CHARACTERS · REWARDS</span><span class="omega-world-arrow" aria-hidden="true">→</span></a>'
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
  function installWorldAtlas(){
    if(document.querySelector('[data-omega-world-atlas]')) return true;
    var anchor=document.querySelector('.ohz-hero-art[data-omega-sculpture]');
    if(!anchor) return false;
    var host=anchor.closest('.ohz-hero') || anchor.parentElement && anchor.parentElement.parentElement;
    var host=anchor.closest('.ohz-hero') || (anchor.parentElement && anchor.parentElement.parentElement);
    if(!host || !host.parentElement) return false;
    var atlas=document.createElement('section');
    atlas.className='omega-atlas';
    atlas.dataset.omegaWorldAtlas='true';
    atlas.setAttribute('aria-labelledby','omega-atlas-title');
    var head=document.createElement('div'); head.className='omega-atlas-head';
    var titleWrap=document.createElement('div');
    var kicker=document.createElement('div'); kicker.className='omega-atlas-kicker'; kicker.textContent='91717 · GENESIS FIELD';
    var title=document.createElement('div'); title.className='omega-atlas-title'; title.id='omega-atlas-title'; title.textContent='ENTER THE OMEGA WORLDS';
    titleWrap.append(kicker,title);
    var copy=document.createElement('div'); copy.className='omega-atlas-copy'; copy.textContent='A visual command layer for the platform domains. Each portal is a real destination; the atlas is navigation, not decoration.';
    head.append(titleWrap,copy); atlas.appendChild(head);
    var grid=document.createElement('div'); grid.className='omega-atlas-grid';
    var worlds=[
      ['M01','CORE','Identity · dashboard · account','/dashboard.html','var(--gold)'],
      ['M03','GAMING','Arena · characters · mastery','/gaming.html','var(--purple)'],
      ['M06','MEDIA UNIVERSE','Cinema · series · media','/cinema.html','var(--purple)'],
      ['M08','COMMUNICATION','Social · feed · notifications','/social.html','var(--cyan)'],
      ['M09','COSMOS','Horoscope · elements · houses','/horoscope.html','var(--purple)'],
      ['M10','INTELLIGENCE NEWS','News · trends · dispatches','/news.html','var(--cyan)'],
      ['M11','HERITAGE','Family · bloodline · history','/heritage.html','var(--green)'],
      ['M12','PROGRESS','Matrix · ascension · gates','/matrix.html','var(--gold)'],
      ['M13','CREDENTIALS','Passport · identity · verification','/credentials.html','var(--cyan)'],
      ['M16','INVESTMENT','Portfolio · revenue · treasury','/investment.html','var(--gold)'],
      ['M17','INTELLIGENCE','AI · analytics · automation','/sovereign-ai.html','var(--purple)'],
      ['M18','HIERARCHY','Approvals · sovereigns · enterprise','/approvals.html','var(--gold)']
    ];
    worlds.forEach(function(item){
      var card=document.createElement('a'); card.className='omega-atlas-card'; card.href=item[3]; card.style.setProperty('--atlas-accent',item[4]);
      var orbit=document.createElement('span'); orbit.className='omega-atlas-orbit'; orbit.setAttribute('aria-hidden','true');
      var idx=document.createElement('span'); idx.className='omega-atlas-index'; idx.textContent=item[0];
      var name=document.createElement('span'); name.className='omega-atlas-name'; name.textContent=item[1];
      var axis=document.createElement('span'); axis.className='omega-atlas-axis'; axis.textContent=item[2];
      var enter=document.createElement('span'); enter.className='omega-atlas-enter'; enter.textContent='ENTER WORLD →';
      card.append(orbit,idx,name,axis,enter); grid.appendChild(card);
    });
    atlas.appendChild(grid);
    var footer=document.createElement('div'); footer.className='omega-atlas-footer';
    var core=document.createElement('span'); core.className='omega-atlas-core'; core.textContent='Ω · 91717';
    var rule=document.createElement('span'); rule.textContent='DATA-BOUND NAVIGATION · 12 PORTALS';
    footer.append(core,rule); atlas.appendChild(footer);
    host.parentElement.appendChild(atlas);
    return true;
  }
  function boot(){
    if(!installOpeningStage()) { var tries=0; var timer=setInterval(function(){if(installOpeningStage() || ++tries>=40) clearInterval(timer);},100); }
    if(!installWorldAtlas()) { var atlasTries=0; var atlasTimer=setInterval(function(){if(installWorldAtlas() || ++atlasTries>=40) clearInterval(atlasTimer);},100); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();