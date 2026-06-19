/* SYD OMEGA 91717 - per-page living emblem.
   Each page renders its own cinematic, rotative, pointer-reactive sign into the header.
   Auto-loaded by bg.js on every app page. Honors reduced-motion. */
(function(){
  if (document.getElementById('omega-emblem-wrap')) return;
  if (window.innerWidth < 560) return; // keep mobile headers clean
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var side = document.getElementById('omega-side');
  var key = (side && side.getAttribute('data-page')) || (location.pathname.split('/').pop()||'').replace('.html','') || 'dashboard';

  // key -> [motif, n, color, glyph, label]
  var MAP={
    dashboard:['orb',3,'#E2C86D','\u03A9','COMMAND'],
    beacon:['rays',12,'#00E5FF','\u2726','THE BEACON'],
    notifications:['ring',6,'#00E5FF','\u25C9','THE WIRE \u00B7 ALERTS'],
    search:['orbit',2,'#00E5FF','\u25C9','THE LENS'],
    profile:['ring',1,'#C9A84C','\u25C8','THE SELF'],
    passport:['poly',5,'#E2C86D','\u273A','THE SEAL'],
    ascension:['arc',9,'#C9A84C','\u25B2','THE ASCENT'],
    intelligence:['ring',3,'#E2C86D','\u25CF','THE ANALYTICS'],
    gates:['ring',12,'#00E5FF','\u2302','THE TWELVE PORTALS'],
    kings:['ring',28,'#E2C86D','\u265B','THE 28 CROWNS'],
    matrix:['poly',3,'#00E5FF','\u25C7','THE 729'],
    triads:['poly',3,'#C9A84C','\u25B3','THE TWELVE TRIADS'],
    agents:['ring',12,'#00E5FF','\u25C9','THE TWELVE MINDS'],
    chatbot:['orbit',3,'#00E5FF','\u2756','THE CONCIERGE'],
    honors:['ring',8,'#E2C86D','\u272A','THE HONORS'],
    horoscope:['ring',12,'#C9A84C','\u2609','THE WHEEL'],
    pantheons:['orbit',4,'#E2C86D','\u2736','FOUR TRADITIONS'],
    elements:['orbit',5,'#E86A3A','\u2738','THE FIVE ELEMENTS'],
    academy:['poly',4,'#00E5FF','\u2726','THE DISCIPLINES'],
    gaming:['poly',6,'#E86A3A','\u2316','THE ARENA'],
    contributions:['ring',3,'#3fb27f','\u2742','THE THIRD AXIS'],
    consultancy:['arc',5,'#00E5FF','\u2756','THE COUNSEL'],
    contracts:['poly',5,'#C9A84C','\u00A7','THE COMMISSIONS'],
    media:['ring',8,'#C9A84C','\u25CE','THE CODEX'],
    cinema:['ring',9,'#8B0000','\u25A3','THE SAGA'],
    news:['rays',8,'#00E5FF','\u224B','THE WIRE'],
    social:['ring',6,'#00E5FF','\u2733','THE SHARE'],
    publishing:['poly',4,'#E2C86D','\u2767','THE ARCHIVE'],
    marketing:['rays',6,'#E2C86D','\u27A4','THE REACH'],
    treasury:['ring',6,'#C9A84C','\u03A9','THE VAULT'],
    blockchain:['ring',12,'#00E5FF','\u2B21','THE CHAIN'],
    wallet:['poly',6,'#E2C86D','\u25C8','THE WALLET'],
    membership:['arc',9,'#C9A84C','\u2726','THE TIERS'],
    marketplace:['orbit',2,'#00E5FF','\u21C4','THE MARKET'],
    sigil:['ring',1,'#E2C86D','\u2736','THE SIGILS'],
    family:['poly',3,'#3fb27f','\u22D4','THE BLOODLINE'],
    hall:['arc',5,'#C9A84C','\u2766','THE HALL'],
    sovereigns:['ring',3,'#E2C86D','\u265B','THE RANKED'],
    factions:['ring',12,'#00E5FF','\u2756','THE TWELVE HOUSES'],
    settings:['poly',6,'#A9C2D8','\u2699','CONTROLS'],
    charter:['ring',11,'#C9A84C','\u00A7','THE ARTICLES']
  };
  var spec = MAP[key] || ['orb',3,'#C9A84C','\u03A9','THE ORDER'];
  var motif=spec[0], N=spec[1], COL=spec[2], GLY=spec[3], LABEL=spec[4];

  var host = document.querySelector('.topbar');
  var pinned = !!host;
  if(!host) host = document.querySelector('.main') || document.body;
  if(getComputedStyle(host).position==='static') host.style.position='relative';

  var wrap=document.createElement('div'); wrap.id='omega-emblem-wrap';
  wrap.style.cssText='position:absolute;top:'+(pinned?'2px':'18px')+';right:0;display:flex;flex-direction:column;align-items:center;gap:5px;z-index:3;pointer-events:auto';
  var size=64;
  var cv=document.createElement('canvas'); cv.width=size*2; cv.height=size*2; cv.style.cssText='width:'+size+'px;height:'+size+'px;display:block';
  var lab=document.createElement('div'); lab.textContent=LABEL;
  lab.style.cssText='font-family:var(--mono,monospace);font-size:7px;letter-spacing:2px;color:var(--muted,#85837b);text-align:center;max-width:96px;line-height:1.3';
  wrap.appendChild(cv); wrap.appendChild(lab); host.appendChild(wrap);

  var x=cv.getContext('2d'); x.scale(2,2);
  var cx=size/2, cy=size/2, R=size*0.34;
  var t=0, hover=0, mx=0, my=0;
  wrap.addEventListener('mouseenter',function(){ hover=1; });
  wrap.addEventListener('mouseleave',function(){ hover=0; });
  window.addEventListener('mousemove',function(e){ var r=cv.getBoundingClientRect(); mx=(e.clientX-(r.left+r.width/2))/40; my=(e.clientY-(r.top+r.height/2))/40; });

  function hex(c,a){
    var n=parseInt(c.slice(1),16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
  }
  function glyph(){
    x.save(); x.translate(cx,cy);
    x.fillStyle=COL; x.font='700 '+(size*0.28)+'px "Cinzel Decorative", serif'; x.textAlign='center'; x.textBaseline='middle';
    x.shadowColor=hex(COL,0.7); x.shadowBlur=10+hover*8; x.fillText(GLY,0,1); x.shadowBlur=0; x.restore();
  }
  function draw(){
    x.clearRect(0,0,size,size);
    var sp=t*(1+hover*1.6);
    var tiltX=Math.max(-6,Math.min(6,mx)), tiltY=Math.max(-6,Math.min(6,my));
    x.save(); x.translate(tiltX*0.3,tiltY*0.3);

    if(motif==='ring'){
      x.strokeStyle=hex(COL,0.18); x.lineWidth=1; x.beginPath(); x.arc(cx,cy,R,0,7); x.stroke();
      for(var i=0;i<N;i++){ var a=sp+i*2*Math.PI/N; var px=cx+Math.cos(a)*R, py=cy+Math.sin(a)*R;
        var d=0.5+0.5*Math.sin(sp*2+i); x.beginPath(); x.arc(px,py,1.6+d*1.2,0,7); x.fillStyle=hex(COL,0.5+d*0.5); x.shadowColor=hex(COL,0.6); x.shadowBlur=6; x.fill(); }
      x.shadowBlur=0;
    } else if(motif==='poly'){
      for(var k=0;k<2;k++){ var rot=sp*(k?-1:1), rr=R*(k?0.6:1); x.beginPath();
        for(var i2=0;i2<N;i2++){ var a2=-Math.PI/2+rot+i2*2*Math.PI/N; var px2=cx+Math.cos(a2)*rr, py2=cy+Math.sin(a2)*rr; if(i2===0)x.moveTo(px2,py2);else x.lineTo(px2,py2); }
        x.closePath(); x.strokeStyle=hex(COL,0.5-k*0.2); x.lineWidth=1.2; x.stroke(); }
    } else if(motif==='orbit'){
      for(var k3=0;k3<N;k3++){ var rot3=sp*(k3%2?-1:1)+k3*0.6; x.save(); x.translate(cx,cy); x.rotate(rot3);
        x.beginPath(); x.ellipse(0,0,R*(1-k3*0.12),R*0.4,0,0,7); x.strokeStyle=hex(COL,0.4-k3*0.06); x.lineWidth=1; x.stroke();
        var px3=Math.cos(rot3*2)*R*(1-k3*0.12); x.beginPath(); x.arc(px3,0,1.8,0,7); x.fillStyle=hex(COL,0.9); x.fill(); x.restore(); }
    } else if(motif==='rays'){
      for(var i4=0;i4<N;i4++){ var a4=sp*0.6+i4*2*Math.PI/N; var len=R*(0.6+0.4*Math.sin(sp*2+i4));
        x.beginPath(); x.moveTo(cx+Math.cos(a4)*6,cy+Math.sin(a4)*6); x.lineTo(cx+Math.cos(a4)*len,cy+Math.sin(a4)*len);
        x.strokeStyle=hex(COL,0.45); x.lineWidth=1.4; x.stroke(); }
    } else if(motif==='arc'){
      for(var i5=0;i5<N;i5++){ var rr5=R*(0.4+0.6*i5/N); var st=sp*(1+i5*0.1)+i5; x.beginPath(); x.arc(cx,cy,rr5,st,st+1.8); x.strokeStyle=hex(COL,0.5-i5*0.03); x.lineWidth=1.4; x.stroke(); }
    } else {
      for(var k6=0;k6<3;k6++){ x.save(); x.translate(cx,cy); x.rotate(sp*(k6%2?-0.6:0.6)); x.beginPath(); x.ellipse(0,0,R*(0.6+k6*0.2),R*0.3,0,0,7); x.strokeStyle=hex(COL,0.3-k6*0.06); x.lineWidth=1; x.stroke(); x.restore(); }
      for(var i6=0;i6<8;i6++){ var a6=sp+i6*Math.PI/4; x.beginPath(); x.arc(cx+Math.cos(a6)*R*0.9,cy+Math.sin(a6)*R*0.34,1.4,0,7); x.fillStyle=hex(COL,0.7); x.fill(); }
    }
    x.restore();
    glyph();
  }
  function loop(){ t+=0.012; draw(); requestAnimationFrame(loop); }
  if(reduce){ draw(); } else loop();
})();
