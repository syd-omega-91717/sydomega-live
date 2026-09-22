/* Ω SYD OMEGA 91717 — UNIVERSAL PAGE DOOR + PROGRESSIVE DISCLOSURE
 * One reusable visual contract for every content surface.
 * The page's existing header/footer/business logic remains authoritative.
 */
(function(){
  'use strict';
  if(window.OmegaContentSigils)return;

  var SYSTEM_PAGES={'index.html':1,'enter.html':1,'reset.html':1,'404.html':1,'offline.html':1,'terms.html':1,'pending.html':1,'account.html':1};
  var EXCLUDE='script,style,noscript,template,form,table,pre,code,input,textarea,select,button,nav,footer,.lf,.topbar,.side,.on-sections';
  var DOMAIN_WORDS={
    command:'COMMAND',identity:'IDENTITY',ascend:'ASCEND',cosmos:'COSMOS',
    universe:'UNIVERSE',vault:'VAULT',order:'ORDER',services:'SERVICES',
    intel:'INTEL',arena:'ARENA',govern:'GOVERN',invest:'INVEST',achieve:'ACHIEVE',
    archive:'ARCHIVE',media:'MEDIA',archive:'ARCHIVE'
  };

  function file(){return (location.pathname.split('/').pop()||'index.html').toLowerCase();}
  function slug(){return file().replace(/\.html$/,'');}
  function label(){return slug().replace(/[-_]+/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});}
  function axis(){
    try{return window.OmegaAxis&&window.OmegaAxis.labelOf?window.OmegaAxis.labelOf(slug()):'REALM';}
    catch(e){return 'REALM';}
  }
  function emblem(){
    try{return window.OmegaEmblems&&window.OmegaEmblems.get?window.OmegaEmblems.get(file()):null;}
    catch(e){return null;}
  }
  function style(){
    if(document.getElementById('omega-content-sigil-style'))return;
    var s=document.createElement('style');s.id='omega-content-sigil-style';
    s.textContent=[
      '.omega-page-door{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;margin:0 0 22px;padding:10px 14px;border:1px solid rgba(201,168,76,.22);background:linear-gradient(110deg,rgba(0,229,255,.055),rgba(201,168,76,.025),rgba(0,0,0,.18));}',
      '.omega-page-door__sigil{display:grid;place-items:center;width:66px;height:66px;border:1px solid rgba(201,168,76,.65);border-radius:50%;background:radial-gradient(circle,rgba(0,229,255,.12),transparent 68%);color:var(--gold,#c9a84c);text-decoration:none;transition:transform .3s,border-color .2s,box-shadow .2s;}',
      '.omega-page-door__sigil:hover,.omega-page-door__sigil:focus-visible{transform:rotate(18deg) scale(1.05);border-color:var(--cyan,#00e5ff);box-shadow:0 0 22px rgba(0,229,255,.18);outline:2px solid var(--cyan,#00e5ff);outline-offset:3px;}',
      '.omega-page-door__sigil svg{width:48px;height:48px;}',
      '.omega-page-door__meta{min-width:0}.omega-page-door__axis{font:10px/1.4 var(--M,"Courier Prime",monospace);letter-spacing:2px;color:var(--cyan,#00e5ff)}',
      '.omega-page-door__title{margin:2px 0;font:700 clamp(15px,2vw,22px)/1.2 "Cinzel Decorative",serif;letter-spacing:1px;color:var(--gold-soft,#e8c97a)}',
      '.omega-page-door__hint{font:10px/1.4 var(--M,"Courier Prime",monospace);letter-spacing:1px;color:var(--muted,rgba(138,134,118,.72))}',
      '.omega-page-door__action{font:10px var(--M,"Courier Prime",monospace);letter-spacing:1.5px;color:var(--cyan,#00e5ff);white-space:nowrap}',
      '.omega-copy-wrap{position:relative}.omega-copy-compact{max-height:4.8em;overflow:hidden;transition:max-height .25s ease}.omega-copy-compact::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1.8em;background:linear-gradient(transparent,var(--bg,#020206));pointer-events:none}.omega-copy-compact.is-expanded{max-height:1200px}.omega-copy-compact.is-expanded::after{display:none}',
      '.omega-copy-toggle{display:inline-flex;align-items:center;gap:6px;margin:5px 0 14px;padding:5px 9px;border:1px solid rgba(0,229,255,.3);background:transparent;color:var(--cyan,#00e5ff);font:10px var(--M,"Courier Prime",monospace);letter-spacing:1.5px;cursor:pointer}.omega-copy-toggle:hover{border-color:var(--gold,#c9a84c);color:var(--gold,#c9a84c)}.omega-copy-toggle:focus-visible{outline:2px solid var(--cyan,#00e5ff);outline-offset:2px}',
      '@media(max-width:620px){.omega-page-door{grid-template-columns:auto 1fr}.omega-page-door__action{display:none}.omega-page-door__sigil{width:54px;height:54px}.omega-page-door__sigil svg{width:40px;height:40px}}',
      '@media(prefers-reduced-motion:reduce){.omega-page-door__sigil,.omega-copy-compact{transition:none}}'
    ].join('');
    (document.head||document.documentElement).appendChild(s);
  }
  function mountDoor(){
    if(document.querySelector('.omega-page-door')||SYSTEM_PAGES[file()])return;
    var main=document.querySelector('main.main,main#main,main.page-shell,main,[role="main"]');if(!main)return;
    var e=emblem(), door=document.createElement('section');door.className='omega-page-door';door.setAttribute('aria-label','Page sigil entry');
    var a=document.createElement('a');a.className='omega-page-door__sigil';a.href=location.pathname||'/';a.setAttribute('aria-label','Open '+label()+' page sigil');a.innerHTML=e&&e.svg?e.svg:'<span style="font:34px Cinzel Decorative,serif">Ω</span>';
    var meta=document.createElement('div');meta.className='omega-page-door__meta';
    meta.innerHTML='<div class="omega-page-door__axis">'+escapeHtml(axis())+' / SIGIL ENTRY</div><div class="omega-page-door__title">'+escapeHtml(label().toUpperCase())+'</div><div class="omega-page-door__hint">The sigil is the door · detailed context opens only when requested</div>';
    var action=document.createElement('div');action.className='omega-page-door__action';action.textContent='ENTER →';
    door.append(a,meta,action);
    var anchor=main.querySelector('.hero,.page-header,header')||main.firstElementChild;
    if(anchor&&anchor!==door)main.insertBefore(door,anchor);else main.prepend(door);
  }
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function compact(){
    var nodes=document.querySelectorAll('[data-explanatory-text],.page-description,.hero-subtitle,.hero-description,.section-description,.section-intro,.intro-text,.lead');
    Array.prototype.forEach.call(nodes,function(el){
      if(el.dataset.omegaCompacted==='true'||el.closest(EXCLUDE)||el.closest('.omega-page-door'))return;
      var text=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(text.length<220)return;
      el.dataset.omegaCompacted='true';
      var wrap=document.createElement('span');wrap.className='omega-copy-wrap';
      el.parentNode.insertBefore(wrap,el);wrap.appendChild(el);el.classList.add('omega-copy-compact');
      var b=document.createElement('button');b.type='button';b.className='omega-copy-toggle';b.textContent='MORE INFO +';b.setAttribute('aria-expanded','false');
      b.addEventListener('click',function(){var open=el.classList.toggle('is-expanded');b.textContent=open?'LESS INFO −':'MORE INFO +';b.setAttribute('aria-expanded',String(open));});
      wrap.appendChild(b);
    });
  }
  function boot(){style();mountDoor();compact();}
  window.OmegaContentSigils={boot:boot,compactExplanations:compact,mountDoor:mountDoor};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setTimeout(boot,800);
})();