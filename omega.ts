/* ============================================================
   SYD OMEGA 91717 - OMEGA-FX  (cinematic visual engine)
   One drop-in. Self-injects its own CSS. Zero dependencies.
   Add to any page:  <script src="omega-fx.js" defer></script>
   Or call once from bg.js. Upgrades EVERY page at once:
     - animated aurora + starfield + rotating Omega sigil
     - cinematic page-load rise
     - scroll-reveal on sections/cards/headings
     - glassmorphism + 3D tilt on panels
     - gold shimmer on display headings
     - pointer halo (desktop)
   Progressive enhancement: if JS fails, content stays visible.
   Respects prefers-reduced-motion. Pauses on hidden tab.
   Design tokens (locked): void #0A0A0F gold #C9A84C
   cyan #00E5FF crimson #8B0000.
   ============================================================ */
(function () {
  "use strict";
  if (window.__OMEGA_FX__) return;          // guard double-load
  window.__OMEGA_FX__ = true;

  var REDUCE = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TOUCH = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;

  // ---------- 1. inject styles ----------
  var css = "" +
    ":root{--omega-void:#0A0A0F;--omega-gold:#C9A84C;--omega-cyan:#00E5FF;--omega-crimson:#8B0000;}" +
    "html.omega-fx-ready{background:var(--omega-void);}" +
    "#omega-fx-bg{position:fixed;inset:0;z-index:-2;overflow:hidden;pointer-events:none;background:var(--omega-void);}" +
    "#omega-fx-aurora{position:absolute;inset:-20%;z-index:-2;filter:blur(60px);opacity:.55;" +
      "background:radial-gradient(40% 40% at 25% 30%,rgba(201,168,76,.30),transparent 70%)," +
      "radial-gradient(45% 45% at 78% 22%,rgba(0,229,255,.20),transparent 70%)," +
      "radial-gradient(50% 50% at 60% 85%,rgba(139,0,0,.28),transparent 70%);" +
      "animation:omega-aurora 26s ease-in-out infinite alternate;}" +
    "#omega-fx-canvas{position:absolute;inset:0;z-index:-1;}" +
    "#omega-fx-halo{position:fixed;width:340px;height:340px;left:0;top:0;z-index:-1;pointer-events:none;" +
      "border-radius:50%;transform:translate(-50%,-50%);opacity:0;transition:opacity .4s;" +
      "background:radial-gradient(circle,rgba(201,168,76,.10),transparent 65%);}" +
    "@keyframes omega-aurora{0%{transform:translate3d(-3%,-2%,0) scale(1.05);}" +
      "100%{transform:translate3d(3%,2%,0) scale(1.15);}}" +
    "@keyframes omega-rise{0%{opacity:0;transform:translateY(14px);}100%{opacity:1;transform:none;}}" +
    /* page-load cinematic */
    "html.omega-fx-ready body{animation:omega-rise .9s cubic-bezier(.2,.7,.2,1) both;}" +
    /* scroll reveal: only hide when ready + motion ok */
    "html.omega-fx-ready.omega-fx-motion [data-omega-reveal]{opacity:0;transform:translateY(20px);" +
      "transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);}" +
    "html.omega-fx-ready.omega-fx-motion [data-omega-reveal].omega-in{opacity:1;transform:none;}" +
    /* glass + tilt */
    ".omega-glass{background:rgba(201,168,76,.05)!important;border:1px solid rgba(201,168,76,.18)!important;" +
      "border-radius:14px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);" +
      "transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease;transform-style:preserve-3d;}" +
    ".omega-glass:hover{border-color:rgba(201,168,76,.45)!important;" +
      "box-shadow:0 18px 50px rgba(0,0,0,.45),0 0 26px rgba(201,168,76,.12);}" +
    /* shimmer on display headings */
    ".omega-shimmer{background:linear-gradient(100deg,var(--omega-gold) 20%,#fff6d8 40%,var(--omega-cyan) 55%,var(--omega-gold) 75%);" +
      "background-size:220% auto;-webkit-background-clip:text;background-clip:text;color:transparent;" +
      "animation:omega-sweep 6s linear infinite;}" +
    "@keyframes omega-sweep{to{background-position:220% center;}}" +
    "@media (prefers-reduced-motion: reduce){#omega-fx-aurora,html.omega-fx-ready body,.omega-shimmer{animation:none!important;}" +
      "#omega-fx-aurora{opacity:.4;}}";
  var style = document.createElement("style");
  style.id = "omega-fx-style";
  style.textContent = css;
  document.head.appendChild(style);

  var html = document.documentElement;
  html.classList.add("omega-fx-ready");
  if (!REDUCE) html.classList.add("omega-fx-motion");

  // ---------- 2. background layers ----------
  var bg = document.createElement("div");
  bg.id = "omega-fx-bg";
  bg.innerHTML = '<div id="omega-fx-aurora"></div><canvas id="omega-fx-canvas"></canvas>';
  var halo = document.createElement("div");
  halo.id = "omega-fx-halo";

  function mount() {
    document.body.appendChild(bg);
    if (!TOUCH) document.body.appendChild(halo);
    initCanvas();
    initReveal();
    initShimmer();
    if (!TOUCH) initHalo();
  }

  // ---------- 3. canvas: starfield + rotating sigil ----------
  function initCanvas() {
    var c = document.getElementById("omega-fx-canvas");
    var ctx = c.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, stars, t = 0, running = true;

    function resize() {
      W = c.width = Math.floor(innerWidth * dpr);
      H = c.height = Math.floor(innerHeight * dpr);
      c.style.width = innerWidth + "px";
      c.style.height = innerHeight + "px";
      var count = TOUCH ? 46 : 90;
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: (Math.random() * 1.4 + 0.3) * dpr,
          a: Math.random() * 0.6 + 0.2,
          s: (Math.random() * 0.25 + 0.05) * dpr,
          tw: Math.random() * Math.PI * 2
        });
      }
    }
    window.addEventListener("resize", resize);
    resize();

    function ring(cx, cy, rad, rot, segs, color, w) {
      ctx.strokeStyle = color; ctx.lineWidth = w;
      for (var i = 0; i < segs; i++) {
        var a0 = rot + (i / segs) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, a0, a0 + (Math.PI * 2 / segs) * 0.6);
        ctx.stroke();
      }
    }
    function sigil(cx, cy, r, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 3 * dpr;
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 0.16, Math.PI * 0.84); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.95, cy + r * 0.6); ctx.lineTo(cx - r * 0.4, cy + r * 0.6);
      ctx.moveTo(cx + r * 0.95, cy + r * 0.6); ctx.lineTo(cx + r * 0.4, cy + r * 0.6);
      ctx.stroke();
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      // stars
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.y -= s.s; s.tw += 0.03;
        if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }
        var tw = s.a * (0.6 + 0.4 * Math.sin(s.tw));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(201,168,76," + tw.toFixed(3) + ")";
        ctx.fill();
      }
      // sigil
      var cx = W / 2, cy = H * 0.42, base = Math.min(W, H) * 0.2;
      ring(cx, cy, base * 1.7, t * 0.0008, 12, "rgba(0,229,255,.16)", 1 * dpr);
      ring(cx, cy, base * 1.32, -t * 0.0013, 9, "rgba(139,0,0,.20)", 1.4 * dpr);
      ring(cx, cy, base * 0.98, t * 0.0021, 6, "rgba(201,168,76,.28)", 1.4 * dpr);
      sigil(cx, cy, base * 0.52, "rgba(201,168,76,.5)");
      t += 16;
      if (!REDUCE) requestAnimationFrame(frame);
    }
    frame();

    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running && !REDUCE) frame();
    });
  }

  // ---------- 4. scroll reveal ----------
  function initReveal() {
    var sel = "section,article,.card,.panel,.glass,[class*='card'],[class*='panel'],h1,h2,table,img";
    var nodes = Array.prototype.slice.call(document.querySelectorAll(sel));
    nodes.forEach(function (n) {
      if (!n.closest("#omega-fx-bg")) n.setAttribute("data-omega-reveal", "");
    });
    if (REDUCE || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("omega-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("omega-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (n) { io.observe(n); });
  }

  // ---------- 5. glass + shimmer ----------
  function initShimmer() {
    var panels = document.querySelectorAll(".card,.panel,[class*='card'],[class*='panel'],section>div");
    Array.prototype.slice.call(panels).forEach(function (p) {
      if (p.closest("#omega-fx-bg")) return;
      p.classList.add("omega-glass");
      if (!TOUCH) tilt(p);
    });
    Array.prototype.slice.call(document.querySelectorAll("h1")).forEach(function (h) {
      if (!h.closest("#omega-fx-bg")) h.classList.add("omega-shimmer");
    });
  }
  function tilt(el) {
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = "perspective(900px) rotateX(" + (-py * 5).toFixed(2) +
        "deg) rotateY(" + (px * 5).toFixed(2) + "deg) translateY(-3px)";
    });
    el.addEventListener("mouseleave", function () { el.style.transform = ""; });
  }

  // ---------- 6. pointer halo ----------
  function initHalo() {
    var x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY; halo.style.opacity = "1";
    });
    (function loop() {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      halo.style.left = x + "px"; halo.style.top = y + "px";
      requestAnimationFrame(loop);
    })();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
