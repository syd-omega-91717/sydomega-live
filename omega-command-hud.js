/* Ω SYD OMEGA 91717 — COMMAND HUD
   Purpose: compact cross-platform control surface over existing OmegaOS state.
   It is an experience layer only: it does not create a second auth, data,
   navigation, payment or capability registry. */
(function(){
'use strict';
if(window.__omegaCommandHud) return;
window.__omegaCommandHud=true;

function el(tag,cls,text){
  var n=document.createElement(tag);
  if(cls)n.className=cls;
  if(text!=null)n.textContent=String(text);
  return n;
}
function mount(){
  if(document.getElementById('omega-command-hud')) return;
  var root=el('aside','omega-command-hud');
  root.id='omega-command-hud';
  root.setAttribute('aria-label','Omega command controls');

  var button=el('button','omega-command-hud__toggle','Ω');
  button.type='button';
  button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-controls','omega-command-hud__panel');
  button.title='Open Ω Command';
  root.appendChild(button);

  var panel=el('div','omega-command-hud__panel');
  panel.id='omega-command-hud__panel';
  panel.hidden=true;

  var head=el('div','omega-command-hud__head');
  head.appendChild(el('strong',null,'Ω COMMAND'));
  var reality=el('span','omega-command-hud__reality','MEASURED');
  head.appendChild(reality);
  panel.appendChild(head);

  var context=el('div','omega-command-hud__context');
  panel.appendChild(context);

  var grid=el('nav','omega-command-hud__grid');
  grid.setAttribute('aria-label','Command shortcuts');
  [
    ['WORLD','/world.html'],
    ['SEARCH','/search.html'],
    ['MISSIONS','/missions.html'],
    ['NOTIFY','/notifications.html'],
    ['RECOVERY','/recovery.html'],
    ['EVIDENCE','/evidence.html']
  ].forEach(function(item){
    var a=document.createElement('a');
    a.href=item[1];
    a.textContent=item[0];
    grid.appendChild(a);
  });
  panel.appendChild(grid);

  var health=el('div','omega-command-hud__health');
  health.setAttribute('role','status');
  health.setAttribute('aria-live','polite');
  panel.appendChild(health);

  var note=el('p','omega-command-hud__note','This HUD reports session signals only. It does not prove production health, authorization, payment, ownership or achievement.');
  panel.appendChild(note);
  root.appendChild(panel);

  button.addEventListener('click',function(){
    var open=!panel.hidden;
    panel.hidden=open;
    button.setAttribute('aria-expanded',String(!open));
    root.classList.toggle('is-open',!open);
  });

  document.body.appendChild(root);

  function refresh(){
    var os=window.OmegaOS;
    var data=window.__omegaData||{};
    var seen=(data.ok||0)+(data.failed||0);
    var user=window.__omegaUser;
    context.textContent=(os&&os.page?os.page.replace(/^\//,'').replace(/\.html$/,''):'CURRENT SURFACE')+
      ' · '+(user?'AUTHENTICATED SESSION':'GUEST SESSION');
    if(!seen){
      health.textContent='BACKEND SIGNAL: AWAITING RESPONSE';
      reality.textContent='UNVERIFIED';
      reality.dataset.state='unverified';
      return;
    }
    var pct=Math.round((data.ok||0)/seen*100);
    health.textContent='SESSION BACKEND: '+(data.ok||0)+' OK / '+(data.failed||0)+' FAILED · '+pct+'%';
    reality.textContent='SESSION-MEASURED';
    reality.dataset.state=pct>=85?'healthy':pct>=70?'degraded':'failing';
  }
  refresh();
  document.addEventListener('omega:fetch-settled',refresh);
  document.addEventListener('omega:user-loaded',function(e){
    window.__omegaUser=e.detail&&e.detail.user||window.__omegaUser||null;
    refresh();
  });
  window.addEventListener('omega:page_loaded',refresh);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
window.OmegaCommandHUD={mount:mount};
})();