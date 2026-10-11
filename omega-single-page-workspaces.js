(function(){
  'use strict';
  var path=(location.pathname.split('/').pop()||'dashboard.html');
  var host=location.origin;
  var WORKSPACES={
    '/dashboard.html':['beacon','search','notifications','chatbot','missions','world','replay','evidence','recovery','contacts','decisions','network','notes','projects','quotes','time','vision'],
    '/profile.html':['identity','passport','character','credentials','membership'],
    '/life.html':['body','physiology','workout','nutrition','sleep','mood','meditate','breath','habits','journal','rituals','fasting','targets','weekly','affirmations','gratitude','oath','stoic','water'],
    '/ascend.html':['academy','courses','focus','contributions','evolution','levels','phases','ascension','domain-mastery','clarity','flashcard','library','mentors','principles','reading','skills','vocabulary','architect','forge'],
    '/cosmos.html':['horoscope','elements','pantheons','houses','chronicle','dna','graph','map','mirror','oracle','realm','rune','tribe','realms','sculpture','cosmic-ledger'],
    '/vault.html':['wallet','subscriptions','payments','ledger','blockchain','advertising','ad-network','sovereign-covenant'],
    '/order.html':['family','heritage','bloodline','hall','sovereigns','factions','city','approvals','interface-omni'],
    '/services.html':['consultancy','contracts','publishing','marketing','events','travel','health','social'],
    '/intel.html':['research','prediction','intelligence','automation','graphify','graph-admin','graph-timeline','graph-centrality','graph-explorer','graph-anomalies','graph-evidence','atlas','cipher','codex','mindmap','nexus','pulse','sigma','signal','news'],
    '/arena.html':['sovereign-ai','agent-network','agents','analytics','queue','gaming'],
    '/govern.html':['governance','observatory','enterprise','privacy','roadmap','ecosystem','knowledge','knowledge-loom','maintenance','control-center','platform-kernel','agent-operations','ops','architecture','autonomous-insights'],
    '/invest.html':['investment','portfolio','treasury','wallet','revenue','income','budget','expenses','wealth','ledger','payments','subscriptions'],
    '/achieve.html':['achievements','my-quests','quest-progress','leaderboard','domain-mastery','seasonal-events','gates','grades','levels','phases','ascension','kings','triads','grid','awards','hercules','trophies','gaming'],
    '/archive.html':['heritage','bloodline','character','identity','passport','kyc','credentials','charter','sigil','membership'],
    '/media.html':['cinema','movies','series','trailers','universe','feed','publications','visual-atlas','characters']
  };
  var modules=WORKSPACES[location.pathname]||[];
  if(!modules.length)return;

  function css(){
    if(document.getElementById('omega-single-page-css'))return;
    var s=document.createElement('style');s.id='omega-single-page-css';
    s.textContent=[
      '.omega-module-dialog{width:min(1180px,96vw);height:min(88vh,900px);padding:0;border:1px solid rgba(201,168,76,.3);border-radius:14px;background:#05050c;color:#eee;box-shadow:0 30px 120px rgba(0,0,0,.75)}',
      '.omega-module-dialog::backdrop{background:rgba(2,2,6,.78);backdrop-filter:blur(10px)}',
      '.omega-module-head{height:52px;display:flex;align-items:center;gap:10px;padding:0 12px;border-bottom:1px solid rgba(201,168,76,.15);background:#0a0a0f;box-sizing:border-box}',
      '.omega-module-title{font:600 12px "Courier Prime",monospace;letter-spacing:1.5px;color:#e8c97a;min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.omega-module-source{font:10px "Courier Prime",monospace;color:#85837b;white-space:nowrap}',
      '.omega-module-close,.omega-module-open{min-height:36px;padding:0 10px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.04);color:#e8c97a;font:10px "Courier Prime",monospace;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}',
      '.omega-module-frame{display:block;width:100%;height:calc(100% - 52px);border:0;background:#020206}',
      '.omega-module-picker{display:flex;gap:6px;overflow:auto;padding:8px 10px;margin:0 0 14px;border:1px solid rgba(201,168,76,.12);background:rgba(10,10,15,.48);scrollbar-width:none}',
      '.omega-module-picker::-webkit-scrollbar{display:none}',
      '.omega-module-chip{flex:0 0 auto;min-height:38px;padding:0 11px;border:1px solid rgba(201,168,76,.16);background:transparent;color:#85837b;font:10px "Courier Prime",monospace;letter-spacing:.8px;cursor:pointer;border-radius:7px}',
      '.omega-module-chip:hover,.omega-module-chip[aria-current="true"]{color:#e8c97a;border-color:rgba(201,168,76,.5);background:rgba(201,168,76,.08)}'
    ].join('');
    document.head.appendChild(s);
  }

  function label(key){return key.replace(/[-_]/g,' ').replace(/\b\w/g,function(m){return m.toUpperCase();});}
  function route(key){return '/'+key+'.html';}
  function currentKey(){
    var m=(location.hash.match(/(?:^#|[?&])module=([^&]+)/)||[])[1];
    return m&&modules.indexOf(decodeURIComponent(m))>=0?decodeURIComponent(m):null;
  }
  var dialog=document.createElement('dialog');dialog.className='omega-module-dialog';dialog.setAttribute('aria-label','Omega in-page capability view');
  var head=document.createElement('div');head.className='omega-module-head';
  var title=document.createElement('div');title.className='omega-module-title';
  var source=document.createElement('span');source.className='omega-module-source';
  var open=document.createElement('a');open.className='omega-module-open';open.target='_blank';open.rel='noopener';open.textContent='OPEN ROUTE';
  var close=document.createElement('button');close.className='omega-module-close';close.type='button';close.textContent='CLOSE';
  head.append(title,source,open,close);
  var frame=document.createElement('iframe');frame.className='omega-module-frame';frame.title='Capability view';
  dialog.append(head,frame);document.body.appendChild(dialog);
  css();

  function show(key,replace){
    if(modules.indexOf(key)<0)return;
    var u=route(key);
    title.textContent=label(key);
    source.textContent='SOURCE '+u;
    open.href=u;
    frame.src=u;
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    if(replace)history.replaceState(null,'',location.pathname+'#module='+encodeURIComponent(key));
  }
  function hide(){
    if(dialog.open&&dialog.close)dialog.close();
    else dialog.removeAttribute('open');
    frame.src='about:blank';
    if(location.hash.indexOf('#module=')===0)history.replaceState(null,'',location.pathname);
  }
  close.addEventListener('click',hide);
  dialog.addEventListener('click',function(e){if(e.target===dialog)hide();});
  dialog.addEventListener('cancel',function(e){e.preventDefault();hide();});
  window.addEventListener('hashchange',function(){var k=currentKey();if(k)show(k,false);else if(dialog.open)hide();});

  var main=document.querySelector('main');
  if(!main)return;
  var picker=document.createElement('nav');picker.className='omega-module-picker';picker.setAttribute('aria-label','Workspace capabilities');
  modules.forEach(function(k){
    var a=document.createElement('button');a.type='button';a.className='omega-module-chip';a.textContent=label(k);a.dataset.module=k;
    a.addEventListener('click',function(){show(k,true);});
    picker.appendChild(a);
  });
  main.insertBefore(picker,main.firstChild);
  var k=currentKey();if(k)show(k,false);
  window.OmegaSinglePage={open:show,close:hide,modules:modules.slice()};
})();