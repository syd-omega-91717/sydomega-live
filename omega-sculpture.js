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
       <div data-omega-sculpture="gates"></div>      the twelve gates, in depth

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

  /* The twelve gates, read from the module that owns them. window.OmegaCanon
     is published by omega-canon.js, which bg.js loads on every page; it
     exposes onReady() and tracks[]. The inline list is a fallback for the case
     where that fetch never resolves -- transcribed from omega-canon.json's
     tracks[].gate, not invented here.

     NOTE, recorded rather than silently resolved: gates.html shows a DIFFERENT
     set of twelve names (Gate of Awareness / Knowledge / Discipline / ...).
     Which set is canonical is an owner's call, so this reads the documented
     single source of truth and the divergence is filed in GAP_ANALYSIS.md. */
  /* The twelve executors, from omega-agents.json -- the roster agents.html and
     omega-constellation.js already consume. Inline list is the same fallback
     posture those take when the fetch fails. */
  var AGENT_FALLBACK = ['Sentinel', 'Merchant', 'Scout', 'Warden', 'Sovereign',
    'Auditor', 'Proxy', 'Oracle', 'Beacon', 'Analyst', 'Tutor', 'Historian'];

  function canonAgents(cb) {
    fetch('/omega-agents.json').then(function (r) { return r.json(); })
      .then(function (j) {
        var list = j && (j.agents || j);
        if (Array.isArray(list) && list.length) {
          cb(list.slice(0, 12).map(function (a) { return a.name || ''; }));
        }
      })['catch'](function () { /* fallback already in place */ });
  }

  var GATE_FALLBACK = ['Gate of Ignition', 'Gate of Abundance', 'Gate of Discourse',
    'Gate of the Hearth', 'Gate of Radiance', 'Gate of Precision', 'Gate of Balance',
    'Gate of Transmutation', 'Gate of Vision', 'Gate of Sovereignty',
    'Gate of Innovation', 'Gate of Dreams'];

  function canonGates(cb) {
    try {
      var C = window.OmegaCanon;
      if (!C || typeof C.onReady !== 'function') return;
      C.onReady(function (api) {
        var out = [];
        for (var i = 1; i <= 12; i++) {
          var g = typeof api.gate === 'function' ? api.gate(i) : null;
          if (g) out.push(g);
        }
        if (out.length) cb(out);
      });
    } catch (e) { /* fallback already in place */ }
  }

  /* THE NINE ELEMENTS, read from the two modules that own them.

     omega-elements.json carries the names and the three-tier grouping;
     window.OmegaRealm.palette carries the colours (published by omega-realm.js
     rather than copied -- see that file). Both are the platform's own.

     WHAT THIS SCENE DELIBERATELY DOES NOT DRAW: the project's concept art
     shows "Water Enki / Fire Hephaestus / Earth Geb / Air Vayu / Aether Thoth
     / Sand Ptah". Measured against the repository, Earth, Air, Aether, Enki,
     Geb, Vayu, Thoth and Ptah appear ZERO times in omega-elements.json or
     omega-canon.json. The canon has NINE: Fire, Water, Wind, Metal, Sand,
     Soul, Space, Void and The Ninth, in three tiers. Drawing the art's set
     would invent a canon this platform does not have -- the same mistake the
     gate corridor made (FIXES_LOG 139). The art is the brief; the canon is
     the fact. */
  var ELEMENT_FALLBACK = [
    { n:1, name:'FIRE',      tier:'PHYSICAL',      key:'Fire'    },
    { n:2, name:'WATER',     tier:'PHYSICAL',      key:'Water'   },
    { n:3, name:'WIND',      tier:'PHYSICAL',      key:'Wind'    },
    { n:4, name:'METAL',     tier:'PHYSICAL',      key:'Metal'   },
    { n:5, name:'SAND',      tier:'PHYSICAL',      key:'Sand'    },
    { n:6, name:'SOUL',      tier:'METAPHYSICAL',  key:'Soul'    },
    { n:7, name:'SPACE',     tier:'METAPHYSICAL',  key:'Space'   },
    { n:8, name:'VOID',      tier:'METAPHYSICAL',  key:'Void'    },
    { n:9, name:'THE NINTH', tier:'TRANSCENDENT',  key:'The All' }
  ];

  /* omega-elements.json names the ninth element "THE NINTH"; ELEM_PALETTE
     keys it "The All". One thing, two names -- recorded, not silently
     reconciled. The map below is the only place that seam is crossed. */
  function elementColour(key, fallbackHex) {
    try {
      var pal = window.OmegaRealm && window.OmegaRealm.palette;
      var e = pal && pal[key];
      if (e && /^#[0-9a-f]{6}$/i.test(e.core)) return parseInt(e.core.slice(1), 16);
    } catch (e) {}
    return parseInt(fallbackHex.slice(1), 16);
  }

  function canonElements(cb) {
    fetch('/omega-elements.json').then(function (r) { return r.json(); })
      .then(function (j) {
        var list = j && (j.elements || j);
        if (Array.isArray(list) && list.length >= 9) {
          cb(list.slice(0, 9).map(function (e, i) {
            return { name: e.name || ELEMENT_FALLBACK[i].name,
                     tier: e.tier || ELEMENT_FALLBACK[i].tier,
                     key:  ELEMENT_FALLBACK[i].key };
          }));
        }
      })['catch'](function () { /* fallback already in place */ });
  }

  /* THE TWELVE TIERS, from window.OmegaCanon. The concept art labels an
     ascension as "9 STAGES"; omega-canon.json's `tiers` is TWELVE (Initiate ..
     Ascendant) and omega-canon.js exposes tier(n). Twelve is what the platform
     actually grants against, so twelve is what is built. */
  var TIER_FALLBACK = ['Initiate','Seeker','Adept','Warden','Vanguard','Architect',
    'Sovereign','Luminary','Radiant','Unyielding','Transcendent','Ascendant'];

  function canonTiers(cb) {
    try {
      var C = window.OmegaCanon;
      if (!C || typeof C.onReady !== 'function') return;
      C.onReady(function (api) {
        var out = [];
        for (var i = 1; i <= 12; i++) {
          var t = typeof api.tier === 'function' ? api.tier(i) : null;
          if (t && t.name) out.push(t.name);
        }
        if (out.length) cb(out);
      });
    } catch (e) {}
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

    /* ── THE FIVE STATES ──────────────────────────────────────────────
       The project's logo sheet specifies the mark's animation states:
       IDLE (rotate & glow) / PULSE (energy pulse) / REACTOR (core energy) /
       CUBE (9x9x9 reveal) / SEAL (ultimate state). They are built here as
       exactly that -- one mark, five behaviours -- rather than five marks.

       Choose with data-sculpt-state="idle|pulse|reactor|cube|seal".
       Default is idle, which is the only one appropriate to a page the
       member did not ask to be impressed by. The state changes what the
       mark DOES, never what it claims: none of them asserts a number. */
    var lattice = new T.Group();
    (function buildLattice() {
      var S = 3, GAP = 0.62, half = (S - 1) / 2;   /* 3x3x3 shell, readable at mark scale */
      var geo = new T.OctahedronGeometry(0.035, 0);
      var mat = new T.MeshStandardMaterial({ color: p.cyan, emissive: p.cyan,
        emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.3 });
      for (var x = 0; x < S; x++) for (var y = 0; y < S; y++) for (var z = 0; z < S; z++) {
        if (x === 1 && y === 1 && z === 1) continue;       /* the mark occupies the centre */
        var n = new T.Mesh(geo, mat);
        n.position.set((x - half) * GAP, (y - half) * GAP, (z - half) * GAP);
        lattice.add(n);
      }
      lattice.visible = false;
      scene.add(lattice);
    })();

    var seal = new T.Mesh(
      new T.TorusGeometry(1.42, 0.022, 10, 12),      /* 12 segments: the twelve */
      new T.MeshStandardMaterial({ color: p.bright, emissive: p.bright,
        emissiveIntensity: 0.55, metalness: 1, roughness: 0.12 }));
    seal.visible = false;
    scene.add(seal);

    var state = (opt && opt.state) || 'idle';
    if (state === 'cube') lattice.visible = true;
    if (state === 'seal') { seal.visible = true; lattice.visible = true; }

    return { scene: scene, camera: cam, update: function (t, px, py) {
      /* state-specific behaviour, applied before the shared sway */
      var taskPulse = 0;
      if (window.OmegaSculptureDataViz && window.OmegaSculptureDataViz.getActiveTaskCount) {
        taskPulse = window.OmegaSculptureDataViz.getActiveTaskCount();
      }
      if (state === 'pulse') {
        var pulseAmp = 0.055 + taskPulse * 0.035;
        var b = 1 + Math.sin(t * 2.4) * pulseAmp;
        mark.scale.setScalar(b);
        halo.material.opacity = 0.10 + Math.sin(t * 2.4) * (0.06 + taskPulse * 0.04);
      } else if (state === 'reactor') {
        orbit.rotation.z = t * 1.6;
        orbit.rotation.x = Math.PI * 0.42 + Math.sin(t * 0.8) * 0.35;
        halo.material.opacity = 0.16 + Math.sin(t * 5.2) * 0.07;
        halo.scale.setScalar(1 + Math.sin(t * 5.2) * 0.05);
      } else if (state === 'cube') {
        lattice.rotation.y = -t * 0.34;
        lattice.rotation.x = Math.sin(t * 0.4) * 0.22;
        lattice.scale.setScalar(1 + Math.sin(t * 1.1) * 0.04);
      } else if (state === 'seal') {
        lattice.rotation.y = -t * 0.2;
        seal.rotation.z = t * 0.12;
        seal.material.emissiveIntensity = 0.5 + Math.sin(t * 1.6) * 0.22;
        halo.material.opacity = 0.14 + Math.sin(t * 1.2) * 0.04;
      }

      /* A SWAY, NOT A SPIN. The first version ran mark.rotation.y = t * 0.42,
         a continuous turn -- which carries the mark through edge-on twice a
         cycle, where an extruded Omega reads as a plain gold slab. On the
         front door that means the brand mark is illegible for a good part of
         every rotation. Oscillating inside roughly +/-32 degrees keeps it
         dimensional and lit from changing angles while never leaving it
         unreadable. The pointer adds to the sway rather than replacing it,
         so it still answers the cursor. */
      var swayAmp = state === 'seal' ? 0.16 : 0.56;   /* a seal faces you */
      mark.rotation.y = Math.sin(t * 0.33) * swayAmp + px * (state === 'seal' ? 0.14 : 0.42);
      mark.rotation.x = Math.sin(t * 0.31) * 0.14 - py * 0.34;
      halo.rotation.z = -t * 0.16;
      halo.material.opacity = 0.085 + Math.sin(t * 0.9) * 0.030;
      orbit.rotation.z = t * 0.30;
      cam.position.x = px * 0.34;
      cam.position.y = -py * 0.26;
      cam.lookAt(0, 0, 0);
    }};
  };

  /* ── ELEMENTS ─────────────────────────────────────────────────────────
     The nine, arranged as the canon groups them rather than as a flat ring:
     PHYSICAL (5) on the outer orbit, METAPHYSICAL (3) on a smaller, higher
     one, TRANSCENDENT (1) alone at the apex. The tiers ARE the composition --
     a member can see the shape of the system before reading a single word. */
  SCENES.elements = function (T, opt) {
    var p = palette();
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(44, 1, 0.1, 100);
    cam.position.set(0, 1.7, 5.7);
    rig(T, scene, p);
    starfield(T, scene, 240, 20, p.cyan);

    var grp = new T.Group();
    scene.add(grp);

    var RING = { PHYSICAL: { r: 2.65, y: -0.55 },
                 METAPHYSICAL: { r: 1.45, y: 0.65 },
                 TRANSCENDENT: { r: 0.0,  y: 1.85 } };
    var FB_HEX = ['#FF6B35','#00E5FF','#E0E0E0','#E2C86D','#FFD54F',
                  '#CE93D8','#00E5FF','#334466','#E2C86D'];

    var nodes = [], links = [], linePos = [];
    var byTier = { PHYSICAL: 0, METAPHYSICAL: 0, TRANSCENDENT: 0 };
    var count  = { PHYSICAL: 5, METAPHYSICAL: 3, TRANSCENDENT: 1 };

    ELEMENT_FALLBACK.forEach(function (el, i) {
      var ring = RING[el.tier] || RING.PHYSICAL;
      var idx = byTier[el.tier]++, total = count[el.tier] || 1;
      var a = (idx / total) * Math.PI * 2;
      var x = Math.cos(a) * ring.r, z = Math.sin(a) * ring.r, y = ring.y;
      var col = elementColour(el.key, FB_HEX[i]);

      var m = new T.Mesh(
        new T.IcosahedronGeometry(el.tier === 'TRANSCENDENT' ? 0.42 : 0.24, 0),
        new T.MeshStandardMaterial({ color: col, emissive: col,
          emissiveIntensity: el.tier === 'TRANSCENDENT' ? 0.75 : 0.45,
          metalness: 0.88, roughness: 0.24 }));
      m.position.set(x, y, z);
      grp.add(m);
      nodes.push({ mesh: m, phase: a + i, tier: el.tier });
      links.push({ object: m, href: '/elements.html', label: el.name });
      /* a hairline from every element to the apex: the ninth is what the
         other eight resolve into, and the geometry should say so */
      if (el.tier !== 'TRANSCENDENT') {
        linePos.push(x, y, z, 0, RING.TRANSCENDENT.y, 0);
      }
    });

    var lg = new T.BufferGeometry();
    lg.setAttribute('position', new T.BufferAttribute(new Float32Array(linePos), 3));
    grp.add(new T.LineSegments(lg, new T.LineBasicMaterial({
      color: p.gold, transparent: true, opacity: 0.18 })));

    [RING.PHYSICAL, RING.METAPHYSICAL].forEach(function (r) {
      var band = new T.Mesh(new T.TorusGeometry(r.r, 0.005, 8, 180),
        new T.MeshBasicMaterial({ color: p.gold, transparent: true, opacity: 0.28 }));
      band.rotation.x = Math.PI / 2; band.position.y = r.y;
      grp.add(band);
    });

    canonElements(function (list) {
      for (var i = 0; i < links.length && i < list.length; i++) links[i].label = list[i].name;
    });

    return { scene: scene, camera: cam, links: links, update: function (t, px, py) {
      grp.rotation.y = t * 0.16 + px * 0.5;
      var masteries = {};
      if (window.OmegaSculptureDataViz && window.OmegaSculptureDataViz.getAllElementMasteries) {
        masteries = window.OmegaSculptureDataViz.getAllElementMasteries();
      }
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var el = ELEMENT_FALLBACK[i];
        var mastery = (el && masteries[el.key]) ? masteries[el.key] : 0;
        n.mesh.rotation.y = t * 0.6 + n.phase;
        n.mesh.rotation.x = t * 0.35;
        if (!n.mesh.userData.omegaHovered) {
          var base = 1 + Math.sin(t * 1.3 + n.phase) * 0.10;
          n.mesh.scale.setScalar(base + mastery * 0.18);
        }
      }
      cam.position.y = 1.7 - py * 0.7;
      cam.lookAt(0, 0.5, 0);
    }};
  };

  /* ── ASCENSION ────────────────────────────────────────────────────────
     The twelve tiers as a tower you climb, not a list you scroll. Each ring
     is one tier, widest at Initiate and tightest at Ascendant, so the climb
     reads as a narrowing.

     IT CLAIMS NOTHING ABOUT THE MEMBER. The concept art draws a filled
     progress tower; the cinematic-system skill is explicit that ascension
     progress must be tied to real data and never invented, and this module
     has no access to a member's tier. So the tower renders the STRUCTURE --
     all twelve, equally lit -- rather than a progress level it cannot
     support. FIXES_LOG 139's lesson: the art is the brief, the data is the
     fact. Wiring a real tier is a follow-up, not a guess. */
  SCENES.ascension = function (T, opt) {
    var p = palette();
    var N = 12, STEP = 0.46;
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(42, 1, 0.1, 100);
    cam.position.set(0, 0.5, 8.6);
    rig(T, scene, p);
    starfield(T, scene, 260, 22, p.cyan);

    var tower = new T.Group();
    scene.add(tower);

    var rings = [], links = [];
    var gold = new T.Color(p.gold), bright = new T.Color(p.bright);
    for (var i = 0; i < N; i++) {
      var k = i / (N - 1);
      var rad = 1.55 - k * 0.95;                 /* narrows as it rises */
      var col = gold.clone().lerp(bright, k);
      var ring = new T.Mesh(
        new T.TorusGeometry(rad, 0.028, 10, 80),
        new T.MeshStandardMaterial({ color: col, emissive: col,
          emissiveIntensity: 0.22 + k * 0.45, metalness: 0.94, roughness: 0.22 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -((N - 1) * STEP) / 2 + i * STEP;
      tower.add(ring);
      rings.push({ mesh: ring, i: i });
      links.push({ object: ring, href: '/ascension.html', label: TIER_FALLBACK[i] });
    }

    var apex = new T.Mesh(
      new T.OctahedronGeometry(0.30, 0),
      new T.MeshStandardMaterial({ color: p.bright, emissive: p.bright,
        emissiveIntensity: 0.95, metalness: 1, roughness: 0.06 }));
    apex.position.y = -((N - 1) * STEP) / 2 + N * STEP + 0.12;
    scene.add(apex);

    var spine = new T.Mesh(
      new T.CylinderGeometry(0.012, 0.012, (N - 1) * STEP + 0.9, 8),
      new T.MeshBasicMaterial({ color: p.cyan, transparent: true, opacity: 0.30 }));
    spine.position.y = apex.position.y - ((N - 1) * STEP + 0.9) / 2 + 0.12;
    scene.add(spine);

    canonTiers(function (names) {
      for (var i = 0; i < links.length && i < names.length; i++) links[i].label = names[i];
    });

    return { scene: scene, camera: cam, links: links, update: function (t, px, py) {
      var tierProgress = 0;
      if (window.OmegaSculptureDataViz && window.OmegaSculptureDataViz.getTierProgress) {
        tierProgress = window.OmegaSculptureDataViz.getTierProgress() / 100;
      }
      tower.rotation.y = (tierProgress * Math.PI * 2) + t * 0.22 + px * 0.55;
      for (var i = 0; i < rings.length; i++) {
        var r = rings[i];
        /* a slow rise of light up the tower -- a climb, expressed as motion */
        var wave = Math.sin(t * 0.9 - r.i * 0.42);
        var ringProgress = tierProgress * N;
        r.mesh.material.emissiveIntensity = 0.22 + (r.i / (N - 1)) * 0.45 + wave * 0.16 + (ringProgress > r.i ? 0.18 : 0);
        if (!r.mesh.userData.omegaHovered) r.mesh.scale.setScalar(1 + wave * 0.018 + (ringProgress > r.i ? 0.08 : 0));
      }
      apex.rotation.y = t * 1.0 + (tierProgress * 3.14);
      apex.rotation.x = t * 0.6;
      apex.material.emissiveIntensity = tierProgress > 0.98 ? 1.0 : (0.85 + Math.sin(t * 2.2) * 0.28);
      cam.position.y = 0.5 - py * 0.9;
      cam.lookAt(0, 0.45, 0);
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

    /* Each node is a real door. The destination is /agents.html for all
       twelve -- the same href omega-constellation.js:209 uses for the same
       roster. agents.html carries no per-agent anchor (only #app and
       #agent-greeting), so a deep link like #Sentinel would be a destination
       this platform does not have. */
    var links = nodes.map(function (n, i) {
      return { object: n.mesh, href: '/agents.html', label: AGENT_FALLBACK[i] };
    });
    canonAgents(function (names) {
      for (var i = 0; i < links.length && i < names.length; i++) links[i].label = names[i];
    });

    return { scene: scene, camera: cam, links: links, update: function (t, px, py) {
      var taskPulse = 0;
      if (window.OmegaSculptureDataViz && window.OmegaSculptureDataViz.getActiveTaskCount) {
        taskPulse = window.OmegaSculptureDataViz.getActiveTaskCount();
      }
      ring.rotation.y = t * 0.20 + px * 0.5;
      core.rotation.y = Math.sin(t * 0.42) * 0.62 + taskPulse * 0.18;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.mesh.rotation.x = t * 0.8 + n.phase;
        n.mesh.rotation.y = t * 0.6;
        /* Skip the pulse on a hovered node: setHover owns its scale while the
           pointer is on it, and two writers on one property is a flicker, not
           an effect. The flag lives on the mesh because the update closure
           cannot see the mount. */
        if (!n.mesh.userData.omegaHovered) {
          var pulseAmp = 0.16 + taskPulse * 0.12;
          n.mesh.scale.setScalar(1 + Math.sin(t * 1.6 + n.phase * 2) * pulseAmp);
        }
        var emAmp = 0.20 + taskPulse * 0.15;
        n.mesh.material.emissiveIntensity = 0.34 + Math.sin(t * 1.6 + n.phase * 2) * emAmp;
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
    var half = (S - 1) / 2, i = 0;
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

    /* One door, not 729: the Crystal-Omega at the centre. The lattice itself
       is the platform's real structure -- omega-canon.json's structure block
       reads "each phase is a full 9x9x9 cube on 3 axes", 729
       nodes_per_track_per_phase, on Knowledge / Mastery / Contribution -- but
       an individual node is not a page, so only the core is a link. */
    var links = [{ object: crystal, href: '/matrix.html', label: 'The 9x9x9 lattice' }];

    return { scene: scene, camera: cam, links: links, update: function (t, px, py) {
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
     The gates as an actual corridor receding into depth, each ring a
     threshold. The camera drifts forward and loops, so the sequence never
     ends -- ascent, not a list.

     TWELVE, NOT NINE. The first version of this scene drew NINE rings and the
     page called them "THE NINE GATES", taken from the platform's concept art.
     The platform's own canon says otherwise, and it is not ambiguous:
       omega-canon.json  tracks[].gate      -> 12 named gates
       omega-canon.json  gate_names         -> 12
       omega-canon.json  gate_thresholds    -> 12
       nav.js            '12 GATES'         -> /elements.html#gates
       gates.html                           -> "12 gates"
     "Nine Gates" appeared nowhere in this repository except the page this
     module shipped. That is CLAUDE.md 8.1 class 8 -- a second, divergent copy
     of a canonical table -- and it is read from the owner now: window
     .OmegaCanon, the single source of truth bg.js loads on every page
     (omega-canon.js). GATE_FALLBACK is used only if that never resolves. */
  SCENES.gates = function (T, opt) {
    var p = palette();
    var N = 12, SPACING = 1.42;
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

    /* Every ring is a real destination. The label is the gate's own name from
       the canon, so the 3-D scene and the page it leads to agree. */
    var links = gates.map(function (g, i) {
      return { object: g, href: '/gates.html', label: GATE_FALLBACK[i] };
    });
    canonGates(function (names) {
      for (var i = 0; i < links.length && i < names.length; i++) links[i].label = names[i];
    });

    return { scene: scene, camera: cam, links: links, update: function (t, px, py) {
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

  /* ══════════════════════════════════════════════════════════════════════
     THE ENVIRONMENT — the half of the metal that was missing

     Every mark in this layer is MeshStandardMaterial at metalness 0.96. In a
     physically-based workflow a metal has NO diffuse term: essentially all of
     its appearance is the environment reflected in it. With directional lights
     and no environment map, a 0.96-metal can only show the few pixels where a
     light happens to specular-reflect straight back at the camera -- so the
     signet was rendering at mean luminance 57.7/255 with 7.03% of its pixels
     carrying any light at all, measured. It was not "dark by design"; half of
     its material model was absent.

     This builds that half procedurally, in-canvas: a dark room with a warm key
     panel above-front-right, a cyan rim behind-left and a dim gold fill, run
     through PMREMGenerator to produce the pre-filtered radiance map that
     roughness sampling needs. PMREMGenerator is exported by the vendored
     three.module.js already (`Oa as PMREMGenerator` in its export map) -- no
     second vendored file, no binary asset, no CSP question, and it costs one
     render at startup, not one per frame.

     Built ONCE for the whole page and shared by every scene: it is the same
     room in every mount, and a PMREM cubemap is the single most expensive
     thing here to build.
     ══════════════════════════════════════════════════════════════════════ */
  var _env = null, _envDone = false;

  function environment(T) {
    if (_envDone) return _env;
    _envDone = true;
    if (!_renderer || !T.PMREMGenerator) return null;
    try {
      var p = palette();
      var room = new T.Scene();
      var junk = [];

      /* The room itself. A near-mirror reflecting literal nothing is still
         black, so the box is not pure void -- it is a faint cool grey that
         gives the unlit side of the metal something to pick up. */
      var shellG = new T.BoxGeometry(24, 24, 24);
      var shellM = new T.MeshBasicMaterial({ color: 0x0d1016, side: T.BackSide });
      room.add(new T.Mesh(shellG, shellM));
      junk.push(shellG, shellM);

      /* Emissive panels. PMREMGenerator renders to a half-float target, so a
         colour scaled past 1.0 survives instead of clamping -- that is what
         makes a panel read as a light source in the reflection rather than a
         pale rectangle. */
      function panel(colour, gain, w, h, x, y, z) {
        var g = new T.PlaneGeometry(w, h);
        var mt = new T.MeshBasicMaterial({ color: colour, side: T.DoubleSide });
        mt.color.multiplyScalar(gain);
        var mesh = new T.Mesh(g, mt);
        mesh.position.set(x, y, z);
        mesh.lookAt(0, 0, 0);
        room.add(mesh);
        junk.push(g, mt);
      }

      panel(p.bright, 7.0, 13, 9, 5, 7, 8);     /* key    — warm, high, front-right */
      panel(p.cyan,   4.2, 11, 11, -8, 1, -7);  /* rim    — cold, behind-left       */
      panel(p.gold,   1.6, 14, 5, -6, -6, 5);   /* fill   — dim, low, front-left    */
      panel(p.bright, 2.2, 22, 0.7, 0, 0.4, -11); /* horizon streak — the long
                                                     specular line that reads as
                                                     a rim on a curved mark */

      var pm = new T.PMREMGenerator(_renderer);
      var rt = pm.fromScene(room, 0.04);
      _env = rt.texture;
      pm.dispose();

      /* PMREMGenerator leaves the renderer bound to its own target. The frame
         loop sets viewport and scissor every mount but never the target, so
         without this every subsequent render goes to a texture nobody blits
         and the whole page paints nothing. */
      _renderer.setRenderTarget(null);

      junk.forEach(function (o) { if (o && o.dispose) o.dispose(); });
      return _env;
    } catch (e) {
      _renderer.setRenderTarget(null);
      return null;
    }
  }

  function ensureRenderer(T) {
    if (_renderer) return _renderer;
    _glCanvas = document.createElement('canvas');
    _renderer = new T.WebGLRenderer({ canvas: _glCanvas, antialias: true, alpha: true });
    _renderer.setClearColor(0x000000, 0);
    if ('outputColorSpace' in _renderer && T.SRGBColorSpace) {
      _renderer.outputColorSpace = T.SRGBColorSpace;
    }
    /* Filmic tone mapping -- the single most recognisable "AAA renderer" cue
       (Unreal/Unity both default to it, and it is what the reference render
       pipelines named in the brief actually ship). Without it three.js
       defaults to NoToneMapping, which clips highlights linearly instead of
       rolling them off -- exactly the wrong pairing for the metalness:0.96
       materials + PMREMGenerator environment already in this file (item 5,
       GAP_ANALYSIS.md): a PBR metal under a real environment map produces
       HDR-range values, and clipping them reads as blown-out hotspots on the
       emblem instead of the smooth highlight rolloff a filmic curve gives.
       Confirmed present in the vendored bundle (grep for the literal names,
       not a class declaration -- the file is minified). */
    if ('toneMapping' in _renderer && T.ACESFilmicToneMapping) {
      _renderer.toneMapping = T.ACESFilmicToneMapping;
      _renderer.toneMappingExposure = 1.1;
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

  /* ══════════════════════════════════════════════════════════════════════
     BLOOM — done in the blit, which is the one place it is free of the
     viewport problem

     The textbook answer is EffectComposer + UnrealBloomPass. It is the wrong
     answer HERE, for a structural reason: that chain owns its own render
     targets sized to the renderer, and this engine deliberately runs ONE
     context shared by every mount, rendering each into a viewport sub-rect of
     a canvas sized to the LARGEST visible mount. A composer would have to be
     resized per mount per frame, and every blur tap near a rect edge would
     read the neighbouring mount's pixels. (It is also not in the vendored
     bundle -- `EffectComposer` appears 0 times in three.module.js -- so it
     would mean vendoring 7 more examples/jsm files whose bare `from 'three'`
     specifiers do not resolve without an import map.)

     Each mount already owns a private 2-D canvas that the GL result is blitted
     into. Compositing the glow THERE is correct by construction: the source
     rect is exactly this mount, so no bleed between mounts is possible, and it
     costs no render targets at all.

     Two octaves, because one is a smudge and two is a bloom: a tight core and
     a wide halo, both accumulated with 'lighter'.

     The filter pair is a real threshold, not a guess. For 8-bit v in [0,1],
     brightness(b) then contrast(c) gives out = c*b*v + (0.5 - 0.5c), which
     crosses zero at v = 0.5(c-1)/(c*b) -- so (b=0.521, c=4) blooms only what
     is already above 72% luminance, and (b=0.538, c=3) above 62% for the wide
     pass. Dark scene stays dark; only the bright metal and the emissive marks
     glow.
     ══════════════════════════════════════════════════════════════════════ */
  var _filterOK = null;

  function canFilter(ctx) {
    if (_filterOK === null) {
      try {
        ctx.filter = 'blur(1px)';
        _filterOK = (ctx.filter === 'blur(1px)');
        ctx.filter = 'none';
      } catch (e) { _filterOK = false; }
    }
    return _filterOK;
  }

  /* Two economies, both of them the reason this is affordable rather than a
     frame-rate tax:

     QUARTER RESOLUTION. The glow is low-frequency by definition, so building
     it at 1/4 linear scale costs a sixteenth of the pixels and upscales
     smooth. This is how bloom is built everywhere; full-resolution blur spends
     16x the fill rate for an image nobody can distinguish.

     HALF RATE. It is also low-frequency in TIME. The glow is cached per mount
     and rebuilt every other frame; every frame still composites it, so nothing
     flickers -- only the expensive half (threshold + two blurs) runs at 30Hz
     while the cheap half (two upscale draws, no filter) runs at 60.

     Cached PER MOUNT, not shared: one shared scratch cannot be cached at all,
     because the next mount overwrites it within the same frame. At quarter
     scale a cache is small -- the 1262x560 hero holds 316x140.
     ══════════════════════════════════════════════════════════════════════ */
  var BLOOM_SCALE = 4, BLOOM_EVERY = 2;

  function bloom(ctx, src, m, w, h, force) {
    if (!m.bloom || !canFilter(ctx) || w < 8 || h < 8) return;
    var sw = Math.max(2, Math.ceil(w / BLOOM_SCALE));
    var sh = Math.max(2, Math.ceil(h / BLOOM_SCALE));

    try {
      if (!m.b1 || m.b1.width !== sw || m.b1.height !== sh) {
        if (!m.b1) { m.b1 = document.createElement('canvas'); m.b2 = document.createElement('canvas'); }
        m.b1.width = sw; m.b1.height = sh;
        m.b2.width = sw; m.b2.height = sh;
        m.b1c = m.b1.getContext('2d'); m.b2c = m.b2.getContext('2d');
        if (!m.b1c || !m.b2c) { _filterOK = false; return; }
        m.bloomAge = BLOOM_EVERY;   /* a resized cache is a stale cache */
      }

      m.bloomAge = (m.bloomAge || 0) + 1;
      if (force || m.bloomAge >= BLOOM_EVERY) {
        m.bloomAge = 0;
        /* Radii in scratch space. Gaussians compose in quadrature, so the wide
           octave is built FROM the tight one with the difference, not from the
           threshold again. */
        var r  = Math.max(4, Math.min(w, h) * 0.016) / BLOOM_SCALE;
        var rw = r * 2.7;
        var dw = Math.sqrt(Math.max(1, rw * rw - r * r));

        /* Threshold + downscale in one draw: brightness(b) then contrast(c)
           gives out = c*b*v + (0.5 - 0.5c), which crosses zero at
           v = 0.5(c-1)/(c*b) -- so b=0.521, c=4 blooms only what is already
           above 72% luminance. The dark scene stays dark. */
        m.b1c.globalCompositeOperation = 'copy';
        m.b1c.filter = 'brightness(0.521) contrast(4)';
        m.b1c.drawImage(src, 0, 0, w, h, 0, 0, sw, sh);
        m.b1c.filter = 'blur(' + r.toFixed(2) + 'px)';
        m.b1c.drawImage(m.b1, 0, 0);          /* in place: source is snapshot */
        m.b1c.filter = 'none';

        m.b2c.globalCompositeOperation = 'copy';
        m.b2c.filter = 'blur(' + dw.toFixed(2) + 'px)';
        m.b2c.drawImage(m.b1, 0, 0);
        m.b2c.filter = 'none';

        /* Fold the wide octave INTO the tight one, here at quarter scale,
           rather than compositing two layers onto the mount at full size.
           The blur was never the expensive part -- measured, caching it moved
           the frame rate not at all. The expensive part is each extra
           full-resolution composite, so the fix is to do one instead of two.
           Weights are preserved exactly: drawing b2 at 0.34/0.62 into b1 and
           then compositing b1 at 0.62 yields 0.62*b1 + 0.34*b2. */
        m.b1c.globalCompositeOperation = 'lighter';
        m.b1c.globalAlpha = 0.548;
        m.b1c.drawImage(m.b2, 0, 0);
        m.b1c.globalAlpha = 1;
        m.b1c.globalCompositeOperation = 'copy';
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.62;
      ctx.drawImage(m.b1, 0, 0, sw, sh, 0, 0, w, h);
      ctx.restore();
    } catch (e) {
      _filterOK = false;
    }
    /* restore() covers these, but a filter surviving onto the next frame's
       clearRect would clear nothing at all. */
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
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
          bloom(c2, _glCanvas, n, n.bw, n.bh, false);
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
      if (c2) {
        c2.clearRect(0, 0, m.bw, m.bh);
        c2.drawImage(_glCanvas, 0, 0);
        bloom(c2, _glCanvas, m, m.bw, m.bh, true);
      }
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

    /* Bloom is on by default and opt-out per mount. It is not free: measured
       on this repo's headless software rasteriser it costs ~22% of frame rate
       (index.html's hero, 19.1 -> 14.8 fps), because one extra full-resolution
       composite per mount per frame is fill-rate work. On a real GPU that is a
       hardware path, but this environment cannot measure GPU, so the number
       above is the honest one and the escape hatch is real. */
    var bloomOff = (el.getAttribute('data-sculpt-bloom') || '').trim().toLowerCase() === 'off';

    var stAttr = (el.getAttribute('data-sculpt-state') || 'idle').trim().toLowerCase();
    if (['idle','pulse','reactor','cube','seal'].indexOf(stAttr) === -1) stAttr = 'idle';

    var m = { el: el, canvas: cv, kind: kind, accent: accent, state: stAttr,
              bloom: !bloomOff, visible: false,
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
      m.scene = SCENES[kind](T, { accent: accent, state: m.state });
      /* The metal's other half (see environment()). Set on the scene, not per
         material, so every MeshStandardMaterial in it picks the map up and any
         MeshBasicMaterial correctly ignores it. */
      var envTex = environment(T);
      if (envTex && m.scene && m.scene.scene) m.scene.scene.environment = envTex;
      sizeMount(m);
      wireNavigation(m);
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

  /* ══════════════════════════════════════════════════════════════════════
     NAVIGATION — the scene is a map you travel, not a diagram you look at

     A scene may declare `links`: [{object, href, label}]. Hovering one lifts
     and brightens it and names it; clicking it goes there.

     AND EVERY LINK IS ALSO A REAL <a>. A <canvas> is one element: it cannot be
     tabbed into, it exposes no destinations to a screen reader, and a
     raycaster answers a pointer only. So the same list is emitted as real
     anchors under the mount -- visually quiet, fully focusable, in the DOM
     whether or not WebGL ever starts. This is the rule omega-constellation.js
     already holds for the 2-D ring ("each node a real link"); a third
     dimension is not a reason to drop it. A member on a keyboard reaches every
     destination the pointer can.
     ══════════════════════════════════════════════════════════════════════ */
  function linkList(m) {
    if (!m.scene || !m.scene.links || !m.scene.links.length) return;
    if (m.linkEl) return;
    var wrap = document.createElement('nav');
    wrap.className = 'omega-sculpt-links';
    wrap.setAttribute('aria-label', (m.kind === 'agents' ? 'The twelve executors'
      : m.kind === 'gates' ? 'The twelve gates' : 'Destinations') + ' in this sculpture');
    wrap.style.cssText = 'position:absolute;left:0;right:0;top:0;bottom:0;' +
      'pointer-events:none;overflow:hidden';
    var seen = {};
    m.scene.links.forEach(function (lk) {
      if (!lk.href) return;
      var key = lk.href + '|' + lk.label;
      if (seen[key]) return;
      seen[key] = 1;
      var a = document.createElement('a');
      a.href = lk.href;
      a.textContent = lk.label || lk.href;
      /* Off-screen until focused, then shown in place -- the standard
         skip-link pattern, so it never fights the artwork but a keyboard
         still finds it. */
      a.style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;' +
        'overflow:hidden;pointer-events:auto;font:12px/1.4 var(--M,monospace);' +
        'letter-spacing:.08em;color:var(--void,#08080F);background:var(--solar,#E2C86D);' +
        'padding:6px 10px;border-radius:2px;text-decoration:none';
      a.addEventListener('focus', function () {
        a.style.left = '12px'; a.style.top = '12px';
        a.style.width = 'auto'; a.style.height = 'auto'; a.style.overflow = 'visible';
        a.style.zIndex = '5';
      });
      a.addEventListener('blur', function () {
        a.style.left = '-9999px'; a.style.width = '1px'; a.style.height = '1px';
        a.style.overflow = 'hidden';
      });
      wrap.appendChild(a);
    });
    if (!wrap.childNodes.length) return;
    m.el.appendChild(wrap);
    m.linkEl = wrap;
  }

  /* The hovered node's name, drawn as a caption inside the mount. */
  function hoverLabel(m, text) {
    if (!m.capEl) {
      var c = document.createElement('div');
      c.setAttribute('aria-hidden', 'true');   /* the <a> list carries this for AT */
      c.style.cssText = 'position:absolute;left:12px;bottom:12px;pointer-events:none;' +
        'font:12px/1.4 var(--M,"Courier Prime",monospace);letter-spacing:.14em;' +
        'text-transform:uppercase;color:var(--solar,#E2C86D);' +
        'background:rgba(5,5,11,.72);padding:5px 9px;border-radius:2px;' +
        'opacity:0;transition:opacity .16s;z-index:4';
      m.el.appendChild(c);
      m.capEl = c;
    }
    if (text) { m.capEl.textContent = text; m.capEl.style.opacity = '1'; }
    else m.capEl.style.opacity = '0';
  }

  function pickAt(m, clientX, clientY) {
    if (!_three || !m.scene || !m.scene.links || !m.scene.links.length) return null;
    var b = m.canvas.getBoundingClientRect();
    if (b.width < 1 || b.height < 1) return null;
    if (!m.ray) m.ray = new _three.Raycaster();
    var ndc = new _three.Vector2(
      ((clientX - b.left) / b.width) * 2 - 1,
      -((clientY - b.top) / b.height) * 2 + 1);
    m.ray.setFromCamera(ndc, m.scene.camera);
    var objs = m.scene.links.map(function (l) { return l.object; });
    var hits = m.ray.intersectObjects(objs, true);
    if (!hits.length) return null;
    /* intersectObjects(…, true) can report a descendant, so walk back up to
       the object the link was declared on. */
    for (var h = 0; h < hits.length; h++) {
      var node = hits[h].object;
      while (node) {
        for (var i = 0; i < m.scene.links.length; i++) {
          if (m.scene.links[i].object === node) return m.scene.links[i];
        }
        node = node.parent;
      }
    }
    return null;
  }

  function setHover(m, link) {
    if (m.hover === link) return;
    if (m.hover && m.hover.object) {
      m.hover.object.userData.omegaHovered = false;
      m.hover.object.scale.setScalar(m.hoverBase || 1);
    }
    m.hover = link;
    if (link && link.object) {
      m.hoverBase = link.object.scale.x;
      link.object.userData.omegaHovered = true;
      link.object.scale.setScalar(m.hoverBase * 1.45);
    }
    m.canvas.style.cursor = link ? 'pointer' : '';
    hoverLabel(m, link ? link.label : '');
  }

  function wireNavigation(m) {
    if (!m.scene || !m.scene.links || !m.scene.links.length) return;
    linkList(m);
    if (REDUCED) return;    /* no hover motion; the <a> list still works */
    m.canvas.addEventListener('pointermove', function (e) {
      setHover(m, pickAt(m, e.clientX, e.clientY));
    }, { passive: true });
    m.canvas.addEventListener('pointerleave', function () { setHover(m, null); }, { passive: true });
    /* Prefer the tracked hover, not a fresh raycast at the click's own
       coordinates. Every scene here keeps its nodes in continuous motion
       (orbiting, rotating), so a click event's clientX/clientY can differ
       from the pointermove that lit the cursor by less than a pixel of
       rounding and still land the ray off the node an instant later --
       reproduced live: a hover hit at (355.67, 343.44) followed by a click
       at the browser-rounded (355, 343) missed on the very next raycast.
       m.hover already reflects what the pointer was actually resting on;
       falling back to a fresh pickAt() only for the pointer-hasn't-moved
       case (a touch tap, which can fire click with no prior pointermove). */
    m.canvas.addEventListener('click', function (e) {
      var hit = m.hover || pickAt(m, e.clientX, e.clientY);
      if (hit && hit.href) window.location.href = hit.href;
    });
  }

  var SCULPT_LABEL = {
    signet: 'The Omega signet, rendered in three dimensions and slowly rotating',
    agents: 'The twelve agent executors in orbit around the Omega core',
    matrix: 'The nine by nine by nine matrix of 729 nodes, with the Crystal-Omega at its centre',
    gates:  'The twelve gates receding into depth toward the Crystal-Omega'
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
        return { kind: m.kind, state: m.state, live: !!m.scene && !m.dead, fallback: m.dead,
                 visible: m.visible, buffer: m.bw + 'x' + m.bh, box: m.w + 'x' + m.h,
                 links: (m.scene && m.scene.links) ? m.scene.links.length : 0,
                 bloom: !!m.bloom, env: !!_env,
                 hover: m.hover ? m.hover.label : null };
      });
    }
  };
})();
