/* ==========================================================================
   Ω SYD OMEGA 91717 — LATTICE RENDERER
   Renders the multi-dimensional sovereign lattice grid
   Dimensions per context:
     28×28×9³ = 571,536  (Kings system)
     21×21×9³ = 321,489  (Microservices)
     18×18×9³ = 236,196  (Modules)
     12×12×9³ = 104,976  (Canonical platform — 12 tracks)
     9×9×9³   =  59,049  (Nine-fold)
     9³        =     729  (Inner cube — the PLANE)
   Auth formula: sqrt(A³+B³+C³)×φ/e  APEX=27.8367
   ========================================================================== */
(function(){

var SYSTEMS={
  kings:        {outer:28,total:28*28*9*9*9, label:'28\u00d728\u00d79\u00d79\u00d79 = 571,536'},
  microservices:{outer:21,total:21*21*9*9*9, label:'21\u00d721\u00d79\u00d79\u00d79 = 321,489'},
  modules:      {outer:18,total:18*18*9*9*9, label:'18\u00d718\u00d79\u00d79\u00d79 = 236,196'},
  canonical:    {outer:12,total:12*12*9*9*9, label:'12\u00d712\u00d79\u00d79\u00d79 = 104,976'},
  ninefold:     {outer:9, total:9*9*9*9*9,   label:'9\u00d79\u00d79\u00d79\u00d79 = 59,049'},
  plane:        {outer:9, total:9*9*9,        label:'9\u00d79\u00d79 = 729'},
};

/* ── Render a 9×9 inner lattice plane ──────────────────────────────── */
window.renderLattice9x9 = function(el, nodesEarned, opts){
  if(!el) return;
  opts=opts||{};
  var total=opts.total||81;
  var goldColor=opts.goldColor||'rgba(201,168,76,.35)';
  var activeColor=opts.activeColor||'rgba(201,168,76,.6)';
  var pct=nodesEarned/total;
  var earned=Math.floor(pct*81);
  var html='';
  for(var row=0;row<9;row++){
    html+='<div style="display:flex;gap:2px;margin-bottom:2px">';
    for(var col=0;col<9;col++){
      var idx=row*9+col;
      var isEarned=idx<earned;
      var isActive=idx===earned;
      var style='width:clamp(14px,2vw,22px);height:clamp(14px,2vw,22px);border-radius:1px;transition:all .2s;cursor:default;';
      if(isActive){
        style+='background:'+activeColor+';border:1px solid rgba(201,168,76,.8);box-shadow:0 0 6px rgba(201,168,76,.4);';
      } else if(isEarned){
        style+='background:'+goldColor+';border:1px solid rgba(201,168,76,.3);';
      } else {
        style+='background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.05);';
      }
      html+='<div style="'+style+'" title="Node '+(idx+1)+'/81"></div>';
    }
    html+='</div>';
  }
  el.innerHTML=html;
};

/* ── Render an outer track grid (N×N) ─────────────────────────────── */
window.renderTrackGrid = function(el, system, nodesEarned, opts){
  if(!el) return;
  opts=opts||{};
  var sys=SYSTEMS[system]||SYSTEMS.canonical;
  var N=sys.outer;
  var totalOuter=N*N;
  var nodesPerCell=sys.total/totalOuter;  /* = 729 inner per cell */
  var cellsEarned=Math.floor(nodesEarned/nodesPerCell);
  var html='<div style="display:grid;grid-template-columns:repeat('+N+',1fr);gap:1px;max-width:100%;overflow:hidden">';
  for(var i=0;i<totalOuter;i++){
    var done=i<cellsEarned;
    var active=i===cellsEarned;
    var pct2=done?100:active?((nodesEarned%nodesPerCell)/nodesPerCell*100):0;
    var bg=done?'rgba(201,168,76,.25)':'rgba(255,255,255,.02)';
    if(active) bg='rgba(201,168,76,.'+Math.floor(pct2/100*35+5)+')';
    html+='<div style="aspect-ratio:1;background:'+bg+';border:1px solid rgba(201,168,76,.06);border-radius:1px;transition:.3s" title="Track '+(i+1)+'/'+(totalOuter)+'"></div>';
  }
  html+='</div>';
  html+='<div style="font-family:\'Courier Prime\',monospace;font-size:7px;letter-spacing:2px;color:rgba(138,134,118,.5);margin-top:6px;text-align:center">'+sys.label+'</div>';
  el.innerHTML=html;
};

/* ── Auto-init: find [data-lattice] elements ─────────────────────────── */
function initLattices(){
  document.querySelectorAll('[data-lattice]').forEach(function(el){
    var system=el.getAttribute('data-lattice')||'canonical';
    var nodes=parseInt(el.getAttribute('data-nodes')||'0');
    if(system==='plane'||system==='9x9'){
      window.renderLattice9x9(el,nodes,{total:729});
    } else {
      window.renderTrackGrid(el,system,nodes);
    }
  });
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',initLattices);
} else { initLattices(); }
document.addEventListener('omega:populated',function(){
  var pr=window.__omegaProfile;
  if(!pr) return;
  var nodes=Number(pr.nodes_earned||0);
  document.querySelectorAll('[data-lattice]').forEach(function(el){
    var system=el.getAttribute('data-lattice')||'canonical';
    el.setAttribute('data-nodes',nodes);
    if(system==='plane'||system==='9x9'){
      window.renderLattice9x9(el,nodes,{total:729});
    } else {
      window.renderTrackGrid(el,system,nodes);
    }
  });
});

window.OmegaLattice=SYSTEMS;

})();
