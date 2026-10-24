/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-orrery.js  (orrery.html only)

   The ORRERY: the 12 canon tracks as one wheel. A lens relabels every node as
   sign / god / element / agent / gate / house -- six pages' worth of the same
   12 rows, folded into one interaction. A src= module, not inline code:
   scripts/csp-inline-ratchet.py refuses new inline script.
   ========================================================================== */
import{createClient}from'/vendor/supabase-js.js';
var sb=window.__omegaSb||(window.__omegaSb=createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'));

/* One wheel, six systems. Every value below comes from its owner -- the
   tracks from OmegaCanon (omega-canon.json), the sign->element map from
   OmegaCanon.elementFor (omega-elements.json), agents from omega-agents.json,
   colours from OmegaEmblem -- never a local copy (CLAUDE.md 8.1 class 8). */
var LENSES=[
  {k:'sign',  t:'SIGNS',    href:function(){return '/cosmos.html#horoscope';}},
  {k:'god',   t:'GODS',     href:function(){return '/pantheons.html';}},
  {k:'element',t:'ELEMENTS',href:function(){return '/elements.html';}},
  {k:'agent', t:'AGENTS',   href:function(tr,ag){return (ag&&ag.href)||'/agents.html';}},
  {k:'gate',  t:'GATES',    href:function(){return '/elements.html#gates';}},
  {k:'house', t:'HOUSES',   href:function(){return '/houses.html';}}
];
var EXTRA=[
  {k:'token', t:'TOKEN', href:'/vault.html'},
  {k:'medal', t:'MEDAL', href:'/honors.html#record'},
];
var S={tracks:[],agents:{},lens:0,sel:0,rot:0,el:null,mine:-1};
var $=function(id){return document.getElementById(id);};
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function cap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1).toLowerCase();}
function colorOf(sign){return window.OmegaEmblem?window.OmegaEmblem.color(sign):'#C9A84C';}
function elementOf(tr){return (window.OmegaCanon.elementFor(tr.sign)||tr.element||'').toUpperCase();}
function valueOf(tr,k){
  if(k==='element')return elementOf(tr);
  if(k==='agent'){var a=S.agents[tr.sign];return a?a.name:tr.agent;}
  return tr[k];
}

function buildLens(){
  $('orr-lens').innerHTML=LENSES.map(function(l,i){
    return '<button type="button" role="tab" aria-selected="'+(i===S.lens)+'" data-i="'+i+'">'+l.t+'</button>';}).join('');
  $('orr-lens').onclick=function(e){var b=e.target.closest('button');if(!b)return;S.lens=+b.dataset.i;buildLens();paint();};
}
function buildElements(){
  var els=window.OmegaCanon.elements||[];
  $('orr-els').innerHTML=els.map(function(e){
    var physical=e.tier==='PHYSICAL';
    var col=physical?colorOf((e.members||[])[0]):'';
    return '<button type="button" aria-pressed="'+(S.el===e.name)+'" data-el="'+esc(e.name)+'"'+
      (physical?' style="--el:'+col+'"':' disabled title="'+esc(e.tier)+' -- assigned by class, not by sign"')+'>'+esc(e.name)+'</button>';
  }).join('');
  $('orr-els').onclick=function(e){var b=e.target.closest('button');if(!b||b.disabled)return;
    S.el=S.el===b.dataset.el?null:b.dataset.el;buildElements();paint();};
}

function buildWheel(){
  var n=S.tracks.length,spokes='',nodes='';
  S.tracks.forEach(function(tr,i){
    var a=(i/n)*Math.PI*2-Math.PI/2,x=50+41*Math.cos(a),y=50+41*Math.sin(a);
    spokes+='<line x1="50" y1="50" x2="'+x.toFixed(2)+'" y2="'+y.toFixed(2)+'" data-i="'+i+'"/>';
    nodes+='<button type="button" class="orr-node" data-i="'+i+'" style="--x:'+x.toFixed(2)+'%;--y:'+y.toFixed(2)+'%;--c:'+colorOf(tr.sign)+'">'+
      '<span class="orr-face"><span data-omega-emblem="'+esc(tr.sign)+'"></span><span class="orr-lbl"></span></span></button>';
  });
  $('orr-spokes').innerHTML=spokes;
  $('orr-nodes').innerHTML=nodes;
  $('orr-ring').onclick=function(e){var b=e.target.closest('.orr-node');if(b&&!S.dragged)select(+b.dataset.i);};
}

