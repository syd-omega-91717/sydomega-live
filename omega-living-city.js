/* Ω SYD OMEGA 91717 — LIVING CITY WORLD LAYER
 * Canonical presentation layer over existing City, mission, progression,
 * character, achievement and commerce systems.
 * No new authority source. No fabricated rewards. No payment path.
 */
(function(){
  'use strict';
  if(window.__omegaLivingCity)return;
  window.__omegaLivingCity=true;

  var manifest=null;
  var selected=null;
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function escText(el,text){ if(el)el.textContent=text==null?'':String(text); }
  function auth(){
    var n=Number(window.__omegaAuth);
    return isFinite(n)?n:0;
  }
  function unlocked(d){
    var rule=String(d.unlock||'');
    if(rule==='member access'||rule==='verified member + eligible offer')return true;
    var m=rule.match(/authority\s*>=\s*([\d.]+)/i);
    return !m || auth()>=Number(m[1]) || !!window.__omegaIsOwner;
  }
  function firstPage(d){
    var p=(d.pages&&d.pages[0])||'dashboard';
    return '/'+p.replace(/\.html$/,'')+'.html';
  }
  function rewardPage(d){
    return d.archetype==='gaming'?'/trophies.html':'/achievements.html';
  }
  function actionLink(d,action){
    var a=String(action||'').toLowerCase();
    if(a==='play'||a==='compete'||a==='challenge'||a==='rank')return '/gaming.html';
    if(a==='claim reward')return rewardPage(d);
    if(a==='buy'||a==='sell'||a==='commission'||a==='subscribe')return '/marketplace.html';
    if(a==='investigate'||a==='consult'||a==='compare'||a==='trace'||a==='discover')return firstPage(d);
    if(a==='study'||a==='practice'||a==='submit exam'||a==='master discipline')return '/academy.html';
    if(a==='connect'||a==='record lineage'||a==='join faction'||a==='preserve memory')return '/family.html';
    if(a==='track'||a==='reflect'||a==='complete routine'||a==='build streak')return '/habits.html';
    if(a==='explore'||a==='simulate'||a==='predict'||a==='map'||a==='unlock node')return '/map.html';
    return firstPage(d);
  }

  function ensureStyles(){
    if(document.getElementById('omega-living-city-css'))return;
    var s=document.createElement('style');s.id='omega-living-city-css';
    s.textContent=[
      '.omega-world-loop{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:7px;margin:0 0 16px}',
      '.omega-world-step{border:1px solid var(--line);background:rgba(10,10,15,.55);padding:10px 12px;min-height:58px}',
      '.omega-world-step b{display:block;font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--gold);margin-bottom:4px}',
      '.omega-world-step span{font-family:var(--M);font-size:12px;color:var(--muted)}',
      '.district-card{cursor:pointer;position:relative}',
      '.district-card[data-world-selected=true]{border-color:var(--cyan)!important;box-shadow:0 0 22px rgba(0,229,255,.12);transform:translateY(-2px)}',
      '.district-card[data-world-locked=true]{opacity:.68}',
      '.district-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}',
      '.district-actions a{font-family:var(--M);font-size:12px;letter-spacing:1px;color:var(--gold);text-decoration:none;border:1px solid rgba(201,168,76,.25);padding:5px 8px}',
      '.district-actions a:hover,.district-actions a:focus-visible{border-color:var(--gold);background:rgba(201,168,76,.06)}',
      '.district-unlock{font-family:var(--M);font-size:12px;letter-spacing:1px;margin-top:7px;color:var(--green)}',
      '.district-lock{color:var(--muted)}',
      '@media(prefers-reduced-motion:reduce){.district-card[data-world-selected=true]{transform:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  function renderLoop(){
    var host=document.getElementById('omega-world-loop');if(!host)return;
    var steps=['ENTER','CHOOSE','ACT','EARN','UNLOCK','COLLECT','BUILD','RETURN'];
    host.innerHTML='';
    steps.forEach(function(x,i){
      var cell=document.createElement('div');cell.className='omega-world-step';
      var b=document.createElement('b');b.textContent=String(i+1).padStart(2,'0')+' · '+x;
      var span=document.createElement('span');
      span.textContent={
        ENTER:'choose your district',CHOOSE:'select a purpose',ACT:'do a real action',
        EARN:'verified progress',UNLOCK:'open new content',COLLECT:'keep your proof',
        BUILD:'shape your world',RETURN:'new mission awaits'
      }[x];
      cell.appendChild(b);cell.appendChild(span);host.appendChild(cell);
    });
  }

  function selectDistrict(d,card){
    selected=d;
    var grid=document.getElementById('district-grid');
    if(grid)Array.prototype.forEach.call(grid.querySelectorAll('.district-card'),function(c){c.removeAttribute('data-world-selected');});
    if(card)card.setAttribute('data-world-selected','true');
    var state=document.getElementById('city-state');
    if(state)state.textContent='DISTRICT '+d.zone+' · '+d.name;
    var focus=document.getElementById('omega-city-focus');
    if(focus){
      focus.hidden=false;
      escText(focus.querySelector('[data-focus-name]'),d.name);
      escText(focus.querySelector('[data-focus-purpose]'),d.purpose);
      escText(focus.querySelector('[data-focus-agent]'),d.agent);
    }
  }

  function renderDistricts(){
    var grid=document.getElementById('district-grid');if(!grid||!manifest)return;
    grid.innerHTML='';
    manifest.districts.forEach(function(d){
      var open=unlocked(d);
      var card=document.createElement('article');card.className='district-card card card-edge';
      card.dataset.district=d.id;card.dataset.worldLocked=open?'false':'true';
      card.setAttribute('role','listitem');

      var zone=document.createElement('div');zone.className='d-zone';zone.textContent='DISTRICT '+d.zone;
      var name=document.createElement('div');name.className='d-name';name.textContent=d.name;
      var desc=document.createElement('div');desc.className='d-desc';desc.textContent=d.purpose;
      var role=document.createElement('div');role.className='d-module';role.textContent='ROLE · '+d.archetype.toUpperCase()+' · AGENT · '+d.agent.toUpperCase();
      var resources=document.createElement('div');resources.className='d-nodes';resources.textContent='RESOURCES · '+(d.resources||[]).join(' · ');
      var status=document.createElement('div');status.className='district-unlock '+(open?'':'district-lock');
      status.textContent=open?'ACCESS · OPEN':'LOCK · '+d.unlock;

      var actions=document.createElement('div');actions.className='district-actions';
      var enter=document.createElement('a');enter.href=firstPage(d);enter.textContent='ENTER';
      var mission=document.createElement('a');mission.href='/missions.html';mission.textContent='MISSION';
      var rewards=document.createElement('a');rewards.href=rewardPage(d);rewards.textContent='REWARDS';
      [enter,mission,rewards].forEach(function(a){if(!open)a.setAttribute('aria-disabled','true');actions.appendChild(a);});
      card.appendChild(zone);card.appendChild(name);card.appendChild(desc);card.appendChild(role);
      card.appendChild(resources);card.appendChild(status);card.appendChild(actions);
      card.addEventListener('click',function(e){
        if(e.target&&e.target.closest&&e.target.closest('a'))return;
        selectDistrict(d,card);
      });
      card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();selectDistrict(d,card);}});
      card.tabIndex=0;
      grid.appendChild(card);
    });
  }

  function renderFocus(){
    var host=document.getElementById('omega-city-focus');if(!host||host.dataset.ready)return;
    host.dataset.ready='true';
    var title=document.createElement('div');title.className='sechead';title.textContent='ACTIVE DISTRICT · WORLD PURPOSE';
    var body=document.createElement('div');body.className='card';body.style.cssText='padding:14px;margin-bottom:16px';
    var name=document.createElement('div');name.style.cssText='font-family:var(--D);font-size:16px;color:var(--gold);margin-bottom:5px';name.dataset.focusName='true';
    var purpose=document.createElement('div');purpose.style.cssText='font-size:13px;line-height:1.7;color:var(--muted);margin-bottom:8px';purpose.dataset.focusPurpose='true';
    var agent=document.createElement('div');agent.style.cssText='font-family:var(--M);font-size:12px;letter-spacing:1.5px;color:var(--cyan)';agent.dataset.focusAgent='true';
    body.appendChild(name);body.appendChild(purpose);body.appendChild(agent);host.appendChild(title);host.appendChild(body);
  }

  function updateAccess(){
    renderDistricts();
    if(selected){
      var card=document.querySelector('[data-district="'+selected.id+'"]');
      if(card)selectDistrict(selected,card);
    }
  }

  async function boot(){
    if(!document.getElementById('district-grid'))return;
    try{
      var res=await fetch('/config/omega-world-manifest.json',{cache:'no-store'});
      if(!res.ok)throw new Error('world manifest '+res.status);
      manifest=await res.json();
      ensureStyles();renderLoop();renderFocus();renderDistricts();
      if(manifest.districts[0]){
        var first=document.querySelector('[data-district="'+manifest.districts[0].id+'"]');
        if(first)selectDistrict(manifest.districts[0],first);
      }
      document.dispatchEvent(new CustomEvent('omega:living-city-ready',{detail:{version:manifest.version,districts:manifest.districts.length}}));
    }catch(e){console.warn('[Omega] living city manifest unavailable',e);}
  }

  document.addEventListener('omega:populated',updateAccess);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.OmegaLivingCity={boot:boot,getManifest:function(){return manifest;},select:function(id){
    if(!manifest)return false;var d=manifest.districts.find(function(x){return x.id===id;});
    if(!d)return false;var card=document.querySelector('[data-district="'+id+'"]');selectDistrict(d,card);return true;
  }};
})();