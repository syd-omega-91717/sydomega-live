/* Ω SYD OMEGA 91717 — PAGE WORLD ACTION MEMBRANE
 * Gives every page a role, purpose and next action from the canonical page
 * character manifest. It composes existing navigation and services; it does
 * not invent backend state, XP, rewards, payment, or authority.
 */
(function(){
  'use strict';
  if(window.__omegaPageWorld)return;
  window.__omegaPageWorld=true;

  var manifest=null, world=null, archetype=null, district=null, slug=((location.pathname.split('/').pop()||'dashboard').replace(/\.html$/,'')||'dashboard');
  var labels={
    command:{title:'COMMAND',next:'/missions.html',nextLabel:'MISSIONS',secondary:'/decisions.html',secondaryLabel:'DECISIONS'},
    identity:{title:'IDENTITY',next:'/profile.html',nextLabel:'IDENTITY',secondary:'/character.html',secondaryLabel:'CHARACTER'},
    intelligence:{title:'INTELLIGENCE',next:'/intelligence.html',nextLabel:'INVESTIGATE',secondary:'/agents.html',secondaryLabel:'CONSULT AGENT'},
    knowledge:{title:'KNOWLEDGE',next:'/academy.html',nextLabel:'LEARN',secondary:'/exam.html',secondaryLabel:'TEST'},
    gaming:{title:'ARENA',next:'/gaming.html',nextLabel:'PLAY',secondary:'/trophies.html',secondaryLabel:'TROPHIES'},
    media:{title:'MEDIA',next:'/media.html',nextLabel:'CREATE / WATCH',secondary:'/visual-atlas.html',secondaryLabel:'COLLECT'},
    commerce:{title:'EXCHANGE',next:'/marketplace.html',nextLabel:'MARKET',secondary:'/subscriptions.html',secondaryLabel:'MEMBERSHIP'},
    creation:{title:'FORGE',next:'/forge.html',nextLabel:'BUILD',secondary:'/publishing.html',secondaryLabel:'PUBLISH'},
    community:{title:'COMMUNITY',next:'/social.html',nextLabel:'CONNECT',secondary:'/family.html',secondaryLabel:'HERITAGE'},
    governance:{title:'GOVERNANCE',next:'/governance.html',nextLabel:'GOVERN',secondary:'/evidence.html',secondaryLabel:'EVIDENCE'},
    finance:{title:'TREASURY',next:'/vault.html',nextLabel:'VAULT',secondary:'/portfolio.html',secondaryLabel:'PORTFOLIO'},
    system:{title:'GUARDIAN',next:'/control-plane.html',nextLabel:'CONTROL',secondary:'/recovery.html',secondaryLabel:'RECOVERY'}
  };

  function findArchetype(){
    if(!manifest||!manifest.rules)return 'command';
    var hit=manifest.rules.find(function(r){
      return String(r.match||'').split('|').some(function(token){
        return slug===token || slug.indexOf(token)>-1;
      });
    });
    return hit?hit.archetype:'command';
  }

  function inject(){
    if(document.getElementById('omega-page-world'))return;
    if(!manifest||!manifest.archetypes)return;
    archetype=findArchetype();
    if(world&&world.districts){ district=world.districts.find(function(d){return (d.pages||[]).some(function(p){return String(p).replace(/\.html$/,'')===slug;});})||null; }
    var a=manifest.archetypes[archetype]||manifest.archetypes.command;
    var l=labels[archetype]||labels.command;
    var host=document.createElement('section');
    host.id='omega-page-world';
    host.setAttribute('aria-label','Omega world role and next actions');
    host.innerHTML='<style>'+
      '#omega-page-world{margin:0 auto 14px;max-width:1600px;padding:0 14px}'+
      '.opw-inner{border:1px solid rgba(201,168,76,.18);background:linear-gradient(90deg,rgba(10,10,15,.92),rgba(2,2,6,.78));padding:11px 13px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}'+
      '.opw-mark{font-family:var(--D);font-size:18px;color:var(--gold);min-width:26px;text-align:center}'+
      '.opw-copy{min-width:190px;flex:1}'+
      '.opw-kicker{font-family:var(--M);font-size:12px;letter-spacing:2.2px;color:var(--cyan)}'+
      '.opw-role{font-family:var(--D);font-size:14px;color:var(--ink);margin-top:2px}'+
      '.opw-verb{font-family:var(--M);font-size:12px;letter-spacing:1.4px;color:var(--muted);margin-top:2px}'+
      '.opw-actions{display:flex;gap:6px;flex-wrap:wrap}'+
      '.opw-actions a{font-family:var(--M);font-size:12px;letter-spacing:1.2px;color:var(--gold);text-decoration:none;border:1px solid rgba(201,168,76,.25);padding:6px 9px}'+
      '.opw-actions a:hover,.opw-actions a:focus-visible{border-color:var(--gold);background:rgba(201,168,76,.06)}'+
      '.opw-actions a.opw-mission{color:var(--cyan);border-color:rgba(0,229,255,.22)}'+
      '@media(max-width:620px){#omega-page-world{padding:0 8px}.opw-copy{min-width:140px}.opw-actions{width:100%}.opw-actions a{flex:1;text-align:center}}'+
      '</style>'+
      '<div class="opw-inner">'+
      '<div class="opw-mark" aria-hidden="true">&#937;</div>'+
      '<div class="opw-copy"><div class="opw-kicker">WORLD ROLE · '+escapeHtml(l.title)+'</div>'+
      '<div class="opw-role">'+escapeHtml(a.worldRole||'Citizen')+'</div>'+
      '<div class="opw-verb">YOUR VERB · '+escapeHtml(a.worldVerb||'ACT')+' · OUTCOME · '+escapeHtml(a.successOutcome||'progress recorded')+'</div></div>'+
      '<div class="opw-actions"><a class="opw-mission" href="/missions.html">MISSION</a>'+
      '<a href="'+escapeAttr(l.next)+'">'+escapeHtml(l.nextLabel)+'</a>'+
      '<a href="'+escapeAttr(l.secondary)+'">'+escapeHtml(l.secondaryLabel)+'</a></div></div>';
    var main=document.querySelector('main')||document.body;
    main.insertBefore(host,main.firstElementChild||null);
    document.dispatchEvent(new CustomEvent('omega:page-world-ready',{detail:{page:slug,archetype:archetype,role:a.worldRole,district:district&&district.id||null}}));
  }

  function escapeHtml(v){return String(v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
  function escapeAttr(v){return String(v).replace(/[^a-zA-Z0-9_\-./#?=&]/g,'');}

  async function boot(){
    if(document.body&&document.body.dataset&&document.body.dataset.noWorldMembrane==='true')return;
    try{
      var r=await fetch('/config/page-character-manifest.json',{cache:'no-store'});
      if(!r.ok)throw new Error('page manifest '+r.status);
      manifest=await r.json();
      try{
        var wr=await fetch('/config/omega-world-manifest.json',{cache:'no-store'});
        if(wr.ok)world=await wr.json();
      }catch(_){}
      inject();
    }catch(e){console.warn('[Omega] page world membrane unavailable',e);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.OmegaPageWorld={boot:boot,getArchetype:function(){return archetype;},getDistrict:function(){return district;},getManifest:function(){return manifest;}};
})();