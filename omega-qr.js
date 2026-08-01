/* ==========================================================================
   Ω SYD OMEGA 91717 — QR CODE ENGINE (omega-qr.js)

   Open-source integration: qrcode-generator (MIT, Kazuhiko Arase)
   CDN: https://cdn.jsdelivr.net/npm/qrcode-generator@1/qrcode.min.js

   Use cases:
   A. MEMBER CREDENTIAL QR — on profile.html, vault.html, membership cards.
      Encodes: member profile URL + auth tier + gate + element.
      Sovereign dark styling.

   B. PAGE QR — any element with [data-qr-url] gets a live QR code rendered
      inside it when clicked / on demand.

   C. DIGITAL PASS — generates a downloadable sovereign credential image
      with the Ω mark, gate title, and QR code embedded in canvas.

   Usage:
     OmegaQR.render(canvasEl, 'https://example.com')  → renders QR to canvas
     OmegaQR.member(canvasEl, profile)                → sovereign member QR
     OmegaQR.download(profile)                        → download pass as PNG
     [data-qr-url="https://..."]                      → auto-rendered on load
   ========================================================================== */
(function(){
  'use strict';
  if(window.__omegaQRActive) return;
  window.__omegaQRActive = true;

  var QR_CDN = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1/qrcode.min.js';
  var _qrLoaded = false;
  var _qrCbs = [];

  function loadQR(cb){
    if(_qrLoaded){ cb(); return; }
    _qrCbs.push(cb);
    if(_qrCbs.length > 1) return;
    var s = document.createElement('script');
    s.src = QR_CDN; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = function(){
      _qrLoaded = true;
      _qrCbs.forEach(function(fn){ try{ fn(); }catch(e){} });
      _qrCbs = [];
    };
    s.onerror = function(){ console.warn('[OmegaQR] Failed to load qrcode-generator'); };
    document.head.appendChild(s);
  }

  /* ── CORE RENDERER ──────────────────────────────────────────────────── */
  /* Renders a QR code into the provided <canvas> element */
  function renderToCanvas(canvas, url, opts){
    opts = opts || {};
    loadQR(function(){
      if(typeof qrcode === 'undefined'){ console.warn('[OmegaQR] qrcode not ready'); return; }
      try{
        var qr = qrcode(0, opts.ec || 'M');
        qr.addData(String(url));
        qr.make();
        var size = opts.size || canvas.width || 200;
        canvas.width = size; canvas.height = size;
        var ctx = canvas.getContext('2d');
        var cells = qr.getModuleCount();
        var cellSize = size / cells;
        /* Background */
        ctx.fillStyle = opts.bg || '#0A0A0F';
        ctx.fillRect(0, 0, size, size);
        /* Modules */
        var fgColor = opts.fg || '#C9A84C';
        ctx.fillStyle = fgColor;
        for(var r = 0; r < cells; r++){
          for(var c = 0; c < cells; c++){
            if(qr.isDark(r,c)){
              ctx.fillRect(
                Math.floor(c * cellSize), Math.floor(r * cellSize),
                Math.ceil(cellSize), Math.ceil(cellSize)
              );
            }
          }
        }
        /* Subtle sovereign gold glow on finder patterns */
        ctx.shadowColor = fgColor;
        ctx.shadowBlur = 4;
        ctx.fillStyle = fgColor;
        /* Top-left finder */
        ctx.fillRect(cellSize*7, cellSize*7, cellSize*0.5, cellSize*0.5);
        ctx.shadowBlur = 0;
      }catch(e){ console.warn('[OmegaQR] render error', e); }
    });
  }

  /* ── MEMBER QR ──────────────────────────────────────────────────────── */
  function memberURL(profile){
    var base = location.origin;
    var id = (profile && profile.id) || 'sovereign';
    return base + '/profile.html?uid=' + encodeURIComponent(id);
  }

  function renderMember(canvas, profile){
    renderToCanvas(canvas, memberURL(profile), {
      bg: '#020206', fg: '#C9A84C', size: canvas.clientWidth || 200,
    });
  }

  /* ── DIGITAL PASS DOWNLOAD ──────────────────────────────────────────── */
  function downloadPass(profile){
    if(!profile){ console.warn('[OmegaQR] no profile'); return; }
    var PHI=1.6180339887, EU=2.7182818285;
    var a=Number(profile.axis_a||0.001),b=Number(profile.axis_b||0.001),c=Number(profile.axis_c||0.001);
    var auth=profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
    var GATE_NAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT',
                    'SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX'];
    var GATES=[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.5170,27.8367];
    var gi=-1;for(var i=GATES.length-1;i>=0;i--){if(auth>=GATES[i]){gi=i;break;}}
    var gateName = gi>=0?GATE_NAMES[gi]:'INITIATE';

    var W=360, H=520;
    var cv = document.createElement('canvas');
    cv.width=W*2; cv.height=H*2;
    var ctx = cv.getContext('2d');
    ctx.scale(2,2);

    /* Card background */
    var grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#020206');
    grad.addColorStop(1,'#0A0A0F');
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,W,H);

    /* Border */
    ctx.strokeStyle='rgba(201,168,76,.35)';
    ctx.lineWidth=1;
    ctx.strokeRect(8,8,W-16,H-16);

    /* Omega mark */
    ctx.font='bold 36px serif';
    ctx.fillStyle='#C9A84C';
    ctx.textAlign='center';
    ctx.shadowColor='rgba(201,168,76,.5)';
    ctx.shadowBlur=12;
    ctx.fillText('Ω', W/2, 60);
    ctx.shadowBlur=0;

    /* Title */
    ctx.font='9px "Courier New",monospace';
    ctx.fillStyle='rgba(201,168,76,.6)';
    ctx.letterSpacing='3px';
    ctx.fillText('SYD OMEGA 91717', W/2, 82);

    /* Gate */
    ctx.font='bold 20px "Courier New",monospace';
    ctx.fillStyle='#E2C86D';
    ctx.fillText(gateName, W/2, 116);

    ctx.font='8px "Courier New",monospace';
    ctx.fillStyle='rgba(138,134,118,.7)';
    ctx.fillText('GATE '+(gi+1)+' · AUTH '+auth.toFixed(4), W/2, 134);

    /* Name */
    ctx.font='14px "Courier New",monospace';
    ctx.fillStyle='#e9e6dc';
    ctx.fillText((profile.display_name||'SOVEREIGN').toUpperCase(), W/2, 164);

    /* Sign + Element */
    ctx.font='9px "Courier New",monospace';
    ctx.fillStyle='rgba(0,229,255,.8)';
    var detail = [(profile.sign||''), (profile.element||'')].filter(Boolean).join(' · ').toUpperCase();
    ctx.fillText(detail, W/2, 182);

    /* Separator */
    ctx.strokeStyle='rgba(201,168,76,.15)';
    ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo(36,200); ctx.lineTo(W-36,200); ctx.stroke();

    /* QR code area — render async then composite */
    var qrSize=180;
    var qrX=(W-qrSize)/2;
    var qrY=216;
    var qrCv=document.createElement('canvas');
    qrCv.width=qrSize; qrCv.height=qrSize;
    renderToCanvas(qrCv, memberURL(profile), {size:qrSize, bg:'#020206', fg:'#C9A84C'});

    /* Footer */
    ctx.font='7px "Courier New",monospace';
    ctx.fillStyle='rgba(138,134,118,.4)';
    ctx.fillText('© '+new Date().getFullYear()+' '+'Ω'+' SYD OMEGA 91717', W/2, H-20);
    ctx.fillText('ALL RIGHTS RESERVED', W/2, H-8);

    /* Composite QR after brief delay (loadQR is async) */
    setTimeout(function(){
      try{
        ctx.drawImage(qrCv, qrX, qrY, qrSize, qrSize);
        /* Download */
        cv.toBlob(function(blob){
          var url=URL.createObjectURL(blob);
          var a=document.createElement('a');
          a.href=url;
          a.download='omega-pass-'+(profile.display_name||'sovereign').toLowerCase().replace(/\s/g,'-')+'.png';
          a.click();
          setTimeout(function(){URL.revokeObjectURL(url);},2000);
        },'image/png');
      }catch(e){
        /* Cross-origin canvas taint fallback */
        console.warn('[OmegaQR] download fallback triggered');
        cv.toBlob(function(blob){
          var url=URL.createObjectURL(blob);
          var a=document.createElement('a');
          a.href=url; a.download='omega-pass.png'; a.click();
          setTimeout(function(){URL.revokeObjectURL(url);},2000);
        },'image/png');
      }
    }, 800);
  }

  /* ── AUTO-INIT [data-qr-url] ELEMENTS ──────────────────────────────── */
  function initAutoQR(){
    document.querySelectorAll('[data-qr-url]').forEach(function(el){
      var url = el.getAttribute('data-qr-url');
      if(!url) return;
      var size = parseInt(el.getAttribute('data-qr-size')||'160',10);
      /* Create a canvas inside the element if not already there */
      var cv = el.querySelector('canvas');
      if(!cv){
        cv = document.createElement('canvas');
        cv.width = size; cv.height = size;
        cv.style.cssText = 'display:block;border-radius:2px;max-width:100%';
        el.appendChild(cv);
      }
      renderToCanvas(cv, url, {size:size});
    });
  }

  window.addEventListener('load', initAutoQR);
  document.addEventListener('omega:populated', initAutoQR);

  /* ── PUBLIC API ─────────────────────────────────────────────────────── */
  window.OmegaQR = {
    render: renderToCanvas,
    member: renderMember,
    download: downloadPass,
    memberURL: memberURL,
    init: initAutoQR,
  };
})();
