/* Ω VISUAL RUNTIME — visual-universe bridge and the front door's world atlas.
   Additive only. The omega-sculpture renderer owns the hero emblem; this module
   adds the atlas below it and never covers or dims it.
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
  addSheet('omega-entertainment-3d-css','omega-entertainment-3d.css');
  addSheet('omega-world-atmosphere-css','omega-world-atmosphere.css');
  addSheet('omega-world-atlas-css','omega-world-atlas.css');
  /* The hero emblem is the turning 3-D signet that omega-sculpture.js draws
     into .ohz-hero-art. From 2026-09-15 this module laid a static "gateway"
     composition over it and two sheets dimmed its canvas to 4.5% and 20%, so
     the platform's own emblem stopped reading as the front door. The owner
     asked for the rotating emblem back (2026-10-19): nothing here covers or
     dims that mount any more. */
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
    if(!installWorldAtlas()) { var atlasTries=0; var atlasTimer=setInterval(function(){if(installWorldAtlas() || ++atlasTries>=40) clearInterval(atlasTimer);},100); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();