/* Turn the ring so the selected node sits at the top, the short way round. */
function select(i){
  var n=S.tracks.length;i=((i%n)+n)%n;
  var target=-(i/n)*360,d=((target-S.rot)%360+540)%360-180;
  S.rot+=d;S.sel=i;paint();
}

function paint(){
  var lens=LENSES[S.lens],tr=S.tracks[S.sel];if(!tr)return;
  var ag=S.agents[tr.sign],col=colorOf(tr.sign);
  var wheel=$('orr-wheel');wheel.style.setProperty('--rot',S.rot+'deg');
  wheel.querySelectorAll('.orr-node').forEach(function(b){
    var t=S.tracks[+b.dataset.i],on=+b.dataset.i===S.sel;
    b.setAttribute('aria-pressed',on);
    b.setAttribute('aria-label',t.sign+' -- '+lens.t.toLowerCase().replace(/s$/,'')+': '+valueOf(t,lens.k));
    b.querySelector('.orr-lbl').textContent=String(valueOf(t,lens.k)||'').replace(/^(Gate|Trophy|Medal) of (the )?/,'');
    b.classList.toggle('dim',!!S.el&&elementOf(t)!==S.el);
    b.classList.toggle('you',+b.dataset.i===S.mine);
  });
  document.querySelectorAll('#orr-spokes line').forEach(function(l){l.classList.toggle('on',+l.dataset.i===S.sel);});
  $('orr-core-v').textContent=valueOf(tr,lens.k)||'';
  $('orr-core-k').textContent=lens.t.replace(/S$/,'')+' '+String(tr.n).padStart(2,'0')+' / 12';
  var p=$('orr-panel');p.style.setProperty('--c',col);
  /* A fresh node, not a changed attribute: omega-emblems.js fills marks it
     sees inserted, and does not redraw one whose sign attribute changes. */
  $('orr-mark').innerHTML='<span data-omega-emblem="'+esc(tr.sign)+'"></span>';
  $('orr-n').textContent='TRACK '+String(tr.n).padStart(2,'0')+' · '+elementOf(tr);
  $('orr-sign').textContent=tr.sign;
  $('orr-role').textContent=ag?(ag.name+' · '+ag.role):'';
  $('orr-voice').textContent=ag&&ag.greeting?ag.greeting:'';
  var f=LENSES.map(function(l){return{t:l.t.replace(/S$/,''),v:valueOf(tr,l.k),href:l.href(tr,ag),on:l===lens};})
    .concat(EXTRA.map(function(x){return{t:x.t,v:tr[x.k],href:x.href};}));
  $('orr-facets').innerHTML=f.filter(function(x){return x.v;}).map(function(x){
    return '<a class="orr-facet'+(x.on?' lens':'')+'" href="'+esc(x.href)+'"><b>'+esc(x.t)+'</b><span>'+esc(x.v)+'</span></a>';}).join('');
}

/* Drag to spin: the angle of the pointer about the wheel centre, measured at
   event time (the page is revealed by then), snapped to the nearest track. */
function bindGestures(){
  var w=$('orr-wheel'),start=null;
  function ang(e){var r=w.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI;}
  w.addEventListener('pointerdown',function(e){start={a:ang(e),rot:S.rot,moved:0};S.dragged=false;});
  w.addEventListener('pointermove',function(e){
    if(!start)return;var d=ang(e)-start.a;d=((d+540)%360)-180;
    if(Math.abs(d)>4&&!S.dragged){S.dragged=true;w.classList.add('drag');try{w.setPointerCapture(e.pointerId);}catch(_){}}
    if(S.dragged){S.rot=start.rot+d;w.style.setProperty('--rot',S.rot+'deg');}
  });
  function end(){
    if(!start)return;start=null;w.classList.remove('drag');
    if(S.dragged){var n=S.tracks.length,i=Math.round(-S.rot/(360/n));S.sel=((i%n)+n)%n;S.rot=-i*(360/n);paint();
      setTimeout(function(){S.dragged=false;},0);}
  }
  w.addEventListener('pointerup',end);w.addEventListener('pointercancel',end);
  w.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();select(S.sel+1);}
    else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();select(S.sel-1);}
  });
  $('orr-prev').onclick=function(){select(S.sel-1);};
  $('orr-next').onclick=function(){select(S.sel+1);};
  $('orr-mine').onclick=function(){if(S.mine>=0)select(S.mine);};
}

