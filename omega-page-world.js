/* Ω SYD OMEGA 91717 — PAGE WORLD ACTION MEMBRANE
 * Gives every page a role, purpose and next action from the canonical page
 * character manifest. It composes existing navigation and services; it does
 * not invent backend state, XP, rewards, payment, or authority.
 */
(function(){
  'use strict';
  if(window.__omegaPageWorld)return;
  window.__omegaPageWorld=true;

  var manifest=null, world=null, pageWorld=null, overrides=null, archetype=null, district=null, pagePath=((location.pathname||'/').replace(/^\/+/,'')), slug=((location.pathname.split('/').pop()||'dashboard').replace(/\.html$/,'')||'dashboard');
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
    if(manifest&&manifest.rules){
      var exactHit=manifest.rules.find(function(r){
        return String(r.match||'').split('|').some(function(token){
          token=String(token).trim();
          return token.charAt(0)==='=' && slug===token.slice(1);
        });
      });
      if(exactHit&&manifest.archetypes[exactHit.archetype])return exactHit.archetype;
    }
    if(pageWorld&&pageWorld.archetype&&pageWorld.archetype!=='command'&&manifest&&manifest.archetypes[pageWorld.archetype])return pageWorld.archetype;
    if(manifest&&manifest.rules){
      var hit=manifest.rules.find(function(r){
        return String(r.match||'').split('|').some(function(token){
          token=String(token).trim();
          return token.charAt(0)!=='=' && (slug===token || slug.indexOf(token)>-1);
        });
      });
      if(hit&&manifest.archetypes[hit.archetype])return hit.archetype;
    }
    if(district&&district.archetype&&manifest&&manifest.archetypes[district.archetype])return district.archetype;
    if(pageWorld&&pageWorld.archetype&&manifest&&manifest.archetypes[pageWorld.archetype])return pageWorld.archetype;
    return 'command';
    /* Exact page ownership wins. The 242-entry map is generated from the
       canonical page contracts, the navigation section registry and the
       explicit archetype rules. This prevents substring collisions such as
       "ai" matching "blockchain" or "maintenance". */
    if(manifest&&manifest.pageArchetypes&&manifest.pageArchetypes[slug])return manifest.pageArchetypes[slug];
    if(district&&district.archetype)return district.archetype;
    if(!manifest||!manifest.rules)return (manifest&&manifest.pageArchetypeFallback)||'system';
    var hit=manifest.rules.find(function(r){
      return String(r.match||'').split('|').some(function(token){
        token=String(token||'').toLowerCase();
        return slug===token || slug.indexOf(token+'-')===0 ||
          slug.slice(-(token.length+1))==='-'+token || slug.indexOf('-'+token+'-')>-1;
      });
    });
    return hit?hit.archetype:(manifest.pageArchetypeFallback||'system');
  }

  var suppressMembrane=false;
  function inject(){
    if(!manifest||!manifest.archetypes)return;
    if(world&&world.districts){ district=world.districts.find(function(d){return (d.pages||[]).some(function(p){return String(p).replace(/\.html$/,'')===slug;});})||null; }
    if(!district&&overrides&&overrides.entries&&world&&world.districts){ var oid=overrides.entries[slug]; district=world.districts.find(function(d){return d.id===oid;})||null; }
    if(pageWorld&&pageWorld.pages){ pageWorld=pageWorld.pages.find(function(p){return p.page===pagePath;})||pageWorld.pages.find(function(p){return p.slug===slug;})||null; }
    archetype=findArchetype();
    var a=manifest.archetypes[archetype]||manifest.archetypes.command;

    /* Publish the manifest's visual contract as stable root attributes.
       CSS can now compose a coherent world skin without guessing from URLs,
       duplicating archetype registries, or changing page-owned layout. */
    var visualRoot=document.documentElement;
    function visualToken(value,fallback){
      var token=String(value||fallback||'').toLowerCase();
      return /^[a-z0-9_-]{1,40}$/.test(token)?token:String(fallback||'command');
    }
    visualRoot.setAttribute('data-omega-archetype',visualToken(archetype,'command'));
    visualRoot.setAttribute('data-omega-visual',visualToken(a.visual,archetype));
    visualRoot.setAttribute('data-omega-motion-profile',visualToken(a.motion,'ambient'));
    visualRoot.setAttribute('data-omega-depth',visualToken(a.depth,'layered'));
    visualRoot.setAttribute('data-omega-density',visualToken(a.density,'balanced'));
    visualRoot.setAttribute('data-omega-interaction',visualToken(a.interaction,'direct'));
    visualRoot.setAttribute('data-omega-emblem',visualToken(a.emblem,'omega'));
    visualRoot.style.setProperty('--omega-v6-accent',a.accent||'#C9A84C');
    visualRoot.style.setProperty('--omega-v6-secondary',a.secondary||'#00E5FF');
    visualRoot.style.setProperty('--omega-v6-glow',a.glow||'rgba(201,168,76,.13)');
    visualRoot.style.setProperty('--omega-v6-line',a.line||'rgba(201,168,76,.34)');
    if(district&&district.id) visualRoot.setAttribute('data-omega-district',visualToken(district.id,'genesis'));
    else visualRoot.removeAttribute('data-omega-district');

    /* Some utility/legal surfaces deliberately suppress the role ribbon.
       They still receive the same page archetype so the visual system covers
       every canonical route without changing that page's information design. */
    if(suppressMembrane){
      document.dispatchEvent(new CustomEvent('omega:page-world-ready',{detail:{page:pagePath,slug:slug,archetype:archetype,visual:a.visual||archetype,motion:a.motion||'ambient',depth:a.depth||'layered',density:a.density||'balanced',role:a.worldRole,district:district&&district.id||null}}));
      return;
    }
    if(document.getElementById('omega-page-world'))return;

    var l=labels[archetype]||labels.command;

    /* The manifest is the canonical visual personality source. Publish its
       profile on the document root so the shared art-direction layer can
       render the correct world without duplicating page-to-archetype maps. */
    var root=document.documentElement;
    root.dataset.omegaArchetype=archetype;
    root.dataset.omegaVisualProfile=a.visual||'sovereign';
    root.dataset.omegaMotionProfile=a.motion||'subtle';
    root.dataset.omegaDepthProfile=a.depth||'glass';
    root.dataset.omegaDensityProfile=a.density||'clear';
    root.dataset.omegaInteractionProfile=a.interaction||'direct';
    root.dataset.omegaEmblemProfile=a.emblem||'omega';
    root.style.setProperty('--omega-v6-accent',a.accent||'#C9A84C');
    root.style.setProperty('--omega-v6-secondary',a.secondary||'#00E5FF');
    root.style.setProperty('--omega-v6-glow',a.glow||'rgba(201,168,76,.13)');
    root.style.setProperty('--omega-v6-line',a.line||'rgba(201,168,76,.34)');
    root.classList.add('omega-experience-'+archetype);
    if(document.body){
      document.body.dataset.omegaArchetype=archetype;
      document.body.dataset.omegaVisualProfile=a.visual||'sovereign';
    }
    if(district){
      var pages=district.pages||[];
      l={
        title:String(district.name||l.title).replace(/^THE\s+/,''),
        next:'/'+String(pages[0]||'dashboard').replace(/\.html$/,'')+'.html',
        nextLabel:String((district.actions&&district.actions[0])||l.nextLabel).toUpperCase(),
        secondary:'/'+String(pages[1]||pages[0]||'dashboard').replace(/\.html$/,'')+'.html',
        secondaryLabel:String((district.actions&&district.actions[1])||l.secondaryLabel).toUpperCase()
      };
    }
    var host=document.createElement('section');
    host.id='omega-page-world';
    host.dataset.omegaArchetype=archetype;
    host.setAttribute('aria-label','Omega world role and next actions');
    host.innerHTML='<style>'+
      '#omega-page-world{margin:0 auto 18px;max-width:1600px;padding:0 16px}'+
      '.opw-inner{position:relative;border:1px solid var(--omega-v6-line,rgba(201,168,76,.24));border-inline-start:3px solid var(--omega-v6-accent,var(--gold));background:linear-gradient(105deg,rgba(10,10,15,.96),rgba(2,2,6,.84));padding:10px 14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-radius:12px}'+
      '.opw-mark{font-family:var(--D);font-size:24px;color:var(--omega-v6-accent,var(--gold));text-shadow:0 0 20px var(--omega-v6-glow,rgba(201,168,76,.12));min-width:28px;text-align:center}'+
      '.opw-copy{min-width:190px;flex:1}'+
      '.opw-kicker{font-family:var(--M);font-size:12px;letter-spacing:.1em;color:var(--omega-v6-accent,var(--cyan))}'+
      '.opw-role{font-family:var(--D);font-size:15px;font-weight:600;color:var(--ink);margin-top:2px}'+
      '.opw-verb{font-family:var(--M);font-size:13px;letter-spacing:.04em;color:var(--muted);margin-top:2px}'+
      '.opw-actions{display:flex;gap:8px;flex-wrap:wrap}'+
      '.opw-actions a{font-family:var(--M);font-size:13px;letter-spacing:.06em;color:var(--omega-v6-accent,var(--gold));text-decoration:none;border:1px solid var(--omega-v6-line,rgba(201,168,76,.25));background:rgba(10,10,15,.35);padding:8px 12px;min-height:40px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px}'+
      '.opw-actions a:hover,.opw-actions a:focus-visible{border-color:var(--omega-v6-accent,var(--gold));background:var(--omega-v6-glow,rgba(201,168,76,.08))}'+
      '.opw-actions a.opw-mission{color:var(--omega-v6-secondary,var(--cyan));border-color:var(--omega-v6-line,rgba(0,229,255,.22))}'+
      '#omega-page-world.opw-compact .opw-kicker,#omega-page-world.opw-compact .opw-verb{display:none}'+
      '#omega-page-world.opw-compact .opw-role{font-family:var(--M);font-size:13px;letter-spacing:.08em;color:var(--ink);text-transform:uppercase}'+
      '@media(max-width:620px){#omega-page-world{padding:0 8px}.opw-copy{min-width:140px}.opw-actions{width:100%}.opw-actions a{flex:1;text-align:center;min-height:44px}}'+
      '</style>'+
      '<div class="opw-inner">'+
      '<div class="opw-mark" aria-hidden="true">&#937;</div>'+
      '<div class="opw-copy"><div class="opw-kicker">WORLD ROLE · '+escapeHtml(l.title)+'</div>'+
      '<div class="opw-role">'+escapeHtml(a.worldRole||'Citizen')+'</div>'+
      '<div class="opw-verb">YOUR VERB · '+escapeHtml((pageWorld&&pageWorld.verb)||a.worldVerb||'ACT')+' · ACTION · '+escapeHtml((pageWorld&&pageWorld.primaryAction)||((a.primaryActions||[])[0])||'ACT')+' · OUTCOME · '+escapeHtml((pageWorld&&pageWorld.successOutcome)||a.successOutcome||'progress recorded')+'</div></div>'+
      '<div class="opw-actions"><a class="opw-mission" href="/missions.html">MISSION</a>'+
      '<a href="'+escapeAttr(l.next)+'" data-world-action="'+escapeAttr(a.worldVerb||"ACT")+'" data-world-district="'+escapeAttr(district&&district.id||"")+'">'+escapeHtml(l.nextLabel)+'</a>'+
      '<a href="'+escapeAttr(l.secondary)+'" data-world-action="'+escapeAttr(a.worldVerb||"ACT")+'" data-world-district="'+escapeAttr(district&&district.id||"")+'">'+escapeHtml(l.secondaryLabel)+'</a></div></div>';
    /* The world membrane belongs INSIDE the page content column. Vault-sector pages
       use `aside#omega-side + .page-shell` rather than a semantic <main>. The shared
       stylesheet intentionally makes those body children a horizontal flex row; if
       this membrane falls back to <body>, it becomes a third flex column and squeezes
       the real page into the right-hand strip seen in the Vault screenshots. */
    var main=document.querySelector('main, .main, .page-shell, #app, [role="main"]')||document.body;
    main.insertBefore(host,main.firstElementChild||null);
    function reconcileDensity(){
      if(document.querySelector('.oid-hero')) host.classList.add('opw-compact');
    }
    reconcileDensity();
    setTimeout(reconcileDensity,900);
    document.dispatchEvent(new CustomEvent('omega:page-world-ready',{detail:{page:pagePath,slug:slug,archetype:archetype,visual:a.visual||archetype,motion:a.motion||'ambient',depth:a.depth||'layered',density:a.density||'balanced',role:a.worldRole,district:district&&district.id||null}}));
    host.querySelectorAll('a[data-world-action]').forEach(function(link){
      link.addEventListener('click',function(ev){
        var d=link.getAttribute('data-world-district'),act=link.getAttribute('data-world-action');
        if(!d||!window.OmegaWorldAction)return;
        var href=link.href;
        ev.preventDefault();
        var done=false;
        var go=function(){if(done)return;done=true;location.href=href;};
        window.OmegaWorldAction.record({district:d,action:act,route:location.pathname}).finally(go);
        setTimeout(go,700);
      });
    });
  }

  function escapeHtml(v) { return window.OmegaEsc ? OmegaEsc.esc(v) : ''; }
  function escapeAttr(v){return String(v).replace(/[^a-zA-Z0-9_\-./#?=&]/g,'');}

  async function boot(){
    suppressMembrane=!!(document.body&&document.body.dataset&&document.body.dataset.noWorldMembrane==='true');
    try{
      var r=await fetch('/config/page-character-manifest.json',{cache:'no-store'});
      if(!r.ok)throw new Error('page manifest '+r.status);
      manifest=await r.json();
      try{
        var pr=await fetch('/config/page-world-actions.json',{cache:'no-store'});
        if(pr.ok)pageWorld=await pr.json();
      }catch(_pageWorld){}
      try{
        var wr=await fetch('/config/omega-world-manifest.json',{cache:'no-store'});
        if(wr.ok)world=await wr.json();
        var or=await fetch('/config/page-world-overrides.json',{cache:'no-store'});
        if(or.ok)overrides=await or.json();
      }catch(_){}
      inject();
    }catch(e){console.warn('[Omega] page world membrane unavailable',e);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.OmegaPageWorld={boot:boot,getArchetype:function(){return archetype;},getDistrict:function(){return district;},getPage:function(){return pageWorld;},getManifest:function(){return manifest;},getOverrides:function(){return overrides;}};
})();