/* approvals.html UI shell: canvas rings, tabs, filters, and ONE delegated click
   dispatcher. Moved out of inline <script>/onclick= so this page can run under
   script-src 'self' with no 'unsafe-inline'. Controls carry data-action (and
   data-arg / data-uid); functions resolve at click time, so module-defined ones
   (load, approve, ...) work once approvals.js has published them. */
/* Topbar mini ring */
(function(){var cv=document.getElementById('tb-cv');if(!cv||!cv.getContext)return;var ctx=cv.getContext('2d'),t=0;(function f(){ctx.clearRect(0,0,50,50);for(var i=0;i<4;i++){ctx.beginPath();ctx.arc(25,25,7+i*4+2*Math.sin(t*.04+i),t*.015*((i%2)?1:-1),t*.015*((i%2)?1:-1)+Math.PI*(.5+.3*Math.sin(t*.03+i)));ctx.strokeStyle='rgba(201,168,76,'+(0.08+0.12*(4-i)/4)+')';ctx.lineWidth=.8;ctx.stroke();}ctx.font='bold 9px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(201,168,76,'+(0.7+0.3*Math.sin(t*.04))+')';ctx.fillText('Ω',25,25);t++;requestAnimationFrame(f);})();})();
/* Hero ring */
(function(){var cv=document.getElementById('hero-cv');if(!cv||!cv.getContext)return;var ctx=cv.getContext('2d'),t=0;(function g(){ctx.clearRect(0,0,90,90);for(var i=0;i<8;i++){ctx.beginPath();ctx.arc(45,45,10+i*4+3*Math.sin(t*.03+i),t*.008*((i%2)?1:-1),t*.008*((i%2)?1:-1)+Math.PI*(.5+.3*Math.sin(t*.02+i)));ctx.strokeStyle='rgba(201,168,76,'+(0.07+0.1*(8-i)/8)+')';ctx.lineWidth=.8;ctx.stroke();}ctx.font='bold 16px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(201,168,76,'+(0.7+0.3*Math.sin(t*.04))+')';ctx.shadowColor=(getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()||'#C9A84C');ctx.shadowBlur=9;ctx.fillText('Ω',45,45);ctx.shadowBlur=0;t++;requestAnimationFrame(g);})();})();
/* Tab switching */
function setTab(name){
  var tabs=['members','operations','audit','science'];
  document.querySelectorAll('.tab-btn').forEach(function(b,i){b.classList.toggle('active',tabs[i]===name);b.setAttribute('aria-selected',tabs[i]===name?'true':'false');});
  document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.toggle('active',p.id==='tab-'+name);});
  if(name==='operations'){setTimeout(function(){if(window.loadContracts)loadContracts();if(window.loadReservations)loadReservations();},200);}
  if(name==='audit'){setTimeout(function(){if(window.loadAudit)loadAudit();if(window.loadErrors)loadErrors();},200);}
}
window.setTab=setTab;
/* Filter bar */
var _filter='all';
window.setFilter=function(btn,f){
  document.querySelectorAll('.fb').forEach(function(b){b.classList.remove('on');});
  document.querySelectorAll('.stat-cell').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on');
  _filter=f;
  if(window.load)load();
};
window.filterClick=function(cell,f){
  _filter=f;
  document.querySelectorAll('.stat-cell').forEach(function(b){b.classList.remove('on');});
  document.querySelectorAll('.fb').forEach(function(b){b.classList.remove('on');});
  cell.classList.add('on');
  document.querySelectorAll('.fb[data-arg="'+f+'"]').forEach(function(b){b.classList.add('on');});
  if(window.load)load();
};
/* Audit-tab ring */
(function(){var cv=document.getElementById('cv-audit');if(!cv||!cv.getContext)return;var ctx=cv.getContext('2d'),t=0;(function f(){ctx.clearRect(0,0,80,80);for(var i=0;i<6;i++){ctx.beginPath();ctx.arc(40,40,10+i*4+2*Math.sin(t*.03+i),t*.01*((i%2)?1:-1),t*.01*((i%2)?1:-1)+Math.PI*(.5+.25*Math.sin(t*.02+i)));ctx.strokeStyle='rgba(201,168,76,'+(0.08+0.1*(6-i)/6)+')';ctx.lineWidth=.7;ctx.stroke();}ctx.font='bold 14px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(201,168,76,'+(0.7+0.3*Math.sin(t*.04))+')';ctx.shadowColor=(getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()||'#C9A84C');ctx.shadowBlur=7;ctx.fillText('Ω',40,40);ctx.shadowBlur=0;t++;requestAnimationFrame(f);})();})();
/* Delegated actions. The allow-list is the ONLY way a data-action reaches a
   function: never window[name], so markup cannot call arbitrary globals. */
(function(){
  var ACTIONS={
    filterClick:function(el){window.filterClick(el,el.dataset.arg);},
    setFilter:function(el){window.setFilter(el,el.dataset.arg);},
    setTab:function(el){window.setTab(el.dataset.arg);},
    load:function(){if(window.load)window.load();},
    loadContracts:function(){if(window.loadContracts)window.loadContracts();},
    loadReservations:function(){if(window.loadReservations)window.loadReservations();},
    loadAudit:function(){if(window.loadAudit)window.loadAudit();},
    loadErrors:function(){if(window.loadErrors)window.loadErrors();},
    sendDispatch:function(){if(window.sendDispatch)window.sendDispatch();},
    approve:function(el){if(window.approve)window.approve(el.dataset.uid);},
    grantPermanent:function(el){if(window.grantPermanent)window.grantPermanent(el.dataset.uid);},
    extend:function(el){if(window.extend)window.extend(el.dataset.uid);},
    reject:function(el){if(window.reject)window.reject(el.dataset.uid);},
    revoke:function(el){if(window.revoke)window.revoke(el.dataset.uid);}
  };
  document.addEventListener('click',function(e){
    var el=e.target.closest&&e.target.closest('[data-action]');
    if(!el)return;
    var fn=Object.prototype.hasOwnProperty.call(ACTIONS,el.dataset.action)?ACTIONS[el.dataset.action]:null;
    if(fn)fn(el);
  });
})();