/* The member's own record. Every figure is a real row or a server-computed
   value; a series with fewer than two days draws nothing (omega-sparkline). */
async function loadYou(uid){
  var mm=await sb.rpc('my_matrix');
  var pts=await sb.from('sovereign_points_ledger').select('delta,created_at').eq('user_id',uid).order('created_at',{ascending:true}).limit(1000);
  var evo=await sb.from('evolution_events').select('id',{count:'exact',head:true}).eq('user_id',uid);
  var tk=await sb.from('task_completions').select('id',{count:'exact',head:true}).eq('user_id',uid);
  var shown=false,m=mm.error?null:(mm.data||[])[0];
  if(m){
    shown=true;
    $('you-auth').textContent=Number(m.authority).toFixed(4);
    $('you-node').textContent=Number(m.node).toLocaleString();
    $('you-pct').textContent=Number(m.pct).toFixed(4)+'% OF 104,976';
    var ax=(window.OmegaCanon.structure&&window.OmegaCanon.structure.axes_names)||[];
    $('you-axes').innerHTML=[['A',m.a],['B',m.b],['C',m.c]].map(function(p,i){
      var name=String(ax[i]||p[0]).replace(/\s*\([ABC]\)$/,'').toUpperCase(),v=Number(p[1])||0;
      return '<div class="orr-ax"><span>'+esc(name)+'</span><span class="bar-track"><span class="bar-fill" style="width:'+Math.min(100,v/9*100).toFixed(1)+'%"></span></span><span>'+v.toFixed(2)+'</span></div>';
    }).join('');
  }
  if(!pts.error){
    shown=true;
    var rows=pts.data||[],total=0,days={};
    rows.forEach(function(r){var d=Number(r.delta)||0;total+=d;var k=String(r.created_at).slice(0,10);days[k]=(days[k]||0)+d;});
    $('you-pts').textContent=total.toLocaleString();
    var series=Object.keys(days).sort().slice(-30).map(function(k){return days[k];});
    $('you-spark').setAttribute('data-spark-values',JSON.stringify(series));
  }
  if(!evo.error){shown=true;$('you-evo').textContent=(evo.count||0).toLocaleString();}
  if(!tk.error){shown=true;$('you-tasks').textContent=(tk.count||0).toLocaleString();}
  $('orr-you').hidden=!shown;
}

function start(pr,uid){
  var C=window.OmegaCanon;
  S.tracks=(C.tracks||[]).slice(0,12);
  if(!S.tracks.length)return;
  var mine=C.trackBySign(pr.sign);
  S.mine=mine?S.tracks.indexOf(mine):-1;
  $('orr-mine').hidden=S.mine<0;
  var hash=decodeURIComponent((location.hash||'').slice(1));
  var fromHash=C.trackBySign(hash);
  S.sel=fromHash?S.tracks.indexOf(fromHash):(S.mine>=0?S.mine:0);
  S.rot=-(S.sel/S.tracks.length)*360;
  buildLens();buildElements();buildWheel();bindGestures();paint();
  loadYou(uid).catch(function(e){console.warn('[orrery] member record unavailable',e);});
}

(async function(){
  try{
    var s=(await sb.auth.getSession()).data.session;
    if(!s){location.replace('/account.html');return;}
    var pr=(await sb.from('profiles').select('*').eq('id',s.user.id).maybeSingle()).data||{};
    if(!pr.is_owner&&!pr.access_approved){location.replace('/pending.html');return;}
    if(!pr.is_owner&&pr.is_trial&&pr.trial_expires_at&&new Date(pr.trial_expires_at)<=new Date()){location.replace('/pending.html?expired=1');return;}
    document.getElementById('app').style.display='flex';
    if(window.__omegaPopulate)window.__omegaPopulate(pr,s.user);
    window.__omegaUserLoaded=true;
    var agents=await fetch('/omega-agents.json').then(function(r){return r.json();}).catch(function(){return null;});
    (agents&&agents.agents||[]).forEach(function(a){S.agents[a.sign]=a;});
    var tries=0;
    (function wait(){
      if(window.OmegaCanon&&window.OmegaCanon.onReady)window.OmegaCanon.onReady(function(){start(pr,s.user.id);});
      else if(++tries<200)setTimeout(wait,50);
      else console.warn('[orrery] OmegaCanon never loaded');
    })();
  }catch(e){document.getElementById('app').style.display='flex';console.warn(e);}
})();
