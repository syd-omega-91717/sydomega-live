/* ==========================================================================
   Ω SYD OMEGA 91717 — LATTICE 3D RENDERER
   Pure canvas 3D — no WebGL dependency — always available in browser
   Renders the 9×9×9 inner cube as an isometric 3D lattice
   Click any [data-lattice-3d] element to activate the 3D view
   ========================================================================== */
(function(){

var PHI=1.6180339887;

function draw3DLattice(canvas, nodesEarned, opts){
  opts=opts||{};
  var ctx=canvas.getContext('2d');
  var W=canvas.width, H=canvas.height;
  var N=opts.n||9;          /* grid dimension */
  var cellSize=opts.cell||Math.min(W,H)/(N*2.2);
  var cx=W/2, cy=H*0.38;
  /* Isometric vectors */
  var ix=cellSize, iy=cellSize*0.5;
  var jx=-cellSize,jy=cellSize*0.5;
  var kx=0, ky=-cellSize;

  var t=opts.t||0;
  var anim_t=t*0.003;

  ctx.clearRect(0,0,W,H);

  /* Sort cells back-to-front (painter's algorithm) */
  var cells=[];
  var totalEarned=nodesEarned||0;
  var count=0;
  for(var z=0;z<N;z++)
    for(var y=0;y<N;y++)
      for(var x=0;x<N;x++){
        count++;
        var sx=cx+x*ix+y*jx+z*kx;
        var sy=cy+x*iy+y*jy+z*ky;
        var earned=count<=totalEarned;
        var active=count===totalEarned+1;
        var depth=x+y-z;
        cells.push({x:x,y:y,z:z,sx:sx,sy:sy,depth:depth,earned:earned,active:active,idx:count});
      }
  cells.sort(function(a,b){return a.depth-b.depth;});

  /* Draw cells */
  cells.forEach(function(c){
    var sx=c.sx, sy=c.sy;
    var cs=cellSize*0.82;
    var alpha=c.earned?0.75:c.active?1:0.06;
    var glow=c.active?(0.5+0.5*Math.sin(anim_t*8)):0;
    /* Top face */
    ctx.beginPath();
    ctx.moveTo(sx+cs,sy);
    ctx.lineTo(sx,sy+cs*0.5);
    ctx.lineTo(sx-cs,sy);
    ctx.lineTo(sx,sy-cs*0.5);
    ctx.closePath();
    if(c.active){
      var gr=ctx.createRadialGradient(sx,sy,0,sx,sy,cs);
      gr.addColorStop(0,'rgba(226,200,109,'+(0.9+glow*0.1)+')');
      gr.addColorStop(1,'rgba(201,168,76,'+(0.5+glow*0.3)+')');
      ctx.fillStyle=gr;
    } else if(c.earned){
      ctx.fillStyle='rgba(201,168,76,'+alpha+')';
    } else {
      ctx.fillStyle='rgba(255,255,255,0.03)';
    }
    ctx.fill();
    ctx.strokeStyle=c.active?'rgba(226,200,109,.9)':c.earned?'rgba(201,168,76,.3)':'rgba(201,168,76,.06)';
    ctx.lineWidth=0.5;
    ctx.stroke();
    /* Right face */
    ctx.beginPath();
    ctx.moveTo(sx+cs,sy);
    ctx.lineTo(sx+cs,sy+cs*0.5);
    ctx.lineTo(sx,sy+cs);
    ctx.lineTo(sx,sy+cs*0.5);
    ctx.closePath();
    ctx.fillStyle=c.earned?'rgba(161,128,36,'+alpha*0.7+')':c.active?'rgba(161,128,36,.6)':'rgba(255,255,255,0.01)';
    ctx.fill();
    ctx.strokeStyle=c.earned||c.active?'rgba(201,168,76,.2)':'rgba(201,168,76,.04)';
    ctx.stroke();
    /* Left face */
    ctx.beginPath();
    ctx.moveTo(sx,sy+cs*0.5);
    ctx.lineTo(sx,sy+cs);
    ctx.lineTo(sx-cs,sy+cs*0.5);
    ctx.lineTo(sx-cs,sy);
    ctx.closePath();
    ctx.fillStyle=c.earned?'rgba(120,100,28,'+alpha*0.6+')':c.active?'rgba(120,100,28,.5)':'rgba(255,255,255,0.01)';
    ctx.fill();
    ctx.strokeStyle=c.earned||c.active?'rgba(201,168,76,.15)':'rgba(201,168,76,.03)';
    ctx.stroke();
  });

  /* Omega center glyph */
  ctx.font='bold '+(cellSize*1.2)+'px "Cinzel Decorative",serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='rgba(201,168,76,'+(0.12+0.08*Math.sin(anim_t*2))+')';
  ctx.shadowColor='#C9A84C';ctx.shadowBlur=cellSize;
  ctx.fillText('\u03A9',cx,cy);
  ctx.shadowBlur=0;

  /* Labels */
  ctx.font='bold '+(cellSize*0.45)+'px "Courier Prime",monospace';
  ctx.fillStyle='rgba(201,168,76,.35)';
  ctx.textAlign='center';
  ctx.fillText('9\u00d79\u00d79 \u00b7 729 NODES',cx,H-12);
}

/* ── Modal overlay for 3D view ─────────────────────────────────────── */
function showLattice3D(nodesEarned, systemLabel){
  if(document.getElementById('omega-lattice3d-modal')) return;
  var modal=document.createElement('div');
  modal.id='omega-lattice3d-modal';
  modal.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(2,2,6,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer';
  modal.innerHTML='<div style="font-family:\'Cinzel Decorative\',serif;font-size:12px;letter-spacing:3px;color:rgba(201,168,76,.5);margin-bottom:14px">'+(systemLabel||'\u03A9 SOVEREIGN LATTICE \u00b7 INNER CUBE 9\u00d79\u00d79 = 729 NODES')+'</div>'
    +'<canvas id="lattice3d-cv" style="max-width:90vw;max-height:70vh;display:block;border:1px solid rgba(201,168,76,.15);border-radius:2px"></canvas>'
    +'<div style="font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:2px;color:rgba(138,134,118,.5);margin-top:14px">NODES EARNED: <span style="color:var(--gold,#C9A84C)">'+nodesEarned+'</span> \u00b7 CLICK ANYWHERE TO CLOSE</div>';
  document.body.appendChild(modal);
  var cv=document.getElementById('lattice3d-cv');
  var S=Math.min(window.innerWidth*0.85,window.innerHeight*0.65,600);
  cv.width=Math.floor(S); cv.height=Math.floor(S*0.85);
  var t=0;
  var raf;
  function frame(){
    draw3DLattice(cv,nodesEarned,{t:t,cell:Math.min(cv.width,cv.height)/(9*2.4)});
    t++; raf=requestAnimationFrame(frame);
  }
  frame();
  modal.addEventListener('click',function(){
    cancelAnimationFrame(raf);
    document.body.removeChild(modal);
  });
}
window.__showLattice3D=showLattice3D;

/* ── Wire click handlers to all [data-lattice] and [data-lattice-3d] ─ */
function wireClicks(){
  document.querySelectorAll('[data-lattice],[data-lattice-3d],[id*="lattice"]').forEach(function(el){
    if(el._lattice3dWired) return;
    el._lattice3dWired=true;
    el.style.cursor='pointer';
    el.title='Click to view 3D lattice';
    el.addEventListener('click',function(e){
      e.stopPropagation();
      var nodes=parseInt(el.getAttribute('data-nodes')||window.__omegaProfile&&window.__omegaProfile.nodes_earned||0);
      var sys=el.getAttribute('data-lattice')||'canonical';
      var sysLabel=({kings:'28\u00d728\u00d79\u00d79\u00d79 = 571,536 \u00b7 KINGS SYSTEM',microservices:'21\u00d721\u00d79\u00d79\u00d79 = 321,489 \u00b7 MICROSERVICES',modules:'18\u00d718\u00d79\u00d79\u00d79 = 236,196 \u00b7 MODULES',canonical:'12\u00d712\u00d79\u00d79\u00d79 = 104,976 \u00b7 CANONICAL',ninefold:'9\u00d79\u00d79\u00d79\u00d79 = 59,049 \u00b7 NINE-FOLD',plane:'9\u00d79\u00d79 = 729 \u00b7 THE PLANE'})[sys]||'\u03A9 SOVEREIGN LATTICE';
      showLattice3D(nodes,'\u03A9 '+sysLabel.toUpperCase());
    });
  });
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',wireClicks);
} else { wireClicks(); }
document.addEventListener('omega:populated',wireClicks);

})();
