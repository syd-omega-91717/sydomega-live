/* Ω SYD OMEGA 91717 — universal content-page sigil layer
 * Loaded by the existing global emblem integration layer.
 * Enhances content pages without replacing page-owned business logic.
 */
(function(){
  'use strict';
  if(window.OmegaContentSigils)return;

  var SYSTEM_PAGES={
    'index.html':1,'enter.html':1,'reset.html':1,'404.html':1,'offline.html':1,
    'terms.html':1,'pending.html':1,'account.html':1,'gateway.html':1,'realms.html':1
  };
  var INFO_SELECTORS=[
    '.page-description','.hero-subtitle','.hero-description','.lead',
    '.intro','.intro-text','.section-description','.section-intro',
    '[data-page-description]','[data-explanatory-text]'
  ];

  function pageFile(){
    var path=(window.location.pathname||'/').split('/').pop();
    return path||'index.html';
  }
  function titleFromFile(file){
    return file.replace(/\.html$/i,'').replace(/[-_]+/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});
  }
  function safeText(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function addStyle(){
    if(document.getElementById('omega-content-sigil-style'))return;
    var style=document.createElement('style');style.id='omega-content-sigil-style';
    style.textContent='\
.omega-page-door{display:flex;align-items:center;gap:16px;margin:0 0 24px;padding:14px 16px;border:1px solid rgba(201,168,76,.22);background:linear-gradient(120deg,rgba(0,229,255,.06),rgba(0,0,0,.18));}\
.omega-page-door__sigil{display:grid;place-items:center;flex:0 0 auto;width:78px;height:78px;border:1px solid rgba(201,168,76,.65);border-radius:50%;background:radial-gradient(circle,rgba(0,229,255,.16),transparent 65%);color:var(--gold,#c9a84c);transition:transform .35s,border-color .2s;}\
.omega-page-door__sigil svg{width:62px;height:62px;}\
.omega-page-door__sigil:hover,.omega-page-door__sigil:focus-visible{transform:rotate(30deg) scale(1.04);border-color:var(--cyan,#00e5ff);outline:2px solid var(--cyan,#00e5ff);outline-offset:4px;}\
.omega-page-door__meta{min-width:0;flex:1;}\
.omega-page-door__kicker{font:10px/1.4 var(--M,"Share Tech Mono",monospace);letter-spacing:2px;color:var(--cyan,#00e5ff);}\
.omega-page-door__title{margin:4px 0;font-family:"Cinzel Decorative",serif;font-size:clamp(16px,2vw,25px);letter-spacing:1px;color:var(--gold-soft,#e8c97a);}\
.omega-page-door__hint{font:11px/1.5 var(--M,"Share Tech Mono",monospace);color:var(--dim,rgba(138,134,118,.75));}\
.omega-copy-compact{position:relative;max-height:4.8em;overflow:hidden;transition:max-height .25s ease;}\
.omega-copy-compact.is-expanded{max-height:1000px;}\
.omega-copy-compact:not(.is-expanded)::after{content:"";position:absolute;right:0;bottom:0;left:0;height:2.2em;background:linear-gradient(transparent,var(--bg,#020206));pointer-events:none;}\
.omega-copy-toggle{margin:7px 0 16px;padding:5px 10px;border:1px solid rgba(0,229,255,.3);background:transparent;color:var(--cyan,#00e5ff);font:10px var(--M,"Share Tech Mono",monospace);letter-spacing:1.5px;cursor:pointer;}\
@media(max-width:600px){.omega-page-door{gap:10px;padding:10px;}.omega-page-door__sigil{width:58px;height:58px;}.omega-page-door__sigil svg{width:45px;height:45px;}}\
@media(prefers-reduced-motion:reduce){.omega-page-door__sigil,.omega-copy-compact{transition:none;}}';
    (document.head||document.documentElement).appendChild(style);
  }
  function renderDoor(file,emblem){
    if(document.querySelector('.omega-page-door'))return;
    var main=document.querySelector('main.main,main#main,main,[role="main"]');
    if(!main)return;
    var door=document.createElement('section');door.className='omega-page-door';door.setAttribute('aria-label','Current realm entry');
    var link=document.createElement('a');link.className='omega-page-door__sigil';link.href='/'+file;link.setAttribute('aria-label','Open '+titleFromFile(file)+' sigil');
    if(emblem&&emblem.svg)link.innerHTML=emblem.svg;
    else link.textContent='Ω';
    var meta=document.createElement('div');meta.className='omega-page-door__meta';
    var kicker=document.createElement('div');kicker.className='omega-page-door__kicker';kicker.textContent='SIGIL / REALM ENTRY';
    var title=document.createElement('div');title.className='omega-page-door__title';title.textContent=titleFromFile(file).toUpperCase();
    var hint=document.createElement('div');hint.className='omega-page-door__hint';hint.textContent='Select the sigil to revisit this realm · details stay compact';
    meta.append(kicker,title,hint);door.append(link,meta);
    var anchor=main.querySelector('header,.hero,.page-header,.content-header')||main.firstElementChild;
    if(anchor)main.insertBefore(door,anchor);else main.prepend(door);
  }
  function compactExplanations(){
    var seen=[];
    INFO_SELECTORS.forEach(function(selector){
      document.querySelectorAll(selector).forEach(function(el){
        if(seen.indexOf(el)!==-1||el.closest('.omega-page-door')||el.dataset.omegaCompacted==='true')return;
        var text=safeText(el);if(text.length<180)return;
        seen.push(el);el.dataset.omegaCompacted='true';el.classList.add('omega-copy-compact');
        var button=document.createElement('button');button.type='button';button.className='omega-copy-toggle';button.textContent='MORE INFO +';button.setAttribute('aria-expanded','false');
        button.addEventListener('click',function(){var expanded=el.classList.toggle('is-expanded');button.textContent=expanded?'LESS INFO −':'MORE INFO +';button.setAttribute('aria-expanded',String(expanded));});
        el.insertAdjacentElement('afterend',button);
      });
    });
  }
  function boot(){
    addStyle();
    var file=pageFile();if(SYSTEM_PAGES[file])return;
    var emblem=window.OmegaEmblems&&typeof window.OmegaEmblems.get==='function'?window.OmegaEmblems.get(file):null;
    renderDoor(file,emblem);compactExplanations();
  }
  window.OmegaContentSigils={boot:boot,compactExplanations:compactExplanations};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
