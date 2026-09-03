/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN SHARE CARD ENGINE (omega-share-card.js)

   Generates a high-resolution 1200×630 canvas identity card for each member
   displaying their authority index, axis values, tier, gate, and cosmological
   chain. Cards can be downloaded as PNG or shared via the Web Share API.

   Public API:
     OmegaShareCard.render(canvas, profile)          — draw card onto canvas
     OmegaShareCard.download(profile, filename?)     — download PNG
     OmegaShareCard.share(profile, title?, text?)    — native share / clipboard
     OmegaShareCard.createCard(profile)              — returns offscreen canvas
     OmegaShareCard.showModal(profile)               — show preview modal
   ========================================================================== */
(function(){
  'use strict';
  if(window.OmegaShareCard) return;

  var W=1200, H=630;
  var PHI=1.6180339887, EU=2.7182818285;
  var GATES=[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.5170,27.8367];
  var GNAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT','SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX'];

  /* ── HELPERS ─────────────────────────────────────────────────────────── */
  function calcAuth(pr){
    if(pr.is_owner) return 27.8367;
    var a=Number(pr.axis_a||0.001),b=Number(pr.axis_b||0.001),c=Number(pr.axis_c||0.001);
    return Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
  }
  function gateName(auth){
    var i=GATES.findIndex(function(g){return auth<g;});
    return i<0?'APEX':GNAMES[i];
  }
  function gateIndex(auth){
    return GATES.findIndex(function(g){return auth<g;});
  }

  /* round-rect helper */
  function rrect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }

  /* ── MAIN RENDERER ───────────────────────────────────────────────────── */
  function render(canvas, pr){
    if(!canvas || !canvas.getContext) return;
    canvas.width  = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    var auth  = calcAuth(pr);
    var gate  = gateName(auth);
    var gIdx  = gateIndex(auth);
    var a     = pr.is_owner ? 9 : Number(pr.axis_a||0.001);
    var b     = pr.is_owner ? 9 : Number(pr.axis_b||0.001);
    var c     = pr.is_owner ? 9 : Number(pr.axis_c||0.001);
    var name  = pr.is_owner ? 'MAJOR SLEIMAN YOUSSEF DAGHER' : (pr.display_name||'SOVEREIGN MEMBER').toUpperCase();
    var tier  = pr.is_owner ? 'SOVEREIGN ARCHITECT' : (pr.subscription_tier||'FREE').toUpperCase();
    var sign  = (pr.sign  || 'AWAITING ASSIGNMENT').toUpperCase();
    var elem  = (pr.element||'AWAITING ASSIGNMENT').toUpperCase();
    var god   = (pr.god   || 'AWAITING ASSIGNMENT').toUpperCase();
    var agent = (pr.agent || 'AWAITING ASSIGNMENT').toUpperCase();
    var token = (pr.token || 'AWAITING ASSIGNMENT').toUpperCase();

    /* ─── 1. BACKGROUND ────────────────────────────────────────────── */
    var bg = ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#07070F');
    bg.addColorStop(0.5,'#0A0A15');
    bg.addColorStop(1,'#060610');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);

    /* ─── 2. GRID PATTERN (subtle) ──────────────────────────────────── */
    ctx.strokeStyle = 'rgba(201,168,76,.04)';
    ctx.lineWidth   = 1;
    for(var x=0;x<W;x+=40){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
    for(var y=0;y<H;y+=40){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke(); }

    /* ─── 3. RADIAL GLOW ────────────────────────────────────────────── */
    var glow = ctx.createRadialGradient(W*0.72,H*0.42,0,W*0.72,H*0.42,W*0.38);
    glow.addColorStop(0,'rgba(201,168,76,.07)');
    glow.addColorStop(1,'rgba(201,168,76,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,W,H);

    /* ─── 4. OUTER CARD BORDER ──────────────────────────────────────── */
    ctx.strokeStyle = 'rgba(201,168,76,.35)';
    ctx.lineWidth   = 1.5;
    rrect(ctx,12,12,W-24,H-24,6);
    ctx.stroke();
    /* gold top bar */
    ctx.fillStyle = '#C9A84C';
    ctx.fillRect(12,12,W-24,3);

    /* ─── 5. OMEGA EMBLEM (left column) ─────────────────────────────── */
    var emx=96, emy=H*0.44, emR=76;
    /* outer orbit */
    ctx.beginPath();ctx.arc(emx,emy,emR,0,Math.PI*2);
    ctx.strokeStyle='rgba(201,168,76,.18)';ctx.lineWidth=1;ctx.stroke();
    /* inner ring */
    ctx.beginPath();ctx.arc(emx,emy,emR*0.56,0,Math.PI*2);
    ctx.strokeStyle='rgba(201,168,76,.28)';ctx.lineWidth=0.8;ctx.stroke();
    /* 4 cardinal ticks */
    [0,Math.PI/2,Math.PI,Math.PI*1.5].forEach(function(angle){
      var ix=emx+Math.cos(angle)*(emR-8), iy=emy+Math.sin(angle)*(emR-8);
      var ox=emx+Math.cos(angle)*emR,     oy=emy+Math.sin(angle)*emR;
      ctx.beginPath();ctx.moveTo(ix,iy);ctx.lineTo(ox,oy);
      ctx.strokeStyle='rgba(201,168,76,.55)';ctx.lineWidth=2;ctx.stroke();
    });
    /* orbital dots at 45° intervals */
    for(var d=0;d<8;d++){
      var da=d*Math.PI/4;
      ctx.beginPath();ctx.arc(emx+Math.cos(da)*emR*0.78, emy+Math.sin(da)*emR*0.78, 2.5,0,Math.PI*2);
      ctx.fillStyle=d%2?'rgba(226,200,109,.6)':'rgba(201,168,76,.4)';ctx.fill();
    }
    /* Ω glyph */
    var ofs = ctx.measureText('Ω');
    ctx.font       = 'bold 52px "Cinzel Decorative",serif';
    ctx.textAlign  = 'center';
    ctx.textBaseline='middle';
    ctx.fillStyle  = '#C9A84C';
    ctx.shadowColor='#C9A84C';
    ctx.shadowBlur = 20;
    ctx.fillText('Ω', emx, emy);
    ctx.shadowBlur = 0;

    /* ─── 6. LEFT DIVIDER ───────────────────────────────────────────── */
    ctx.strokeStyle='rgba(201,168,76,.15)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(192,36);ctx.lineTo(192,H-36);ctx.stroke();

    /* ─── 7. RIGHT PANEL — header area ──────────────────────────────── */
    var rx=218, ry=52;

    /* Platform label */
    ctx.font='500 11px "Courier Prime",monospace';
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillStyle='rgba(138,134,118,.6)';
    ctx.letterSpacing='3px';
    ctx.fillText('SYD OMEGA 91717  ·  SOVEREIGN IDENTITY CARD  ·  CLASSIFIED', rx, ry);

    /* Name */
    ctx.font='700 '+Math.min(36, Math.floor(44*1.0/(Math.max(name.length,10)/10)))+'px "Cinzel Decorative",serif';
    ctx.fillStyle='#E2C86D';
    ctx.shadowColor='rgba(226,200,109,.35)';ctx.shadowBlur=8;
    ctx.fillText(name.slice(0,36)+(name.length>36?'…':''), rx, ry+24);
    ctx.shadowBlur=0;

    /* Title / Tier */
    if(pr.is_owner){
      ctx.font='11px "Courier Prime",monospace';
      ctx.fillStyle='rgba(0,229,255,.8)';
      ctx.fillText('ARCHITECT & SOVEREIGN FOUNDER', rx, ry+78);
    } else {
      ctx.font='11px "Courier Prime",monospace';
      ctx.fillStyle='rgba(0,229,255,.8)';
      ctx.fillText(tier, rx, ry+78);
    }

    /* ─── 8. AUTHORITY BLOCK ─────────────────────────────────────────── */
    var abx=rx, aby=ry+108;

    /* background panel */
    rrect(ctx,abx,aby,220,84,3);
    var abg=ctx.createLinearGradient(abx,aby,abx+220,aby+84);
    abg.addColorStop(0,'rgba(201,168,76,.12)');
    abg.addColorStop(1,'rgba(201,168,76,.04)');
    ctx.fillStyle=abg;ctx.fill();
    ctx.strokeStyle='rgba(201,168,76,.4)';ctx.lineWidth=1;ctx.stroke();

    ctx.font='9px "Courier Prime",monospace';
    ctx.fillStyle='rgba(138,134,118,.7)';
    ctx.fillText('AUTHORITY INDEX  ·  sqrt(A³+B³+C³)×φ/e', abx+12, aby+12);

    ctx.font='bold 40px "Cinzel Decorative",serif';
    ctx.fillStyle='#C9A84C';
    ctx.shadowColor='#C9A84C';ctx.shadowBlur=14;
    ctx.fillText(auth.toFixed(4), abx+12, aby+28);
    ctx.shadowBlur=0;

    /* Gate badge */
    var gateColor=gIdx<0?'#C9A84C':
                  gIdx<3?'rgba(138,134,118,.8)':
                  gIdx<6?'#C9A84C':
                  gIdx<9?'#9B6BF0':'#E2C86D';
    rrect(ctx,abx+12,aby+58,80,17,2);
    ctx.fillStyle='rgba(201,168,76,.1)';ctx.fill();
    ctx.strokeStyle=gateColor;ctx.lineWidth=0.8;ctx.stroke();
    ctx.font='8px "Courier Prime",monospace';
    ctx.fillStyle=gateColor;
    ctx.fillText(gate, abx+52, aby+68);
    ctx.textAlign='left';

    /* ─── 9. AXIS BARS ───────────────────────────────────────────────── */
    var barX=rx, barY=aby+106;
    var barW=480;
    var axes=[
      {label:'AXIS A · KNOWLEDGE', val:a, col:'#00E5FF'},
      {label:'AXIS B · MASTERY',   val:b, col:'#9B6BF0'},
      {label:'AXIS C · CONTRIBUTION',val:c,col:'#3fb27f'},
    ];
    axes.forEach(function(ax,i){
      var y=barY+i*36;
      ctx.font='9px "Courier Prime",monospace';
      ctx.fillStyle='rgba(138,134,118,.7)';
      ctx.textAlign='left';
      ctx.fillText(ax.label, barX, y);

      var val=Number(ax.val)||0;
      var fillW=(val/9)*barW;

      /* track */
      rrect(ctx,barX,y+12,barW,8,4);
      ctx.fillStyle='rgba(255,255,255,.04)';ctx.fill();

      /* fill */
      rrect(ctx,barX,y+12,Math.max(fillW,4),8,4);
      var grad=ctx.createLinearGradient(barX,0,barX+fillW,0);
      grad.addColorStop(0,ax.col);
      grad.addColorStop(1,ax.col.replace(')',',0.4)').replace('rgb','rgba'));
      ctx.fillStyle=grad;ctx.fill();

      /* value */
      ctx.font='bold 11px "Cinzel Decorative",serif';
      ctx.fillStyle=ax.col;
      ctx.textAlign='right';
      ctx.fillText(val.toFixed(3), barX+barW+46, y+20);
    });

    /* ─── 10. COSMOLOGY CHAIN ────────────────────────────────────────── */
    var cosY=barY+118;
    ctx.strokeStyle='rgba(201,168,76,.12)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(rx,cosY);ctx.lineTo(W-32,cosY);ctx.stroke();

    var chain=[sign,elem,god,agent,token];
    var chainColors=['#E2C86D','#C9A84C','rgba(226,200,109,.8)','rgba(201,168,76,.7)','rgba(201,168,76,.5)'];
    var cx=rx+2;
    ctx.font='9px "Courier Prime",monospace';
    chain.forEach(function(item,i){
      ctx.fillStyle=chainColors[i];
      ctx.textAlign='left';
      ctx.fillText(item, cx, cosY+16);
      var mw=ctx.measureText(item).width;
      if(i<chain.length-1){
        ctx.fillStyle='rgba(138,134,118,.3)';
        ctx.fillText('  ·  ', cx+mw, cosY+16);
        cx+=mw+ctx.measureText('  ·  ').width;
      }
    });

    /* ─── 11. BOTTOM STAT ROW ────────────────────────────────────────── */
    var bsY=H-70;
    ctx.strokeStyle='rgba(201,168,76,.12)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(rx,bsY);ctx.lineTo(W-32,bsY);ctx.stroke();

    var stats=[
      {label:'NODES',val:pr.is_owner?'104,976':(Number(pr.nodes_earned||0)).toLocaleString()},
      {label:'TROPHIES',val:pr.is_owner?'12':String(pr.trophies_earned||0)},
      {label:'MEDALS',val:pr.is_owner?'12':String(pr.medals_earned||0)},
      {label:'CERTS',val:pr.is_owner?'12':String(pr.certificates_earned||0)},
      {label:'GATE',val:(gIdx<0?12:gIdx+1)+'/12'},
    ];
    var sw=(W-rx-32)/stats.length;
    stats.forEach(function(st,i){
      var sx=rx+i*sw+sw/2;
      ctx.font='bold 14px "Cinzel Decorative",serif';
      ctx.textAlign='center';
      ctx.fillStyle='#C9A84C';
      ctx.fillText(st.val, sx, bsY+20);
      ctx.font='7.5px "Courier Prime",monospace';
      ctx.fillStyle='rgba(138,134,118,.6)';
      ctx.fillText(st.label, sx, bsY+34);
    });

    /* ─── 12. LEFT COLUMN — lower text ──────────────────────────────── */
    ctx.textAlign='center';
    ctx.font='8px "Courier Prime",monospace';
    ctx.fillStyle='rgba(138,134,118,.5)';
    ctx.fillText('AUTHORITY', emx, emy-emR-18);

    /* node ring (simplified auth ring below emblem) */
    var ringY=emy+emR+24;
    var pct=auth/27.8367;
    var arcStart=-Math.PI/2;
    var arcEnd=arcStart+(Math.PI*2*pct);
    /* track */
    ctx.beginPath();ctx.arc(emx,ringY+26,22,0,Math.PI*2);
    ctx.strokeStyle='rgba(201,168,76,.1)';ctx.lineWidth=3;ctx.stroke();
    /* fill */
    ctx.beginPath();ctx.arc(emx,ringY+26,22,arcStart,arcEnd);
    ctx.strokeStyle='#C9A84C';ctx.lineWidth=3;ctx.lineCap='round';ctx.stroke();
    ctx.lineCap='butt';

    /* ─── 13. WATERMARK / FOOTER ─────────────────────────────────────── */
    ctx.textAlign='left';
    ctx.font='8px "Courier Prime",monospace';
    ctx.fillStyle='rgba(138,134,118,.25)';
    ctx.fillText('sydomega.com  ·  AUTH=sqrt(A³+B³+C³)×φ/e  ·  APEX=27.8367  ·  © 2025 SYD OMEGA 91717', rx, H-16);

    /* ─── 14. ID REFERENCE (top-right corner) ────────────────────────── */
    ctx.textAlign='right';
    ctx.font='9px "Courier Prime",monospace';
    ctx.fillStyle='rgba(138,134,118,.35)';
    ctx.fillText('Ω-91717-SYD  ·  '+new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase(), W-28, ry);

    return canvas;
  }

  /* ── CREATE OFF-SCREEN CANVAS ────────────────────────────────────────── */
  function createCard(pr){
    var cv=document.createElement('canvas');
    render(cv,pr);
    return cv;
  }

  /* ── DOWNLOAD ────────────────────────────────────────────────────────── */
  function download(pr, filename){
    var cv=createCard(pr);
    var link=document.createElement('a');
    link.download=filename||'omega-authority-card.png';
    link.href=cv.toDataURL('image/png');
    link.click();
    if(window.OmegaNotify&&window.OmegaNotify.showToast){
      window.OmegaNotify.showToast('Sovereign card downloaded.','success');
    }
  }

  /* ── SHARE ───────────────────────────────────────────────────────────── */
  function share(pr, title, text){
    var cv=createCard(pr);
    var auth=calcAuth(pr);
    var name=pr.is_owner?'MAJOR SLEIMAN YOUSSEF DAGHER':(pr.display_name||'SOVEREIGN MEMBER').toUpperCase();
    var t=title||('Ω SYD OMEGA 91717 — '+name+' · AUTH '+auth.toFixed(4));
    var tx=text||('Sovereign authority: '+auth.toFixed(4)+' ('+gateName(auth)+') · '+location.origin);

    cv.toBlob(function(blob){
      if(navigator.share && blob){
        var file=new File([blob],'omega-card.png',{type:'image/png'});
        navigator.share({title:t, text:tx, files:[file]}).catch(function(){
          /* fallback to URL share without file */
          navigator.share({title:t,text:tx,url:location.href}).catch(function(){});
        });
      } else if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(tx+'  '+location.href).then(function(){
          if(window.OmegaNotify&&window.OmegaNotify.showToast){
            window.OmegaNotify.showToast('Authority link copied to clipboard.','success');
          }
        });
      }
    },'image/png');
  }

  /* ── MODAL PREVIEW ───────────────────────────────────────────────────── */
  function showModal(pr){
    /* Inject CSS once */
    if(!document.getElementById('osc-css')){
      var s=document.createElement('style');
      s.id='osc-css';
      s.textContent=[
        '#osc-overlay{position:fixed;inset:0;z-index:99999;background:rgba(2,2,6,.92);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)}',
        '#osc-modal{background:#0A0A0F;border:1px solid rgba(201,168,76,.3);border-top:2px solid #C9A84C;padding:24px;max-width:680px;width:100%;border-radius:2px}',
        '#osc-canvas{width:100%;height:auto;display:block;border:1px solid rgba(201,168,76,.15);border-radius:2px;margin-bottom:16px}',
        '.osc-btn-row{display:flex;gap:10px;flex-wrap:wrap}',
        '.osc-btn{font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:2px;padding:9px 18px;border:1px solid;cursor:pointer;transition:.15s;border-radius:1px;background:transparent}',
        '.osc-dl{color:#C9A84C;border-color:#C9A84C}.osc-dl:hover{background:#C9A84C;color:#0A0A0F}',
        '.osc-sh{color:rgba(0,229,255,.8);border-color:rgba(0,229,255,.4)}.osc-sh:hover{background:rgba(0,229,255,.08)}',
        '.osc-cl{color:rgba(138,134,118,.6);border-color:rgba(138,134,118,.2);margin-left:auto}.osc-cl:hover{border-color:rgba(138,134,118,.5);color:rgba(138,134,118,.9)}',
        '#osc-head{font-family:"Cinzel Decorative",serif;font-size:12px;color:#C9A84C;letter-spacing:3px;margin-bottom:14px}',
        '#osc-sub{font-family:"Courier Prime",monospace;font-size:12px;color:rgba(138,134,118,.6);letter-spacing:1.5px;margin-bottom:14px}',
      ].join('');
      document.head.appendChild(s);
    }
    var overlay=document.createElement('div');
    overlay.id='osc-overlay';
    overlay.innerHTML=[
      '<div id="osc-modal" role="dialog" aria-modal="true" aria-label="Sovereign Authority Card">',
        '<div id="osc-head">&#937; SOVEREIGN AUTHORITY CARD</div>',
        '<div id="osc-sub">SHARE YOUR SOVEREIGN IDENTITY &middot; AUTH=sqrt(A&#179;+B&#179;+C&#179;)&times;&phi;/e</div>',
        '<canvas id="osc-canvas" width="1200" height="630"></canvas>',
        '<div class="osc-btn-row">',
          '<button class="osc-btn osc-dl" id="osc-dl">&#8659; DOWNLOAD PNG</button>',
          '<button class="osc-btn osc-sh" id="osc-sh">&#8679; SHARE</button>',
          '<button class="osc-btn osc-cl" id="osc-cl">&times; CLOSE</button>',
        '</div>',
      '</div>',
    ].join('');
    document.body.appendChild(overlay);

    render(document.getElementById('osc-canvas'), pr);

    document.getElementById('osc-dl').addEventListener('click',function(){ download(pr); });
    document.getElementById('osc-sh').addEventListener('click',function(){ share(pr); });
    function close(){
      if(overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    document.getElementById('osc-cl').addEventListener('click', close);
    overlay.addEventListener('click',function(e){ if(e.target===overlay) close(); });
    document.addEventListener('keydown',function esc(e){
      if(e.key==='Escape'){ close(); document.removeEventListener('keydown',esc); }
    },{once:true});

    /* a11y: trap focus on close button */
    setTimeout(function(){ var cl=document.getElementById('osc-cl');if(cl)cl.focus(); },50);
  }

  /* ── PUBLIC API ──────────────────────────────────────────────────────── */
  window.OmegaShareCard = {
    render:     render,
    createCard: createCard,
    download:   download,
    share:      share,
    showModal:  showModal,
    calcAuth:   calcAuth,
    gateName:   gateName,
  };
})();
