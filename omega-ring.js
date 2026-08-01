/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN PROGRESS RING (omega-ring.js)

   Cinematic SVG + Canvas circular progress indicators.
   Used on profile, matrix, evolution, dashboard authority cards.

   AUTO-MOUNT: Any element with [data-omega-ring] gets a ring rendered.
   Attributes:
     data-omega-ring           — activates ring
     data-ring-value="0.65"    — fill fraction 0–1 (default 0)
     data-ring-label="AUTH"    — centre label
     data-ring-sublabel="27.8" — centre sublabel
     data-ring-size="120"      — diameter px (default 100)
     data-ring-color="gold|cyan|green|purple|crim" (default gold)
     data-ring-track="0.06"    — track opacity 0–1 (default 0.08)
     data-ring-live             — if present, syncs with __omegaAuth on omega:populated

   Programmatic API:
     OmegaRing.render(canvas, value, opts)   // animate 0 → value
     OmegaRing.update(canvas, newValue)      // animate current → newValue
     OmegaRing.fromAuth(canvas, profile)     // render AUTH ring from profile data
   ========================================================================== */
(function(){
  'use strict';
  if(window.__omegaRingActive) return;
  window.__omegaRingActive = true;

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var COLORS = {
    gold:   {stroke:'#C9A84C', glow:'rgba(201,168,76,0.4)'},
    solar:  {stroke:'#E2C86D', glow:'rgba(226,200,109,0.4)'},
    cyan:   {stroke:'#00E5FF', glow:'rgba(0,229,255,0.35)'},
    green:  {stroke:'#3fb27f', glow:'rgba(63,178,127,0.35)'},
    purple: {stroke:'#9B6BF0', glow:'rgba(155,107,240,0.35)'},
    crim:   {stroke:'#8B0000', glow:'rgba(139,0,0,0.35)'},
  };

  /* ── CORE CANVAS RENDERER ───────────────────────────────────────────── */
  function renderRing(canvas, value, opts){
    opts = opts || {};
    var dpr = Math.min(window.devicePixelRatio||1, 2);
    var size = opts.size || parseInt(canvas.getAttribute('data-ring-size')||'100',10);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var col = COLORS[opts.color||canvas.getAttribute('data-ring-color')||'gold'];
    var cx = size/2, cy = size/2;
    var thickness = opts.thickness || Math.max(4, size * 0.065);
    var radius = (size - thickness) / 2 - 2;
    var startAngle = -Math.PI / 2; /* 12 o'clock */

    ctx.clearRect(0, 0, size, size);

    /* Track (background arc) */
    var trackOpacity = opts.track != null ? opts.track : 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(201,168,76,' + trackOpacity + ')';
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke();

    /* Fill arc */
    if(value > 0){
      var endAngle = startAngle + (Math.PI * 2 * Math.min(value, 1));
      ctx.shadowColor = col.glow;
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.strokeStyle = col.stroke;
      ctx.lineWidth   = thickness;
      ctx.lineCap     = 'round';
      ctx.stroke();
      ctx.shadowBlur  = 0;
    }

    /* Centre text */
    var label    = opts.label    || canvas.getAttribute('data-ring-label')    || '';
    var sublabel = opts.sublabel || canvas.getAttribute('data-ring-sublabel') || '';
    if(label||sublabel){
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      /* Primary label */
      if(label){
        ctx.font = 'bold '+ Math.round(size*0.17) +'px "Cinzel Decorative",serif';
        ctx.fillStyle = col.stroke;
        ctx.shadowColor = col.glow; ctx.shadowBlur = 4;
        ctx.fillText(String(label), cx, cy - (sublabel ? size*0.07 : 0));
        ctx.shadowBlur = 0;
      }
      /* Sublabel */
      if(sublabel){
        ctx.font = Math.round(size*0.09) +'px "Courier Prime",monospace';
        ctx.fillStyle = 'rgba(138,134,118,0.7)';
        ctx.fillText(String(sublabel).toUpperCase(), cx, cy + size * 0.13);
      }
    }
  }

  /* ── ANIMATION ─────────────────────────────────────────────────────── */
  function animateRing(canvas, fromVal, toVal, opts){
    if(REDUCE){
      renderRing(canvas, toVal, opts);
      canvas._ringValue = toVal;
      return;
    }
    var duration = opts.duration || 1200;
    var start = performance.now();
    function step(now){
      var t = Math.min((now - start) / duration, 1);
      /* Ease out cubic */
      var ease = 1 - Math.pow(1 - t, 3);
      var val = fromVal + (toVal - fromVal) * ease;
      /* Update dynamic label with interpolated value */
      var labelOpts = Object.assign({}, opts);
      if(opts.labelFn) labelOpts.label = opts.labelFn(val);
      if(opts.sublabelFn) labelOpts.sublabel = opts.sublabelFn(val);
      renderRing(canvas, val, labelOpts);
      if(t < 1) requestAnimationFrame(step);
      else canvas._ringValue = toVal;
    }
    requestAnimationFrame(step);
  }

  /* ── PUBLIC API ─────────────────────────────────────────────────────── */
  var API = {
    render: function(canvas, value, opts){
      var from = canvas._ringValue || 0;
      canvas._ringValue = value;
      animateRing(canvas, from, value, opts||{});
    },
    update: function(canvas, newValue){
      var from = canvas._ringValue || 0;
      animateRing(canvas, from, newValue, {
        color: canvas.getAttribute('data-ring-color')||'gold',
        label: canvas._ringLabel,
        sublabel: canvas._ringSublabel,
      });
      canvas._ringValue = newValue;
    },
    fromAuth: function(canvas, profile){
      var PHI=1.6180339887, EU=2.7182818285;
      var a=Number(profile.axis_a||0.001);
      var b=Number(profile.axis_b||0.001);
      var c=Number(profile.axis_c||0.001);
      var auth=profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
      var GATES=[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.5170,27.8367];
      var NAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT',
                 'SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX'];
      var gi=-1;
      for(var i=GATES.length-1;i>=0;i--){if(auth>=GATES[i]){gi=i;break;}}
      var gname = gi>=0?NAMES[gi]:'GENESIS';
      API.render(canvas, auth/27.8367, {
        color: 'gold',
        label: auth.toFixed(2),
        sublabel: gname,
        labelFn: function(v){ return (v*27.8367).toFixed(2); },
        sublabelFn: function(){ return gname; },
      });
    },
  };

  /* ── AUTO-MOUNT [data-omega-ring] ELEMENTS ─────────────────────────── */
  function mountOne(el){
    if(el._omegaRingMounted) return;
    el._omegaRingMounted = true;
    var size  = parseInt(el.getAttribute('data-ring-size')||'100',10);
    var value = parseFloat(el.getAttribute('data-ring-value')||'0');
    var color = el.getAttribute('data-ring-color')||'gold';
    var label = el.getAttribute('data-ring-label')||'';
    var sub   = el.getAttribute('data-ring-sublabel')||'';
    var isLive= el.hasAttribute('data-ring-live');

    /* Create canvas inside the element if not already a canvas */
    var cv;
    if(el.tagName === 'CANVAS'){
      cv = el;
    } else {
      cv = document.createElement('canvas');
      cv.setAttribute('data-ring-color', color);
      cv.setAttribute('data-ring-label', label);
      cv.setAttribute('data-ring-sublabel', sub);
      el.style.display = el.style.display || 'inline-block';
      el.appendChild(cv);
    }
    cv._ringLabel = label;
    cv._ringSublabel = sub;

    /* Initial render */
    API.render(cv, value, {size:size, color:color, label:label, sublabel:sub});

    /* Live sync on omega:populated */
    if(isLive){
      document.addEventListener('omega:populated', function(e){
        var pr = e.detail && e.detail.profile;
        if(pr) API.fromAuth(cv, pr);
      });
      /* Also sync if profile already available */
      if(window.__omegaProfile) API.fromAuth(cv, window.__omegaProfile);
    }
  }

  function mountAll(){
    document.querySelectorAll('[data-omega-ring]').forEach(mountOne);
    /* Auto-enhance #kpi-auth with a live authority ring if not already done */
    enhanceAuthKPI();
  }

  /* Injects a compact authority ring into the #kpi-auth card */
  function enhanceAuthKPI(){
    var kpi = document.getElementById('kpi-auth');
    if(!kpi || kpi._ringEnhanced) return;
    kpi._ringEnhanced = true;
    /* Add ring canvas at the top of the KPI card */
    var cv = document.createElement('canvas');
    cv.style.cssText = 'display:block;margin:0 auto 4px;';
    kpi.insertBefore(cv, kpi.firstChild);
    /* Initial blank ring */
    renderRing(cv, 0, {size:64, color:'gold', track:0.06});
    /* Wire to omega:populated */
    document.addEventListener('omega:populated', function(e){
      var pr = e.detail && e.detail.profile;
      if(pr) API.fromAuth(cv, pr);
    });
    if(window.__omegaProfile) API.fromAuth(cv, window.__omegaProfile);
  }

  window.addEventListener('load', mountAll);
  document.addEventListener('omega:populated', function(){
    setTimeout(mountAll, 100);
  });

  window.OmegaRing = API;
})();
