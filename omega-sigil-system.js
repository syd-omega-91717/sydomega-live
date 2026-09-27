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
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function mount(root){
    if(!root||root.dataset.omegaSigilMounted==='true')return;
    root.dataset.omegaSigilMounted='true';
    var grid=document.createElement('div');grid.className='omega-realms';
    var info=document.createElement('section');info.className='omega-info';info.setAttribute('aria-live','polite');
    function close(){info.classList.remove('is-open');info.replaceChildren();}
    realms.forEach(function(r){
      var card=document.createElement('article');card.className='omega-realm';card.setAttribute('tabindex','0');card.setAttribute('role','button');card.setAttribute('aria-label','Open '+r[1]+' details');
      var sigil=document.createElement('div');sigil.className='omega-sigil';sigil.setAttribute('aria-hidden','true');
      var core=document.createElement('span');core.className='omega-sigil-core';
      var glyph=document.createElement('span');glyph.className='omega-glyph';glyph.textContent=r[4];
      var label=document.createElement('div');label.className='omega-realm-label';label.textContent=r[1];
      var caption=document.createElement('div');caption.className='omega-realm-caption';caption.textContent='SIGIL / ENTER';
      sigil.appendChild(core);sigil.appendChild(glyph);card.appendChild(sigil);card.appendChild(label);card.appendChild(caption);
      function activate(){
        info.replaceChildren();
        var closeButton=document.createElement('button');closeButton.type='button';closeButton.className='omega-info-close';closeButton.setAttribute('aria-label','Close details');closeButton.textContent='×';
        var heading=document.createElement('h2');heading.textContent=r[1];
        var description=document.createElement('p');description.textContent=r[2];
        var link=document.createElement('a');link.href=r[3];link.textContent='ENTER '+r[1]+' →';
        info.appendChild(closeButton);info.appendChild(heading);info.appendChild(description);info.appendChild(link);
        info.classList.add('is-open');closeButton.addEventListener('click',close);info.scrollIntoView({behavior:window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
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
