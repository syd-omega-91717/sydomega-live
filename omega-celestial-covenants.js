/* The Celestial Covenants -- concept key art behaviour. Loaded only by celestial-covenants.html.
   Honest by construction: it reads the pointer (never a camera, microphone or location), stores one preference in this
   browser (Lore-Safe Mode), and draws. Everything is built with createElementNS/textContent from constants: no innerHTML,
   no network, no dynamic data. A missing localStorage (private window) degrades to the default, never throws. */
(function () {
  'use strict';
  var root = document.getElementById('cc');
  if (!root || root.getAttribute('data-cc-ready') === '1') return;
  root.setAttribute('data-cc-ready', '1');

  var NS = 'http://www.w3.org/2000/svg';
  var KEY = 'omega_covenants_lore_safe';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function announce(msg) { var a = document.getElementById('cc-announce'); if (a) a.textContent = msg; }

  /* ---- Lore-Safe Mode: a real switch. On (default) hides every religious-tradition mention on this page. ---- */
  var loreBtn = document.getElementById('cc-lore'), loreState = document.getElementById('cc-lore-s');
  function readLore() { try { return localStorage.getItem(KEY) === 'off' ? false : true; } catch (e) { return true; } }
  function applyLore(on, persist) {
    root.setAttribute('data-lore-safe', on ? 'on' : 'off');
    if (loreBtn) loreBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (loreState) loreState.textContent = on ? 'ON' : 'OFF';
    if (persist) { try { if (on) localStorage.removeItem(KEY); else localStorage.setItem(KEY, 'off'); } catch (e) {} }
  }
  applyLore(readLore(), false);
  if (loreBtn) loreBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-lore-safe') !== 'on';
    applyLore(next, true);
    announce('Lore-Safe Mode ' + (next ? 'on: source references hidden.' : 'off: source references shown.'));
  });

  /* ---- Data purge: really clears the one thing this page stores, then resets to the default. ---- */
  var purge = document.getElementById('cc-purge');
  if (purge) purge.addEventListener('click', function () {
    var ok = true;
    try { localStorage.removeItem(KEY); } catch (e) { ok = false; }
    applyLore(true, false);
    announce(ok ? 'This page’s stored setting was cleared. Lore-Safe Mode is on.' : 'Nothing was stored in this browser. Lore-Safe Mode is on.');
  });

  /* ---- Day ruler: the classical ruler of the weekday, from the local clock. No location, so no planetary hour. ---- */
  var ruler = document.getElementById('cc-ruler');
  if (ruler) {
    var R = ['SUN', 'MOO', 'MAR', 'MER', 'JUP', 'VEN', 'SAT'], D = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    var d = new Date().getDay();
    ruler.textContent = 'DAY RULER ' + R[d] + ' · ' + D[d];
  }

  /* ---- Lightning hair (King Burqan): deterministic jagged bolts radiating from the crown. ---- */
  var bolts = document.getElementById('cc-bolts');
  if (bolts) {
    var seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (var i = 0; i < 15; i++) {
      var a = (-90 + (i - 7) * 11.5) * Math.PI / 180, x = 180 + Math.cos(a) * 30, y = 112 + Math.sin(a) * 30, pts = [x.toFixed(1) + ',' + y.toFixed(1)];
      var len = 38 + rnd() * 34, steps = 5;
      for (var s = 1; s <= steps; s++) {
        var t = s / steps, jitter = (rnd() - 0.5) * 22;
        var px = 180 + Math.cos(a) * (30 + len * t) + Math.cos(a + Math.PI / 2) * jitter;
        var py = 112 + Math.sin(a) * (30 + len * t) + Math.sin(a + Math.PI / 2) * jitter;
        pts.push(px.toFixed(1) + ',' + py.toFixed(1));
      }
      el('polyline', { 'class': 'cc-bolt', points: pts.join(' ') }, bolts);
    }
  }

  /* ---- Al-Asad: mane of bone fingers (three-jointed) and a maw of concentric toothed rings. ---- */
  var mane = document.getElementById('cc-mane');
  if (mane) {
    for (var f = 0; f < 15; f++) {
      var u = (f - 7) / 7, ang = u * 74 * Math.PI / 180, L = 150 + (1 - Math.abs(u)) * 70, bx = 180, by = 560, pts2 = [[bx, by]];
      for (var j = 1; j <= 3; j++) {
        var t3 = j / 3, curve = u * 0.28 * t3;      /* fingers lean outward the further they reach */
        pts2.push([bx + Math.sin(ang + curve) * L * t3, by - Math.cos(ang + curve) * L * t3]);
      }
      var path = 'M' + pts2.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
      el('path', { d: path, 'stroke-width': String(4.2 - Math.abs(u) * 1.6), opacity: String(0.92 - Math.abs(u) * 0.3) }, mane);
      for (var k = 1; k < pts2.length; k++) el('circle', { cx: pts2[k][0].toFixed(1), cy: pts2[k][1].toFixed(1), r: String(3.6 - k * 0.55), fill: '#ece4cf', stroke: 'none', opacity: String(0.9 - Math.abs(u) * 0.3) }, mane);
    }
  }
  var maw = document.getElementById('cc-maw');
  if (maw) {
    el('ellipse', { cx: 180, cy: 548, rx: 64, ry: 40, fill: '#000', stroke: '#FF3C00', 'stroke-width': 1.4, 'stroke-opacity': '.7' }, maw);
    [[62, 38, 18], [46, 28, 14], [30, 18, 11], [15, 9, 8]].forEach(function (r, idx) {
      var rx = r[0], ry = r[1], n = r[2];
      el('ellipse', { cx: 180, cy: 548, rx: rx, ry: ry, fill: 'none', stroke: '#FF3C00', 'stroke-width': 1, 'stroke-opacity': String(0.35 + idx * 0.12) }, maw);
      for (var t = 0; t < n; t++) {
        var th = (t / n) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
        var bx2 = 180 + c * rx, by2 = 548 + sn * ry, tip = 0.72 - idx * 0.04;
        var tx = 180 + c * rx * tip, ty = 548 + sn * ry * tip, nx = -sn * 3.2, ny = c * 3.2;
        el('polygon', { points: (bx2 + nx).toFixed(1) + ',' + (by2 + ny).toFixed(1) + ' ' + (bx2 - nx).toFixed(1) + ',' + (by2 - ny).toFixed(1) + ' ' + tx.toFixed(1) + ',' + ty.toFixed(1), fill: '#FF6A33', opacity: String(0.7 + idx * 0.08) }, maw);
      }
    });
  }

  /* ---- Pointer: parallax on the 16:9 stage, and the slit pupils on the phone follow the pointer (not eye-tracking). ---- */
  var stage = document.getElementById('cc-stage'), phone = document.getElementById('cc-phone'), art = document.getElementById('cc-art');
  var raf = 0, tx = 0, ty = 0;
  function setVars() { raf = 0; root.style.setProperty('--cc-mx', tx.toFixed(3)); root.style.setProperty('--cc-my', ty.toFixed(3)); }
  function onStage(ev) {
    if (reduce) return;
    var r = stage.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, ((ev.clientX - r.left) / r.width - 0.5) * 2));
    ty = Math.max(-1, Math.min(1, ((ev.clientY - r.top) / r.height - 0.5) * 2));
    if (!raf) raf = requestAnimationFrame(setVars);
  }
  if (stage) { stage.addEventListener('pointermove', onStage); stage.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(setVars); }); }
  var eyes = art ? art.querySelectorAll('[data-eye]') : [];
  function look(ev) {
    if (reduce || !art) return;
    var r = art.getBoundingClientRect(), dx = Math.max(-1, Math.min(1, (ev.clientX - (r.left + r.width / 2)) / (r.width / 2))), dy = Math.max(-1, Math.min(1, (ev.clientY - (r.top + r.height * 0.26)) / (r.height / 2)));
    for (var i = 0; i < eyes.length; i++) eyes[i].style.transform = 'translate(' + (dx * 6).toFixed(2) + 'px,' + (dy * 3).toFixed(2) + 'px)';
  }
  window.addEventListener('pointermove', look, { passive: true });

  /* ---- Particles: gold geometric motes on the Order side, bioluminescent bubbles on the Abyss side. One loop, paused offscreen. ---- */
  var cv = document.getElementById('cc-fx');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, P = [], running = false, visible = true;
  function seedParticles() {
    P = [];
    var n = Math.max(26, Math.min(70, Math.round(W / 22)));
    for (var i = 0; i < n; i++) P.push({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() * 1.6, v: 0.015 + Math.random() * 0.05, w: Math.random() * 6.28, kind: 0 });
  }
  function size() {
    var r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedParticles();
  }
  function seamX(y) { return W * (0.56 - 0.12 * (y / H)); }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < P.length; i++) {
      var p = P[i], y = p.y * H, x = p.x * W, order = x < seamX(y);
      var px = x + Math.sin(t * 0.0006 + p.w) * (order ? 3 : 10);
      if (order) {
        ctx.save(); ctx.translate(px, y); ctx.rotate(p.w + t * 0.0004);
        ctx.fillStyle = 'rgba(233,185,73,' + (0.25 + p.s * 0.2).toFixed(2) + ')'; ctx.fillRect(-p.s * 1.6, -p.s * 1.6, p.s * 3.2, p.s * 3.2); ctx.restore();
      } else {
        var g = ctx.createRadialGradient(px, y, 0, px, y, p.s * 7);
        g.addColorStop(0, 'rgba(0,243,255,.75)'); g.addColorStop(1, 'rgba(0,243,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, y, p.s * 7, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = 'rgba(160,255,250,.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(px, y, p.s * 2.4, 0, 6.2832); ctx.stroke();
      }
    }
  }
  var last = 0;
  function frame(t) {
    if (!running) return;
    var dt = Math.min(48, t - last || 16); last = t;
    for (var i = 0; i < P.length; i++) { var p = P[i]; p.y -= p.v * dt / 1000 * (p.x * W < seamX(p.y * H) ? 0.6 : 1.4); if (p.y < -0.03) { p.y = 1.03; p.x = Math.random(); } }
    draw(t); requestAnimationFrame(frame);
  }
  function update() {
    var want = visible && !document.hidden && !reduce;
    if (want && !running) { running = true; last = 0; requestAnimationFrame(frame); }
    else if (!want) { running = false; if (reduce) draw(0); }
  }
  size(); draw(0);
  if ('ResizeObserver' in window) new ResizeObserver(function () { size(); draw(0); }).observe(stage || cv); else window.addEventListener('resize', function () { size(); draw(0); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; update(); }).observe(cv);
  document.addEventListener('visibilitychange', update);
  update();
})();
