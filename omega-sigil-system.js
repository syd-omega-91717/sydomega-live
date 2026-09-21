/* SYD OMEGA 91717 — reusable sigil realm launcher
 * No framework, no dependencies, safe to mount into existing shell pages.
 * The sigil is the entry point; detail stays hidden until requested.
 */
(function(){
  'use strict';
  if(window.OmegaSigilSystem)return;
  var realms=[
    ['core','CORE','Command center','/dashboard.html','⌘'],['consultancy','CONSULTANCY','Services and expert work','/consultancy.html','ϟ'],['gaming','GAMING','Games, competition and progression','/gaming.html','◈'],['achievements','ACHIEVEMENTS','Trophies, medals and records','/honors.html','★'],['family','FAMILY','Private family and heritage space','/family.html','♧'],['media','MEDIA','Cinema, publishing and creator assets','/media.html','▶'],
    ['blockchain','BLOCKCHAIN','Ledger, ownership and verifiable assets','/blockchain.html','⬡'],['communication','COMMUNICATION','Messages, communities and network','/social.html','◌'],['horoscope','HOROSCOPE','Birth-sync and symbolic exploration','/horoscope.html','✶'],['news','NEWS','Curated intelligence and news wire','/news.html','▤'],['heritage','HERITAGE','History, lineage and cultural archive','/heritage.html','♆'],['progress','PROGRESS','Levels, phases and personal evolution','/evolution.html','↗'],
    ['passport','PASSPORT','Identity, verification and credentials','/profile.html#passport','▣'],['legal','LEGAL','Policies, compliance and agreements','/compliance.html','⚖'],['elements','ELEMENTS','Elemental systems and world mapping','/elements.html','✧'],['investment','INVESTMENT','Treasury, portfolio and allocations','/investment.html','₿'],['intelligence','INTELLIGENCE','Research, graphs and decision support','/intelligence.html','⌬'],['hierarchy','HIERARCHY','Roles, governance and authority','/governance.html','▱']
  ];
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function mount(root){
    if(!root||root.dataset.omegaSigilMounted==='true')return;
    root.dataset.omegaSigilMounted='true';
    var grid=document.createElement('div');grid.className='omega-realms';
    var info=document.createElement('section');info.className='omega-info';info.setAttribute('aria-live','polite');
    function close(){info.classList.remove('is-open');info.innerHTML='';}
    realms.forEach(function(r){
      var card=document.createElement('article');card.className='omega-realm';card.setAttribute('tabindex','0');card.setAttribute('role','button');card.setAttribute('aria-label','Open '+r[1]+' details');
      card.innerHTML='<div class="omega-sigil" aria-hidden="true"><span class="omega-sigil-core"></span><span class="omega-glyph">'+esc(r[4])+'</span></div><div class="omega-realm-label">'+esc(r[1])+'</div><div class="omega-realm-caption">SIGIL / ENTER</div>';
      function activate(){
        info.innerHTML='<button type="button" class="omega-info-close" aria-label="Close details">×</button><h2>'+esc(r[1])+'</h2><p>'+esc(r[2])+'</p><a href="'+esc(r[3])+'">ENTER '+esc(r[1])+' →</a>';
        info.classList.add('is-open');info.querySelector('button').addEventListener('click',close);info.scrollIntoView({behavior:window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
      }
      card.addEventListener('click',activate);card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
      grid.appendChild(card);
    });
    root.appendChild(grid);root.appendChild(info);
  }
  window.OmegaSigilSystem={mount:mount,realms:realms};
  function boot(){document.querySelectorAll('[data-omega-sigils]').forEach(mount);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
