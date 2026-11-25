/* Ω SYD OMEGA 91717 — DOMAIN HUB WORKSPACES
   Consolidates mapped specialist routes into persistent domain workspaces.
   Legacy URLs remain intact and render inside a same-origin, session-preserving frame.
   This is a presentation/navigation layer only; authorization and data authority stay
   in each original page, its server-side APIs, Supabase RLS and Edge Functions.
*/
(function(){
  'use strict';
  if(window.__omegaDomainHubsLoaded) return;
  window.__omegaDomainHubsLoaded=true;

  var params=new URLSearchParams(window.location.search);
  var currentPath=decodeURIComponent(window.location.pathname.split('/').pop()||'index.html');
  if(!currentPath.endsWith('.html')) currentPath='index.html';
  currentPath=currentPath.toLowerCase();
  var HUB_PATHS=[
    'dashboard.html','profile.html','ascend.html','cosmos.html','vault.html',
    'order.html','life.html','services.html','intel.html','sovereign-ai.html',
    'govern.html','invest.html','achieve.html','media.html'
  ];
  var embedded=params.get('omega_embed')==='1';
  if(!embedded && window.parent!==window){
    try{
      var parentPath=(window.parent.location.pathname.split('/').pop()||'').toLowerCase();
      embedded=window.parent.location.origin===window.location.origin && HUB_PATHS.indexOf(parentPath)!==-1;
    }catch(error){}
  }
  var PROTECTED_ROUTE_STEMS={
    '404':1,'500':1,offline:1,maintenance:1,login:1,signup:1,
    account:1,approvals:1,contracts:1,'control-center':1,'control-plane':1,'graph-admin':1,
    kyc:1,portfolio:1,privacy:1,security:1,settings:1,
    subscriptions:1,terms:1,treasury:1,wallet:1
  };
  if(embedded && PROTECTED_ROUTE_STEMS[currentPath.replace(/\.html$/i,'')]){
    try{
      var standalone=new URL(window.location.href);
      standalone.searchParams.delete('omega_embed');
      standalone.searchParams.delete('omega_hub');
      standalone.searchParams.delete('omega_module');
      standalone.searchParams.delete('omega_module_query');
      if(window.top.location.origin===window.location.origin)
        window.top.location.replace(standalone.toString());
    }catch(error){}
    return;
  }

  function markEmbedded(){
    document.documentElement.classList.add('omega-embedded');
    if(document.body) document.body.classList.add('omega-embedded');
  }
  function reportFrameHeight(){
    if(window.parent===window) return;
    var height=Math.max(
      document.documentElement ? document.documentElement.scrollHeight : 0,
      document.body ? document.body.scrollHeight : 0
    );
    window.parent.postMessage({type:'omega-domain-hub:height',height:Math.ceil(height)},window.location.origin);
  }

  if(embedded){
    markEmbedded();
    function preserveEmbeddedNavigation(element,attribute){
      if(!element) return;
      var target=element.getAttribute('target')||'_self';
      if(target.toLowerCase()!=='_self') return;
      var raw=element.getAttribute(attribute);
      if(!raw || raw.charAt(0)==='#' || /^(mailto:|tel:|javascript:|data:|blob:)/i.test(raw)) return;
      try{
        var url=new URL(raw,window.location.href);
        if(url.origin!==window.location.origin) return;
        var stem=(url.pathname.split('/').pop()||'').replace(/\.html$/i,'').toLowerCase();
        if(PROTECTED_ROUTE_STEMS[stem]){
          element.setAttribute('target','_blank');
          element.setAttribute('rel','noopener noreferrer');
          return;
        }
        if(url.pathname==='/' || url.pathname.toLowerCase().endsWith('.html')){
          url.searchParams.set('omega_embed','1');
          element.setAttribute(attribute,url.pathname+url.search+url.hash);
        }
      }catch(error){}
    }
    window.addEventListener('click',function(event){
      if(event.defaultPrevented) return;
      var link=event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if(link && !link.hasAttribute('onclick')) preserveEmbeddedNavigation(link,'href');
    },false);
    window.addEventListener('submit',function(event){
      if(event.defaultPrevented) return;
      var form=event.target;
      if(form && form.tagName==='FORM' && !form.hasAttribute('onsubmit')) preserveEmbeddedNavigation(form,'action');
    },false);
    window.addEventListener('load',reportFrameHeight,{once:true});
    window.addEventListener('resize',reportFrameHeight,{passive:true});
    if(window.ResizeObserver){
      var observer=new ResizeObserver(reportFrameHeight);
      if(document.documentElement) observer.observe(document.documentElement);
      if(document.body) observer.observe(document.body);
    }
    requestAnimationFrame(reportFrameHeight);
    return;
  }

  if(!embedded && HUB_PATHS.indexOf(currentPath)===-1) return;

  function humanize(value){
    return String(value||'').replace(/\.html$/i,'').replace(/[-_]+/g,' ')
      .replace(/\b[a-z]/g,function(letter){return letter.toUpperCase();});
  }
  function clear(node){
    while(node.firstChild) node.removeChild(node.firstChild);
  }
  function make(tag,className,textValue){
    var node=document.createElement(tag);
    if(className) node.className=className;
    if(textValue!==undefined) node.textContent=textValue;
    return node;
  }
  function updateAddress(path,moduleQuery,moduleHash){
    try{
      var url=new URL(window.location.href);
      if(path) url.searchParams.set('omega_module',path);
      else url.searchParams.delete('omega_module');
      if(moduleQuery) url.searchParams.set('omega_module_query',moduleQuery);
      else url.searchParams.delete('omega_module_query');
      url.hash=moduleHash||'';
      window.history.replaceState({omegaHub:true},'',url.pathname+url.search+url.hash);
    }catch(error){}
  }

  function mount(matrix){
    var hub=(matrix.hubs||[]).filter(function(item){return item.path===currentPath;})[0];
    if(!hub) return;
    var rows=(matrix.pages||[]).filter(function(row){
      return row.classification==='CANDIDATE_MERGE_PANEL' &&
        row.candidate_hub===hub.path && row.path!==hub.path;
    }).sort(function(a,b){return String(a.page_id).localeCompare(String(b.page_id));});
    var protectedRows=(matrix.pages||[]).filter(function(row){
      return row.classification==='KEEP_SEPARATE' && row.protected_hub===hub.path;
    }).sort(function(a,b){return String(a.page_id).localeCompare(String(b.page_id));});
    var root=document.querySelector('main.main,main,.main,.page-shell,.page');
    if(!root || (!rows.length && !protectedRows.length) || root.querySelector('.omega-domain-hub-console')) return;

    root.classList.add('omega-domain-hub-root');
    var shell=make('section','omega-domain-hub-console');
    shell.setAttribute('aria-label',humanize(hub.section)+' domain workspace');
    var head=make('div','omega-domain-hub-head');
    var heading=make('div','');
    heading.appendChild(make('div','omega-domain-hub-kicker','Ω DOMAIN WORKSPACE · '+String(hub.section).toUpperCase()));
    heading.appendChild(make('h2','omega-domain-hub-title',humanize(hub.section)+' — Unified Workspace'));
    heading.appendChild(make('p','omega-domain-hub-copy','Access specialist modules without leaving this domain page. Existing module routes, authentication and server-side permissions remain in force.'));
    var count=make('div','omega-domain-hub-count');
    count.appendChild(make('strong','',String(rows.length)));
    count.appendChild(make('span','','SPECIALIST MODULES'));
    head.appendChild(heading);head.appendChild(count);shell.appendChild(head);

    var controls=make('div','omega-domain-hub-controls');
    var search=make('input','omega-domain-hub-search');
    search.type='search';search.placeholder='Search this workspace…';search.setAttribute('aria-label','Search domain modules');
    var overview=make('button','omega-domain-hub-action','OVERVIEW');
    overview.type='button';overview.hidden=true;
    var showAll=make('button','omega-domain-hub-action','SHOW ALL');
    showAll.type='button';
    controls.appendChild(search);controls.appendChild(overview);controls.appendChild(showAll);
    controls.hidden=!rows.length;
    shell.appendChild(controls);

    var results=make('div','omega-domain-hub-results');
    results.setAttribute('aria-live','polite');
    results.hidden=!rows.length;
    shell.appendChild(results);
    var note=make('p','omega-domain-hub-results-note',rows.length+' mapped modules · use search to locate a specific capability');
    note.hidden=!rows.length;
    shell.appendChild(note);

    if(protectedRows.length){
      var protectedSection=make('section','omega-domain-hub-protected');
      protectedSection.appendChild(make('div','omega-domain-hub-protected-title','PROTECTED WORKFLOWS · OPEN SEPARATELY'));
      var protectedGrid=make('div','omega-domain-hub-protected-grid');
      protectedRows.forEach(function(row){
        var link=make('a','omega-domain-hub-protected-link');
        link.href='/'+row.path;link.target='_blank';link.rel='noopener noreferrer';
        link.setAttribute('aria-label','Open '+humanize(row.page_id)+' separately');
        var label=make('span','');
        label.appendChild(make('span','omega-domain-hub-module-name',humanize(row.page_id)));
        label.appendChild(make('span','omega-domain-hub-module-path','/'+row.path));
        link.appendChild(label);
        link.appendChild(make('span','omega-domain-hub-protected-tag','SEPARATE ↗'));
        protectedGrid.appendChild(link);
      });
      protectedSection.appendChild(protectedGrid);
      shell.appendChild(protectedSection);
    }

    var view=make('div','omega-domain-hub-view');
    view.hidden=!rows.length;
    var viewHead=make('div','omega-domain-hub-view-head');
    var viewTitle=make('div','omega-domain-hub-view-title','MODULE VIEW');
    var viewLinks=make('div','omega-domain-hub-view-links');
    var openLink=make('a','omega-domain-hub-open-link','OPEN FULL PAGE ↗');
    openLink.target='_blank';openLink.rel='noopener noreferrer';
    viewLinks.appendChild(openLink);viewHead.appendChild(viewTitle);viewHead.appendChild(viewLinks);
    var frame=document.createElement('iframe');
    frame.className='omega-domain-hub-frame';
    frame.title=humanize(hub.section)+' module view';
    frame.loading='lazy';frame.referrerPolicy='same-origin';
    frame.setAttribute('allow','clipboard-read; clipboard-write');
    view.appendChild(viewHead);view.appendChild(frame);shell.appendChild(view);
    root.insertBefore(shell,root.firstChild);

    var showAllState=false,activePath='';
    function openModule(row,moduleQuery,moduleHash){
      if(!row) return;
      activePath=row.path;
      viewTitle.textContent=humanize(row.page_id);
      var standaloneUrl=new URL('/'+row.path,window.location.origin);
      var frameUrl=new URL('/'+row.path,window.location.origin);
      frameUrl.searchParams.set('omega_embed','1');
      frameUrl.searchParams.set('omega_hub',hub.section);
      if(moduleQuery){
        var forwarded=new URLSearchParams(moduleQuery);
        forwarded.forEach(function(value,key){
          if(key!=='omega_embed' && key!=='omega_hub' && key!=='omega_module' && key!=='omega_module_query'){
            frameUrl.searchParams.append(key,value);
            standaloneUrl.searchParams.append(key,value);
          }
        });
      }
      frameUrl.hash=moduleHash||'';
      standaloneUrl.hash=moduleHash||'';
      openLink.href=standaloneUrl.pathname+standaloneUrl.search+standaloneUrl.hash;
      frame.title=humanize(row.page_id)+' module';
      frame.src=frameUrl.pathname+frameUrl.search+frameUrl.hash;
      view.classList.add('is-open');
      overview.hidden=false;
      root.classList.add('omega-domain-hub-view-active');
      document.body.classList.add('omega-hub-view-active');
      updateAddress(row.path,moduleQuery,moduleHash);
      var buttons=results.querySelectorAll('button[data-module-path]');
      buttons.forEach(function(button){button.setAttribute('aria-pressed',button.getAttribute('data-module-path')===row.path?'true':'false');});
      view.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    }
    function closeModule(){
      activePath='';
      view.classList.remove('is-open');
      overview.hidden=true;
      root.classList.remove('omega-domain-hub-view-active');
      document.body.classList.remove('omega-hub-view-active');
      frame.src='about:blank';
      updateAddress('','','');
      search.focus();
    }
    function renderResults(){
      clear(results);
      var query=search.value.trim().toLowerCase();
      var matches=rows.filter(function(row){
        return !query || (String(row.page_id)+' '+String(row.path)).toLowerCase().includes(query);
      });
      var visible=query||showAllState?matches:matches.slice(0,8);
      visible.forEach(function(row){
        var button=make('button','omega-domain-hub-module');
        button.type='button';button.setAttribute('data-module-path',row.path);
        button.setAttribute('aria-pressed',row.path===activePath?'true':'false');
        var text=make('span','');
        text.appendChild(make('span','omega-domain-hub-module-name',humanize(row.page_id)));
        text.appendChild(make('span','omega-domain-hub-module-path','/'+row.path));
        button.appendChild(text);button.appendChild(make('span','omega-domain-hub-module-arrow','↗'));
        button.addEventListener('click',function(){openModule(row);});
        results.appendChild(button);
      });
      note.textContent=query
        ? matches.length+' matching modules'
        : (showAllState?rows.length+' mapped modules shown':Math.min(8,rows.length)+' of '+rows.length+' mapped modules shown');
      showAll.hidden=!!query || rows.length<=8;
      showAll.textContent=showAllState?'SHOW LESS':'SHOW ALL';
    }
    search.addEventListener('input',function(){showAllState=false;renderResults();});
    showAll.addEventListener('click',function(){showAllState=!showAllState;renderResults();});
    overview.addEventListener('click',closeModule);
    window.addEventListener('message',function(event){
      if(event.origin!==window.location.origin || event.source!==frame.contentWindow) return;
      var data=event.data||{};
      if(data.type!=='omega-domain-hub:height') return;
      var height=Math.max(520,Math.min(1800,Number(data.height)||680));
      frame.style.height=height+'px';
    });

    renderResults();
    var requested=params.get('omega_module');
    if(requested){
      var initial=rows.filter(function(row){return row.path===requested;})[0];
      if(initial) openModule(initial,params.get('omega_module_query')||'',window.location.hash);
    }
  }

  fetch('/config/omega-page-hub-ownership.json',{credentials:'same-origin',cache:'no-cache'})
    .then(function(response){
      if(!response.ok) throw new Error('Domain workspace registry unavailable');
      return response.json();
    })
    .then(mount)
    .catch(function(){
      /* Fail open: the existing hub page and its original navigation remain usable. */
    });
})();
