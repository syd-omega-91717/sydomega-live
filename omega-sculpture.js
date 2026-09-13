/* ==========================================================================
   Ω SYD OMEGA 91717 — THE SCULPTURE (omega-sculpture.js)

   The platform's real-time 3-D layer. Not a picture of a world: a world.

   WHY THIS EXISTS
   ───────────────
   Every visual system in this repo before it is flat. omega-emblems.js
   draws SVG rings, omega-constellation.js lays marks out in a CSS circle,
   omega-cinematic.js slides a curtain, omega-cinematic-system.js prepends a
   starfield <div>. All good craft, all 2-D. Meanwhile three.js — a complete
   3-D engine — has been vendored at /vendor/three.module.js (670KB, MIT)
   since FIXES_LOG 131 and is imported by exactly ONE feature, the elemental
   sphere in omega-realm.js. The engine was bought and left idle.

   The Sculpture spends it. Declarative, one attribute per mount:

       <div data-omega-sculpture="signet"></div>     the Ω mark, extruded, alive
       <div data-omega-sculpture="agents"></div>     the 12 executors in orbit
       <div data-omega-sculpture="matrix"></div>     the 9x9x9 lattice, 729 nodes
       <div data-omega-sculpture="gates"></div>      the Nine Gates, in depth

   Optional: data-sculpt-height (CSS length, default 420px / 300px mobile),
   data-sculpt-accent (hex, default the brand gold), data-sculpt-label.

   ONE WEBGL CONTEXT, MANY MOUNTS — AND WHY IT IS DONE BY BLIT
   ───────────────────────────────────────────────────────────
   Browsers cap live WebGL contexts at roughly 16 and silently kill the
   oldest past that, so one WebGLRenderer per mount does not scale to a page
   with a dozen marks. The usual three.js answer is a single fixed,
   full-viewport canvas with a scissor rect per placeholder. That technique
   is wrong FOR THIS REPO: the shared canvas has to sit either behind all
   content (where every .card's glass background occludes it -- CLAUDE.md 4
   gives .card an opaque-ish surface owned by omega-visual-evolution.css) or
   above it (fighting five layers of fixed chrome, the bottom-stack ladder,
   #om-open at z-9000, and the noise overlay).

   So: ONE renderer against ONE offscreen canvas, and each mount owns a real,
   normally-flowing 2-D canvas that receives a drawImage() blit. One GL
   context total; every mount stacks, scrolls, and clips like any other
   element, with no z-index negotiation at all. The copy costs a texture
   upload per visible mount per frame, which is bounded because only mounts
   actually on screen are ever drawn (IntersectionObserver below).

   CONSTRAINTS THIS FILE IS BUILT AGAINST — each one a real bug in this repo
   ─────────────────────────────────────────────────────────────────────────
   * CLAUDE.md 8.1 class 3. The approval guard hides .shell/#app/main.main
     until the profile resolves and that reveal fires NO resize event, so a
     canvas sized at DOMContentLoaded reads 0 and can never paint. Every
     mount carries a ResizeObserver for its whole life, never a one-shot
     measurement.
   * FIXES_LOG 133/134. A canvas has two sizes. The drawing buffer is set
     from the LIVE box times a capped DPR on every size change, so
     buffer >= box always -- the invariant scripts/verify-runtime.js now
     gates, and which this file must not be the first to break.
   * FIXES_LOG 130. A dynamic import that never resolves runs none of its
     module's code. loadThree() is same-origin and every call site has a
     .catch() that draws a real 2-D fallback rather than leaving a dead box.
   * WebGL can simply be absent (old hardware, blocklisted driver, a
     hardened browser). Detected before the import is even attempted.
   * prefers-reduced-motion. No rAF loop at all: one composed still frame.

   ========================================================================== */
(function () {
  'use strict';
  if (window.__omegaSculpture) return;
  window.__omegaSculpture = 1;

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* Brand palette. Read from the live cascade so theme.js stays the single
     owner of the tokens (CLAUDE.md 4: theme.js is sheet 19 and beats bg.js),
     with the documented values as fallback for a mount that renders before
     the theme layer lands. */
  function token(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  function hex(name, fallback) {
    var v = token(name, fallback);
    return /^#[0-9a-f]{6}$/i.test(v) ? parseInt(v.slice(1), 16) : parseInt(fallback.slice(1), 16);
  }

  var PAL = {};
  function palette() {
    if (PAL.ready) return PAL;
    PAL.gold   = hex('--gold', '#C9A84C');
    PAL.solar  = hex('--solar', '#E2C86D');
    PAL.bright = hex('--gold-bright', '#F7E0A0');
    PAL.cyan   = hex('--cyan', '#00E5FF');
    PAL.crim   = hex('--crim', '#C4453C');
    PAL.void_  = hex('--void', '#08080F');
    PAL.ready  = true;
    return PAL;
  }

  /* ── WebGL availability, decided once ──────────────────────────────────
     Cheap and definitive: try to get a context off a throwaway canvas. Doing
     this BEFORE import('/vendor/three.module.js') keeps 670KB off the wire
     for anyone who could never render it anyway. */
  var _webgl = null;
  function hasWebGL() {
    if (_webgl !== null) return _webgl;
    try {
      var c = document.createElement('canvas');
      _webgl = !!(window.WebGLRenderingContext &&
                  (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { _webgl = false; }
    return _webgl;
  }

  var _three = null, _threeP = null;
  function loadThree() {
    if (_three) return Promise.resolve(_three);
    if (_threeP) return _threeP;
    _threeP = import('/vendor/three.module.js').then(function (m) { _three = m; return m; });
    return _threeP;
  }

  /* ══════════════════════════════════════════════════════════════════════
     GEOMETRY — the Ω mark, built rather than drawn

     The signet is the brand's whole identity, so it is real extruded
     geometry, not a texture of a glyph: an open ring whose gap faces down,
     closed by two feet. Angles are measured the usual way (0 = +x, 90 = +y),
     so the arc runs from the lower right (-25 degrees) counter-clockwise
     over the top to the lower left (205 degrees), leaving the mouth of the
     Ω open between them.
     ══════════════════════════════════════════════════════════════════════ */
  function omegaShape(T, R, thick) {
    var r = R - thick;
    var a0 = -25 * Math.PI / 180;
    var a1 = 205 * Math.PI / 180;
    var s = new T.Shape();
    s.absarc(0, 0, R, a0, a1, false);
    s.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    s.absarc(0, 0, r, a1, a0, true);
    s.closePath();
    return s;
  }

  function buildSignet(T, colour) {
    var R = 1.0, thick = 0.26;
    var grp = new T.Group();
    var extrude = { depth: 0.30, bevelEnabled: true, bevelThickness: 0.045,
                    bevelSize: 0.045, bevelSegments: 4, curveSegments: 64 };

    var mat = new T.MeshStandardMaterial({
      color: colour, metalness: 0.96, roughness: 0.22
    });

    var ring = new T.Mesh(new T.ExtrudeGeometry(omegaShape(T, R, thick), extrude), mat);
    ring.geometry.center();
    grp.add(ring);

    /* The two feet. Both arc ends sit at the SAME height -- sin(205) and
       sin(-25) are equal -- so the feet are plain horizontal bars on one
       baseline, seated with their inner end overlapping the stroke end. A
       first version angled them and offset the y, and rendered as two tabs
       floating near a horseshoe rather than one continuous mark. */
    var footW = 0.54, footH = thick * 0.95;
    var footY = Math.sin(205 * Math.PI / 180) * (R - thick / 2);
    [[-1, 205], [1, -25]].forEach(function (f) {
      var cx = Math.cos(f[1] * Math.PI / 180) * (R - thick / 2);
      var foot = new T.Mesh(
        new T.BoxGeometry(footW, footH, extrude.depth + extrude.bevelThickness * 2), mat);
      foot.position.set(cx + f[0] * (footW * 0.40), footY, 0);
      grp.add(foot);
    });
    /* Seat the whole mark on its own centre of mass: the feet hang below the
       ring, so the raw group's pivot is above the visual centre and it wobbles
       when it turns. */
    grp.position.y = -footY * 0.30;
    return grp;
  }

  /* Cinematic three-point rig: warm gold key, cyan rim from behind for the
     cold edge separation the brand's reference art has everywhere, and a low
     ambient so the unlit side never goes to pure black. */
  function rig(T, scene, p) {
    scene.add(new T.AmbientLight(0xffffff, 0.55));
    var key = new T.DirectionalLight(p.bright, 2.4); key.position.set(3, 4, 5); scene.add(key);
    var rim = new T.DirectionalLight(p.cyan, 2.0);   rim.position.set(-4, 1, -4); scene.add(rim);
    var fill = new T.DirectionalLight(p.gold, 0.9);  fill.position.set(-2, -3, 2); scene.add(fill);
    return { key: key, rim: rim };
  }

  function starfield(T, scene, count, spread, colour) {
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    var pts = new T.Points(g, new T.PointsMaterial({
      color: colour, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false
    }));
    scene.add(pts);
    return pts;
  }

  /* ══════════════════════════════════════════════════════════════════════
     THE SCENES
     ══════════════════════════════════════════════════════════════════════ */
  var SCENES = {};

  /* ── SIGNET ───────────────────────────────────────────────────────────
     The mark itself, turning. A slow axial rotation plus a cursor-reactive
     tilt, so it reads as an object in a room rather than a spinning logo. */
  SCENES.signet = function (T, opt) {
    var p = palette();
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(38, 1, 0.1, 100);
    cam.position.set(0, 0, 4.75);
    rig(T, scene, p);
    starfield(T, scene, 220, 16, p.cyan);

    var mark = buildSignet(T, opt.accent || p.gold);
    scene.add(mark);

    /* A halo disc behind the mark, additively blended: the god-ray bloom the
       reference art carries, without a post-processing pass. */
    var halo = new T.Mesh(
      new T.RingGeometry(1.28, 2.05, 96),
      new T.MeshBasicMaterial({ color: p.gold, transparent: true, opacity: 0.10,
                                side: T.DoubleSide, blending: T.AdditiveBlending,
                                depthWrite: false }));
    halo.position.z = -0.9;
    scene.add(halo);

    var orbit = new T.Mesh(
      new T.TorusGeometry(1.62, 0.008, 8, 160),
      new T.MeshBasicMaterial({ color: p.cyan, transparent: true, opacity: 0.55 }));
    orbit.rotation.x = Math.PI * 0.42;
    scene.add(orbit);

    return { scene: scene, camera: cam, update: function (t, px, py) {
      /* A SWAY, NOT A SPIN. The first version ran mark.rotation.y = t * 0.42,
         a continuous turn -- which carries the mark through edge-on twice a
         cycle, where an extruded Omega reads as a plain gold slab. On the
         front door that means the brand mark is illegible for a good part of
         every rotation. Oscillating inside roughly +/-32 degrees keeps it
         dimensional and lit from changing angles while never leaving it
         unreadable. The pointer adds to the sway rather than replacing it,
         so it still answers the cursor. */
      mark.rotation.y = Math.sin(t * 0.33) * 0.56 + px * 0.42;
      mark.rotation.x = Math.sin(t * 0.31) * 0.14 - py * 0.34;
      halo.rotation.z = -t * 0.16;
      halo.material.opacity = 0.085 + Math.sin(t * 0.9) * 0.030;
      orbit.rotation.z = t * 0.30;
      cam.position.x = px * 0.34;
      cam.position.y = -py * 0.26;
      cam.lookAt(0, 0, 0);
    }};
  };

  /* ── AGENTS ───────────────────────────────────────────────────────────
     The twelve executors in orbit around the core. Twelve is not a styling
     choice: omega-agents.json defines exactly twelve personas (CLAUDE.md 6),
     and omega-constellation.js already lays the same set out in 2-D. This is
     that diagram with a third axis and a clock. */
  SCENES.agents = function (T, opt) {
    var p = palette();
    var N = 12;
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(42, 1, 0.1, 100);
    cam.position.set(0, 2.45, 5.35);
    rig(T, scene, p);
    starfield(T, scene, 260, 20, p.cyan);

    var core = new T.Group();
    core.add(buildSignet(T, p.solar));
    core.scale.setScalar(0.78);
    scene.add(core);

    var ring = new T.Group();
    scene.add(ring);

    var nodes = [], RAD = 2.5;
    var nodeGeo = new T.OctahedronGeometry(0.205, 0);
    var linePos = [];
    for (var i = 0; i < N; i++) {
      var a = (i / N) * Math.PI * 2;
      var x = Math.cos(a) * RAD, z = Math.sin(a) * RAD;
      var y = Math.sin(a * 3) * 0.20;
      var m = new T.Mesh(nodeGeo, new T.MeshStandardMaterial({
        color: i % 3 === 0 ? p.cyan : p.gold,
        emissive: i % 3 === 0 ? p.cyan : p.gold,
        emissiveIntensity: 0.42, metalness: 0.85, roughness: 0.3
      }));
      m.position.set(x, y, z);
      ring.add(m);
      nodes.push({ mesh: m, phase: a });
      linePos.push(0, 0, 0, x, y, z);
    }
    var lg = new T.BufferGeometry();
    lg.setAttribute('position', new T.BufferAttribute(new Float32Array(linePos), 3));
    ring.add(new T.LineSegments(lg, new T.LineBasicMaterial({
      color: p.gold, transparent: true, opacity: 0.22 })));

    var band = new T.Mesh(
      new T.TorusGeometry(RAD, 0.006, 8, 200),
      new T.MeshBasicMaterial({ color: p.gold, transparent: true, opacity: 0.34 }));
    band.rotation.x = Math.PI / 2;
    ring.add(band);

    return { scene: scene, camera: cam, update: function (t, px, py) {
      ring.rotation.y = t * 0.20 + px * 0.5;
      core.rotation.y = Math.sin(t * 0.42) * 0.62;   /* sway, per the signet note above */
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.mesh.rotation.x = t * 0.8 + n.phase;
        n.mesh.rotation.y = t * 0.6;
        var pulse = 1 + Math.sin(t * 1.6 + n.phase * 2) * 0.16;
        n.mesh.scale.setScalar(pulse);
        n.mesh.material.emissiveIntensity = 0.34 + Math.sin(t * 1.6 + n.phase * 2) * 0.20;
      }
      cam.position.y = 2.45 - py * 0.8;
      cam.lookAt(0, 0, 0);
    }};
  };

  /* ── MATRIX ───────────────────────────────────────────────────────────
     9 x 9 x 9 = 729 nodes, the lattice drawn in the platform's own concept
     art, with the Crystal-Omega at 9-9-9 burning at its centre.

     One InstancedMesh, not 729 Meshes: 729 draw calls per frame would cost
     more than everything else in this file combined. Per-instance colour
     rides an InstancedBufferAttribute so the lit shells can differ without
     729 materials. */
  SCENES.matrix = function (T, opt) {
    var p = palette();
    var S = 9, N = S * S * S, GAP = 0.42;
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(46, 1, 0.1, 100);
    cam.position.set(0, 0, 7.4);
    rig(T, scene, p);

    var geo = new T.OctahedronGeometry(0.055, 0);
    var mat = new T.MeshStandardMaterial({
      metalness: 0.7, roughness: 0.35, transparent: true, opacity: 0.92,
      emissiveIntensity: 0.5
    });
    var mesh = new T.InstancedMesh(geo, mat, N);
    mesh.instanceColor = new T.InstancedBufferAttribute(new Float32Array(N * 3), 3);

    var dummy = new T.Object3D();
    var cGold = new T.Color(p.gold), cCyan = new T.Color(p.cyan), cBright = new T.Color(p.bright);
    var half = (S - 1) / 2, i = 0, live = [];
    for (var x = 0; x < S; x++) for (var y = 0; y < S; y++) for (var z = 0; z < S; z++) {
      dummy.position.set((x - half) * GAP, (y - half) * GAP, (z - half) * GAP);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      /* The outer shell reads cool and sparse; the deeper you go the warmer
         and denser it gets, so the eye is pulled to the core rather than the
         surface. A scatter of bright nodes keeps it from looking regular. */
      var edge = Math.max(Math.abs(x - half), Math.abs(y - half), Math.abs(z - half)) / half;
      var c = edge > 0.82 ? cCyan : (Math.random() < 0.06 ? cBright : cGold);
      mesh.instanceColor.setXYZ(i, c.r, c.g, c.b);
      if (Math.random() < 0.05) live.push(i);
      i++;
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);

    /* The Crystal-Omega node: 9-9-9, the centre of the lattice. */
    var crystal = new T.Mesh(
      new T.OctahedronGeometry(0.50, 0),
      new T.MeshStandardMaterial({ color: p.bright, emissive: p.bright,
        emissiveIntensity: 0.85, metalness: 1, roughness: 0.08 }));
    scene.add(crystal);
    var cage = new T.Mesh(
      new T.OctahedronGeometry(0.86, 0),
      new T.MeshBasicMaterial({ color: p.cyan, wireframe: true,
        transparent: true, opacity: 0.42 }));
    scene.add(cage);

    var shell = new T.Mesh(
      new T.BoxGeometry(S * GAP, S * GAP, S * GAP),
      new T.MeshBasicMaterial({ color: p.gold, wireframe: true,
        transparent: true, opacity: 0.10 }));
    scene.add(shell);

    var grp = new T.Group();
    scene.add(grp);
    grp.add(mesh); grp.add(shell);

    return { scene: scene, camera: cam, update: function (t, px, py) {
      grp.rotation.y = t * 0.18 + px * 0.6;
      grp.rotation.x = Math.sin(t * 0.22) * 0.20 - py * 0.4;
      crystal.rotation.y = t * 0.9;
      crystal.rotation.x = t * 0.5;
      crystal.material.emissiveIntensity = 0.7 + Math.sin(t * 2.1) * 0.25;
      cage.rotation.y = -t * 0.6;
      cage.rotation.z = t * 0.35;
      var s = 1 + Math.sin(t * 1.4) * 0.05;
      cage.scale.setScalar(s);
    }};
  };

  /* ── GATES ────────────────────────────────────────────────────────────
     The Nine Gates as an actual corridor receding into depth, each ring a
     threshold. The camera drifts forward and loops, so the sequence never
     ends -- ascent, not a list. */
  SCENES.gates = function (T, opt) {
    var p = palette();
    var N = 9, SPACING = 1.65;
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(55, 1, 0.1, 100);
    rig(T, scene, p);
    starfield(T, scene, 320, 26, p.cyan);

    var gates = [];
    for (var i = 0; i < N; i++) {
      var lit = i / (N - 1);
      var g = new T.Group();
      var col = new T.Color(p.gold).lerp(new T.Color(p.bright), lit);
      var ring = new T.Mesh(
        new T.TorusGeometry(1.15 - i * 0.02, 0.035, 10, 96),
        new T.MeshStandardMaterial({ color: col, emissive: col,
          emissiveIntensity: 0.2 + lit * 0.5, metalness: 0.95, roughness: 0.2 }));
      g.add(ring);
      var inner = new T.Mesh(
        new T.RingGeometry(0.98, 1.1, 64),
        new T.MeshBasicMaterial({ color: p.cyan, transparent: true,
          opacity: 0.05 + lit * 0.10, side: T.DoubleSide,
          blending: T.AdditiveBlending, depthWrite: false }));
      g.add(inner);
      g.position.z = -i * SPACING;
      scene.add(g);
      gates.push(g);
    }

    var crystal = new T.Mesh(
      new T.OctahedronGeometry(0.30, 0),
      new T.MeshStandardMaterial({ color: p.bright, emissive: p.bright,
        emissiveIntensity: 1.0, metalness: 1, roughness: 0.05 }));
    crystal.position.z = -N * SPACING;
    scene.add(crystal);

    return { scene: scene, camera: cam, update: function (t, px, py) {
      var drift = (t * 0.55) % SPACING;
      cam.position.set(px * 0.5, -py * 0.4, 2.2 - drift);
      cam.lookAt(0, 0, -N * SPACING);
      for (var i = 0; i < gates.length; i++) {
        gates[i].rotation.z = t * (0.10 + i * 0.022) * (i % 2 ? -1 : 1);
      }
      crystal.rotation.y = t * 1.1;
      crystal.rotation.x = t * 0.7;
      crystal.material.emissiveIntensity = 0.85 + Math.sin(t * 2.4) * 0.3;
    }};
  };

  /* ══════════════════════════════════════════════════════════════════════
     2-D FALLBACK — drawn when WebGL is unavailable or three.js fails to load

     Deliberately NOT an imitation of the 3-D scene and it claims nothing
     about the engine: the same palette, the same composition, flat. A member
     on a blocklisted driver sees the mark, not a dead box (FIXES_LOG 131 set
     this precedent for the elemental sphere).
     ══════════════════════════════════════════════════════════════════════ */
  function fallback(cv, kind, accent) {
    var ctx;
    try { ctx = cv.getContext('2d'); } catch (e) { return; }
    if (!ctx) return;
    var w = cv.width, h = cv.height;
    if (!w || !h) return;
    var p = palette();
    var gold = '#' + (accent || p.gold).toString(16).padStart(6, '0');
    var cyan = '#' + p.cyan.toString(16).padStart(6, '0');
    var cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.28;

    ctx.clearRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.1);
    glow.addColorStop(0, gold + '30');
    glow.addColorStop(0.55, cyan + '14');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = gold;
    ctx.lineCap = 'round';

    if (kind === 'matrix') {
      ctx.globalAlpha = 0.5; ctx.lineWidth = Math.max(1, R * 0.012);
      for (var gx = -4; gx <= 4; gx++) for (var gy = -4; gy <= 4; gy++) {
        ctx.beginPath();
        ctx.arc(cx + gx * R * 0.30, cy + gy * R * 0.30, R * 0.035, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.fillStyle = cyan;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.13, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (kind === 'gates') {
      for (var i = 0; i < 9; i++) {
        ctx.globalAlpha = 0.25 + i * 0.075;
        ctx.lineWidth = Math.max(1, R * 0.03);
        ctx.beginPath(); ctx.arc(cx, cy, R * (0.18 + i * 0.11), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      return;
    }
    /* signet + agents: the Ω mark, open at the bottom, with its two feet */
    if (kind === 'agents') {
      ctx.globalAlpha = 0.55; ctx.lineWidth = Math.max(1, R * 0.02);
      for (var k = 0; k < 12; k++) {
        var a = (k / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R * 1.7, cy + Math.sin(a) * R * 1.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * R * 1.7, cy + Math.sin(a) * R * 1.7, R * 0.09, 0, Math.PI * 2);
        ctx.fillStyle = k % 3 === 0 ? cyan : gold; ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.lineWidth = Math.max(2, R * 0.22);
    ctx.beginPath();
    ctx.arc(cx, cy, R, -25 * Math.PI / 180, 205 * Math.PI / 180, false);
    ctx.stroke();
    ctx.lineWidth = Math.max(2, R * 0.20);
    [[-1, 205], [1, -25]].forEach(function (f) {
      var a = f[1] * Math.PI / 180;
      var bx = cx + Math.cos(a) * R, by = cy - Math.sin(a) * R;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + f[0] * R * 0.42, by + R * 0.06);
      ctx.stroke();
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     THE ENGINE
     ══════════════════════════════════════════════════════════════════════ */
  var DPR_CAP = 2;
  var _renderer = null, _glCanvas = null;
  var _mounts = [], _raf = 0, _io = null;
  var _px = 0, _py = 0;               /* pointer, -1..1, whole viewport */

  function dpr() { return Math.min(window.devicePixelRatio || 1, DPR_CAP); }

  function ensureRenderer(T) {
    if (_renderer) return _renderer;
    _glCanvas = document.createElement('canvas');
    _renderer = new T.WebGLRenderer({ canvas: _glCanvas, antialias: true, alpha: true });
    _renderer.setClearColor(0x000000, 0);
    if ('outputColorSpace' in _renderer && T.SRGBColorSpace) {
      _renderer.outputColorSpace = T.SRGBColorSpace;
    }
    /* A lost context is recoverable and common on laptops that switch GPUs.
       Without this the page keeps blitting a dead canvas forever. */
    _glCanvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      _mounts.forEach(function (m) { m.dead = true; fallback(m.canvas, m.kind, m.accent); });
    }, false);
    return _renderer;
  }

  /* Size a mount's own canvas. Called by its ResizeObserver for as long as it
     lives -- never once at DOMContentLoaded, because the approval guard
     reveals with no resize event (CLAUDE.md 8.1 class 3) and a one-shot
     measurement there reads 0. */
  function sizeMount(m) {
    /* Measure the CANVAS, never the mount element, and never write the
       canvas's CSS size back.

       The first version measured m.el.getBoundingClientRect() -- a BORDER box
       -- and assigned it as the canvas's CONTENT height. .fg-stage carries a
       1px border, so every callback made the canvas 2px taller than the box
       it was measured from, which made the element 2px taller, which fired the
       observer again: mounts declared 360px tall were measured at 1194, 1196,
       1198 and 1200 after seven seconds, each a different height because each
       had run a different number of times. A ResizeObserver that writes back
       into the box it observes is a feedback loop; the fix is to let CSS own
       the layout size and let this function own only the drawing buffer. */
    var b = m.canvas.getBoundingClientRect();
    /* A genuinely collapsed box means the mount is not laid out yet -- most
       often because the approval guard still hides .shell/#app/main.main
       (CLAUDE.md 8.1 class 3). Bail WITHOUT touching the drawing buffer: the
       observer fires again the moment the reveal gives it a real size.

       The guard below used to read `Math.max(1, Math.round(b.width))` and then
       test `if (!w || !h)`, which can never be true -- max(1, x) is always
       truthy -- so a hidden mount was assigned a 1x1 buffer instead of being
       skipped, and assigning width/height clears the bitmap for nothing. */
    if (b.width < 1 || b.height < 1) return false;
    var w = Math.round(b.width);
    var h = Math.round(b.height);
    var d = dpr();
    var bw = Math.ceil(w * d), bh = Math.ceil(h * d);
    /* Assigning width/height CLEARS the bitmap, so only assign on a real
       change (FIXES_LOG 133). Buffer is ceil(box * dpr), so buffer >= box
       always -- the invariant verify-runtime.js gates (FIXES_LOG 134). */
    if (m.canvas.width !== bw)  m.canvas.width = bw;
    if (m.canvas.height !== bh) m.canvas.height = bh;
    m.w = w; m.h = h; m.bw = bw; m.bh = bh;
    if (m.scene && m.scene.camera) {
      m.scene.camera.aspect = w / h;
      m.scene.camera.updateProjectionMatrix();
    }
    if (m.dead || !_renderer) fallback(m.canvas, m.kind, m.accent);
    return true;
  }

  function frame(ms) {
    _raf = requestAnimationFrame(frame);
    var t = ms / 1000;
    var maxW = 1, maxH = 1, any = false;
    for (var i = 0; i < _mounts.length; i++) {
      var m = _mounts[i];
      if (!m.visible || m.dead || !m.scene || !m.bw) continue;
      any = true;
      if (m.bw > maxW) maxW = m.bw;
      if (m.bh > maxH) maxH = m.bh;
    }
    if (!any) return;
    /* Grow the shared GL buffer to the largest visible mount and render each
       into its top-left corner, then blit that sub-rect out. One context. */
    if (_glCanvas.width !== maxW || _glCanvas.height !== maxH) {
      _renderer.setSize(maxW, maxH, false);
    }
    for (var j = 0; j < _mounts.length; j++) {
      var n = _mounts[j];
      if (!n.visible || n.dead || !n.scene || !n.bw) continue;
      try {
        n.scene.update(t + n.offset, _px, _py);
        /* WebGL's viewport origin is BOTTOM-left; a 2-D canvas reads from the
           TOP-left. Rendering into GL rows [maxH-bh, maxH] therefore puts the
           image in the TOP bh rows of the shared canvas as drawImage sees it,
           so the source rect is y=0 -- not y=maxH-bh.

           A first version used maxH-bh on both sides. It looked correct in a
           standalone probe where every mount happened to be the same size, so
           maxH === bh and the wrong expression evaluated to 0 anyway. In the
           real page, with a tall hero beside shorter marks, it sampled empty
           rows and every mount painted 0.00% of its pixels. Same size by
           coincidence is not the same as correct (CLAUDE.md 8.4). */
        _renderer.setViewport(0, maxH - n.bh, n.bw, n.bh);
        _renderer.setScissor(0, maxH - n.bh, n.bw, n.bh);
        _renderer.setScissorTest(true);
        _renderer.render(n.scene.scene, n.scene.camera);
        var c2 = n.ctx || (n.ctx = n.canvas.getContext('2d'));
        if (c2) {
          c2.clearRect(0, 0, n.bw, n.bh);
          c2.drawImage(_glCanvas, 0, 0, n.bw, n.bh, 0, 0, n.bw, n.bh);
        }
      } catch (e) {
        n.dead = true;
        fallback(n.canvas, n.kind, n.accent);
      }
    }
  }

  function startLoop() {
    if (_raf || REDUCED) return;
    _raf = requestAnimationFrame(frame);
  }

  /* Reduced motion gets one composed still frame: the scene is built and
     rendered exactly once, never a loop. */
  function renderStill(m) {
    if (!m.scene || !m.bw || !_renderer) return;
    try {
      _renderer.setSize(m.bw, m.bh, false);
      m.scene.update(0.6, 0, 0);
      _renderer.setScissorTest(false);
      _renderer.setViewport(0, 0, m.bw, m.bh);
      _renderer.render(m.scene.scene, m.scene.camera);
      var c2 = m.ctx || (m.ctx = m.canvas.getContext('2d'));
      if (c2) { c2.clearRect(0, 0, m.bw, m.bh); c2.drawImage(_glCanvas, 0, 0); }
    } catch (e) { m.dead = true; fallback(m.canvas, m.kind, m.accent); }
  }

  function mount(el) {
    if (el.__sculpt) return;
    el.__sculpt = 1;
    var kind = (el.getAttribute('data-omega-sculpture') || 'signet').trim().toLowerCase();
    if (!SCENES[kind]) kind = 'signet';

    var accentAttr = (el.getAttribute('data-sculpt-accent') || '').trim();
    var accent = /^#[0-9a-f]{6}$/i.test(accentAttr) ? parseInt(accentAttr.slice(1), 16) : null;

    var h = (el.getAttribute('data-sculpt-height') || '').trim();
    if (!h) h = (window.innerWidth < 700 ? '300px' : '420px');
    el.style.position = el.style.position || 'relative';
    el.style.minHeight = h;
    el.style.display = 'block';

    var cv = document.createElement('canvas');
    cv.className = 'omega-sculpture-canvas';
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', el.getAttribute('data-sculpt-label') || SCULPT_LABEL[kind]);
    cv.style.cssText = 'display:block;width:100%;height:' + h + ';border-radius:inherit';
    el.appendChild(cv);

    var m = { el: el, canvas: cv, kind: kind, accent: accent, visible: false,
              dead: false, scene: null, ctx: null, w: 0, h: 0, bw: 0, bh: 0,
              offset: Math.random() * 40 };
    _mounts.push(m);

    /* Attached for life, not one-shot: the approval guard's reveal fires no
       resize event (CLAUDE.md 8.1 class 3). */
    if (window.ResizeObserver) {
      m.ro = new ResizeObserver(function () {
        if (sizeMount(m) && REDUCED) renderStill(m);
      });
      m.ro.observe(el);
      m.ro.observe(cv);
    }
    sizeMount(m);

    if (!hasWebGL()) { m.dead = true; fallback(cv, kind, accent); return; }

    loadThree().then(function (T) {
      ensureRenderer(T);
      m.scene = SCENES[kind](T, { accent: accent });
      sizeMount(m);
      if (REDUCED) { renderStill(m); return; }
      observe(m);
      startLoop();
    })['catch'](function () {
      /* A same-origin import can still fail to parse, and WebGL can die
         between the probe and the first render. Never leave a dead box. */
      m.dead = true;
      fallback(cv, kind, accent);
    });
  }

  var SCULPT_LABEL = {
    signet: 'The Omega signet, rendered in three dimensions and slowly rotating',
    agents: 'The twelve agent executors in orbit around the Omega core',
    matrix: 'The nine by nine by nine matrix of 729 nodes, with the Crystal-Omega at its centre',
    gates:  'The Nine Gates receding into depth toward the Crystal-Omega'
  };

  /* Only mounts actually on screen are ever rendered. On a page with several
     marks this is the difference between one visible scene and all of them
     costing a texture upload every frame. */
  function observe(m) {
    if (!window.IntersectionObserver) { m.visible = true; return; }
    if (!_io) {
      _io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          for (var i = 0; i < _mounts.length; i++) {
            if (_mounts[i].el === en.target) { _mounts[i].visible = en.isIntersecting; break; }
          }
        });
      }, { rootMargin: '120px' });
    }
    _io.observe(m.el);
  }

  if (!REDUCED) {
    window.addEventListener('pointermove', function (e) {
      _px = (e.clientX / window.innerWidth - 0.5) * 2;
      _py = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    /* A hidden tab still fires rAF in some browsers and always wastes work
       when it does not. Park the loop. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (_raf) { cancelAnimationFrame(_raf); _raf = 0; } }
      else startLoop();
    });
  }

  function scan(root) {
    var els = (root || document).querySelectorAll('[data-omega-sculpture]');
    for (var i = 0; i < els.length; i++) mount(els[i]);
  }

  function boot() {
    scan(document);
    if (window.MutationObserver) {
      new MutationObserver(function (recs) {
        for (var i = 0; i < recs.length; i++) {
          var added = recs[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (n.nodeType !== 1) continue;
            if (n.hasAttribute && n.hasAttribute('data-omega-sculpture')) mount(n);
            else if (n.querySelectorAll) scan(n);
          }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else { boot(); }

  window.OmegaSculpture = {
    scenes: Object.keys(SCENES),
    mount: function (el) { if (el) mount(el); },
    /* Report, for the runtime harness and for anyone debugging a page. */
    status: function () {
      return _mounts.map(function (m) {
        return { kind: m.kind, live: !!m.scene && !m.dead, fallback: m.dead,
                 visible: m.visible, buffer: m.bw + 'x' + m.bh, box: m.w + 'x' + m.h };
      });
    }
  };
})();
