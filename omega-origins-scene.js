/* omega-origins-scene.js -- the 3-D look of MYTH OF THE STONES: ORIGINS, Vertical Slice 0.
 *
 * Everything on screen is built in code from the vendored three.js (/vendor/three.module.js, r160, MIT):
 * no downloaded models, textures or sounds, and nothing copied from any reference image. The Forgotten Valley
 * is a procedural heightfield; the shrine floor carries the nine-ring wall from the film (seven rings inscribed,
 * two left blank); the boss wears the same nine rings. The seven stones are NOT shown as floating coloured gems
 * around an altar (docs/studios/canon/VISUAL_REFERENCES.md): one grey water-glass stone sits in a two-arm cradle.
 *
 * This module only draws. It makes no game decision: omega-origins-game.js owns state and calls in here.
 * Browser global: window.OmegaOriginsScene.create(THREE, canvas, opts). */
(function (root) {
  'use strict';

  /* ---------- deterministic noise, shared by the renderer and the game (placement, walking height) ---------- */
  function hash2(ix, iz) {
    var n = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  function sm(t) { return t * t * (3 - 2 * t); }
  function vnoise(x, z) {
    var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    var a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
    var u = sm(fx), v = sm(fz);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, z) {
    var s = 0, a = 0.5, f = 1;
    for (var i = 0; i < 4; i++) { s += a * vnoise(x * f, z * f); f *= 2; a *= 0.5; }
    return s;
  }
  function smoothstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  var HALF = 62;                    /* world is [-62, 62] on both axes */
  var SHRINE = { x: 0, z: -38 };
  var START = { x: 0, z: 46 };
  function heightAt(x, z) {
    var h = (fbm(x * 0.05 + 11.3, z * 0.05 + 4.7) - 0.5) * 13;
    var r = Math.max(Math.abs(x), Math.abs(z));
    h += smoothstep(44, 62, r) * 20;                         /* the valley's rim */
    var ds = Math.hypot(x - START.x, z - START.z);
    h = h * smoothstep(3, 13, ds);                          /* a flat clearing where the player wakes */
    var dh = Math.hypot(x - SHRINE.x, z - SHRINE.z);
    var plat = 1.6;
    h = plat + (h - plat) * smoothstep(13, 24, dh);        /* the shrine platform and its slope */
    return h;
  }

  /* ---------- helpers ---------- */
  function glowTexture(THREE, inner, outer) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function create(THREE, canvas, opts) {
    opts = opts || {};
    var mobile = !!opts.mobile;
    var reduced = !!opts.reducedMotion;
    var quality = {
      pr: Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2),
      shadow: mobile ? 1024 : 2048, trees: mobile ? 110 : 240, rocks: mobile ? 60 : 130,
      seg: mobile ? 72 : 110, flies: reduced ? 0 : (mobile ? 70 : 170)
    };

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !mobile, powerPreference: 'high-performance' });
    renderer.setPixelRatio(quality.pr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var scene = new THREE.Scene();
    var FOG = new THREE.Color('#1b1236');
    scene.fog = new THREE.FogExp2(FOG, 0.0125);
    var camera = new THREE.PerspectiveCamera(52, 1, 0.3, 700);

    /* ---------- sky: a gradient dome, stars, and the seven lights of the old alignment ---------- */
    var skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color('#05061a') }, mid: { value: new THREE.Color('#2a1658') }, low: { value: new THREE.Color('#d98a58') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP;' +
        'void main(){ float h = clamp(vP.y,0.0,1.0); vec3 c = mix(low, mid, smoothstep(0.0,0.28,h)); c = mix(c, top, smoothstep(0.22,0.85,h));' +
        'gl_FragColor = vec4(c,1.0); }'
    });
    var sky = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 16), skyMat);
    sky.renderOrder = -10; scene.add(sky);

    var starGeo = new THREE.BufferGeometry(), sp = [], i, th, ph;
    for (i = 0; i < 520; i++) {
      th = Math.random() * Math.PI * 2; ph = Math.acos(0.12 + Math.random() * 0.88);
      sp.push(420 * Math.sin(ph) * Math.cos(th), 420 * Math.cos(ph), 420 * Math.sin(ph) * Math.sin(th));
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 1.6, sizeAttenuation: false, fog: false, depthWrite: false, transparent: true, opacity: 0.8 }));
    scene.add(stars);

    var tGold = glowTexture(THREE, 'rgba(255,240,200,1)', 'rgba(226,200,109,.35)');
    var tCyan = glowTexture(THREE, 'rgba(210,250,255,1)', 'rgba(0,229,255,.35)');
    var tViolet = glowTexture(THREE, 'rgba(235,220,255,1)', 'rgba(155,107,240,.4)');
    var sevenColors = ['#cfe3f0', '#ffbf5c', '#ff7a4a', '#7fe08f', '#ff9fb0', '#f5f7ff', '#5f86ff'];
    var ring = new THREE.Group();
    for (i = 0; i < 7; i++) {
      var a = Math.PI * (0.22 + 0.56 * (i / 6));
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tGold, color: sevenColors[i], blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
      s.position.set(Math.cos(a) * 300, 150 + Math.sin(a) * 120, -250);
      s.scale.set(26, 26, 1); ring.add(s);
    }
    scene.add(ring);

    /* ---------- light ---------- */
    var hemi = new THREE.HemisphereLight(0x7e8fe0, 0x2a2238, 1.0); scene.add(hemi);
    var moon = new THREE.DirectionalLight(0xaab9ff, 2.1);
    moon.position.set(-26, 38, 18); moon.castShadow = true;
    moon.shadow.mapSize.set(quality.shadow, quality.shadow);
    moon.shadow.camera.left = -26; moon.shadow.camera.right = 26; moon.shadow.camera.top = 26; moon.shadow.camera.bottom = -26;
    moon.shadow.camera.near = 5; moon.shadow.camera.far = 120; moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.04;
    scene.add(moon); scene.add(moon.target);
    var stoneLight = new THREE.PointLight(0x7fd6ff, 90, 34, 2);
    stoneLight.position.set(SHRINE.x, heightAt(SHRINE.x, SHRINE.z) + 3.4, SHRINE.z); scene.add(stoneLight);

    /* image-based light from the sky itself, so metals and the stone have something to reflect */
    try {
      var pm = new THREE.PMREMGenerator(renderer);
      var es = new THREE.Scene(); es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 24, 12), skyMat.clone()));
      scene.environment = pm.fromScene(es, 0.03).texture; pm.dispose();
    } catch (e) { /* no environment: still lit by the lights above */ }

    /* ---------- terrain ---------- */
    var seg = quality.seg, size = HALF * 2;
    var tGeo = new THREE.PlaneGeometry(size, size, seg, seg);
    tGeo.rotateX(-Math.PI / 2);
    var pos = tGeo.attributes.position, cols = new Float32Array(pos.count * 3), c1 = new THREE.Color(), tmp = new THREE.Color();
    var cLow = new THREE.Color('#244838'), cMid = new THREE.Color('#44683f'), cHigh = new THREE.Color('#6a5b52'), cEdge = new THREE.Color('#2b2335'), cAsh = new THREE.Color('#8b7e72');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), h = heightAt(x, z);
      pos.setY(i, h);
      var hh = Math.max(0, Math.min(1, (h + 4) / 14));
      c1.copy(cLow).lerp(cMid, Math.min(1, hh * 1.6)).lerp(cHigh, smoothstep(0.55, 1, hh));
      c1.lerp(cEdge, smoothstep(46, 62, Math.max(Math.abs(x), Math.abs(z))));
      var ds2 = Math.hypot(x - SHRINE.x, z - SHRINE.z); c1.lerp(cAsh, 0.55 * (1 - smoothstep(6, 18, ds2)));
      c1.multiplyScalar(0.86 + 0.28 * hash2(Math.round(x * 3), Math.round(z * 3)));
      cols[i * 3] = c1.r; cols[i * 3 + 1] = c1.g; cols[i * 3 + 2] = c1.b;
    }
    tGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    tGeo.computeVertexNormals();
    var terrain = new THREE.Mesh(tGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.96, metalness: 0 }));
    terrain.receiveShadow = true; scene.add(terrain);

    /* ---------- scatter: trees and rocks, kept off the clearing, the path and the shrine ---------- */
    var rs = 20261107;
    function rnd() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296; }
    function okSpot(x, z) {
      if (Math.hypot(x - START.x, z - START.z) < 12) return false;
      if (Math.hypot(x - SHRINE.x, z - SHRINE.z) < 17) return false;
      if (Math.abs(x) < 6 && z < 44 && z > -22) return false;      /* the path */
      return true;
    }
    function scatter(geo, mat, count, minS, maxS, sink, shadow) {
      var im = new THREE.InstancedMesh(geo, mat, count), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), n = 0, tries = 0;
      while (n < count && tries++ < count * 40) {
        var px = (rnd() * 2 - 1) * (HALF - 6), pz = (rnd() * 2 - 1) * (HALF - 6);
        if (!okSpot(px, pz)) continue;
        var s2 = minS + rnd() * (maxS - minS);
        p.set(px, heightAt(px, pz) - sink, pz); e.set(0, rnd() * 6.28, 0); q.setFromEuler(e); sc.set(s2, s2 * (0.8 + rnd() * 0.6), s2);
        m.compose(p, q, sc); im.setMatrixAt(n++, m);
      }
      im.count = n; im.castShadow = !!shadow; im.receiveShadow = true; scene.add(im); return im;
    }
    var leafMat = new THREE.MeshStandardMaterial({ color: '#2e5a52', roughness: 0.9, flatShading: true });
    var trunkMat = new THREE.MeshStandardMaterial({ color: '#3c2f2c', roughness: 1, flatShading: true });
    var rockMat = new THREE.MeshStandardMaterial({ color: '#5a5266', roughness: 0.95, flatShading: true });
    var cone = new THREE.ConeGeometry(1.7, 5.2, 6); cone.translate(0, 4.4, 0);
    var trunk = new THREE.CylinderGeometry(0.25, 0.34, 2.4, 5); trunk.translate(0, 1.2, 0);
    scatter(cone, leafMat, quality.trees, 0.8, 1.5, 0.1, true);
    scatter(trunk, trunkMat, quality.trees, 0.8, 1.5, 0.1, false);
    scatter(new THREE.DodecahedronGeometry(1, 0), rockMat, quality.rocks, 0.5, 2.3, 0.4, true);

    /* path markers: standing stones with a faint cyan seam, leading the eye to the shrine */
    var markMat = new THREE.MeshStandardMaterial({ color: '#4b4458', roughness: 0.85, flatShading: true });
    var seamMat = new THREE.MeshBasicMaterial({ color: '#35d6ee', fog: true });
    for (i = 0; i < 12; i++) {
      var zz = 38 - i * 5.4;
      [-4.4, 4.4].forEach(function (sx) {
        var g = new THREE.Group(), hy = heightAt(sx, zz);
        var b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2 + hash2(i, sx) * 0.9, 0.9), markMat); b.position.y = 1.2; b.castShadow = true; g.add(b);
        var sm2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.94), seamMat); sm2.position.y = 2.1; g.add(sm2);
        g.position.set(sx + (hash2(i * 3, sx) - 0.5) * 0.8, hy, zz); g.rotation.y = (hash2(i, 9) - 0.5) * 0.4; scene.add(g);
      });
    }

    /* ---------- the shrine ---------- */
    var shy = heightAt(SHRINE.x, SHRINE.z);
    var shrine = new THREE.Group(); shrine.position.set(SHRINE.x, shy, SHRINE.z); scene.add(shrine);
    var plate = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 13.4, 0.5, 48), new THREE.MeshStandardMaterial({ color: '#3b3547', roughness: 0.7, metalness: 0.15, flatShading: true }));
    plate.position.y = 0.05; plate.receiveShadow = true; plate.castShadow = true; shrine.add(plate);
    var ringMats = [];
    for (i = 0; i < 9; i++) {
      var inscribed = i < 7;                          /* nine rings: seven inscribed, two left blank */
      var rm = new THREE.MeshBasicMaterial({ color: inscribed ? (i % 2 ? '#e2c86d' : '#35d6ee') : '#1b1824', transparent: true, opacity: inscribed ? 0.55 : 0.9 });
      var rr = 1.8 + i * 1.12;
      var rg = new THREE.Mesh(new THREE.RingGeometry(rr, rr + (inscribed ? 0.09 : 0.14), 72), rm);
      rg.rotation.x = -Math.PI / 2; rg.position.y = 0.33; shrine.add(rg); ringMats.push(rm);
    }
    /* the cradle: two curved arms, each one a "hand" -- a two-key lock, not an altar of gems */
    var armMat = new THREE.MeshStandardMaterial({ color: '#5a5266', metalness: 0.6, roughness: 0.35, envMapIntensity: 0.8 });
    [-1, 1].forEach(function (side) {
      var arm = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.28, 8, 24, Math.PI * 0.9), armMat);
      arm.position.set(0, 1.3, 0); arm.rotation.y = side > 0 ? 0 : Math.PI; arm.rotation.x = 0.15; arm.castShadow = true; shrine.add(arm);
      var pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 1.9, 8), armMat); pillar.position.set(side * 2.2, 1.0, 0); pillar.castShadow = true; shrine.add(pillar);
    });
    var stoneMat = new THREE.MeshStandardMaterial({ color: '#a9bfcc', metalness: 0.25, roughness: 0.06, emissive: '#3f7fa8', emissiveIntensity: 0.9, envMapIntensity: 1.6, flatShading: true });
    var stone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), stoneMat);
    stone.scale.set(0.9, 1.5, 0.9); stone.position.y = 2.7; stone.castShadow = true; shrine.add(stone);
    var stoneGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tCyan, color: 0x8fdcff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 }));
    stoneGlow.scale.set(9, 9, 1); stoneGlow.position.y = 2.8; shrine.add(stoneGlow);
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 1.1, 60, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 32; shrine.add(beam);
    var chest = new THREE.Group();
    var cb = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1), new THREE.MeshStandardMaterial({ color: '#6b4a2e', roughness: 0.7, metalness: 0.2 })); cb.position.y = 0.55; cb.castShadow = true; chest.add(cb);
    var cl = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.22, 1.06), new THREE.MeshStandardMaterial({ color: '#c9a84c', metalness: 0.9, roughness: 0.3, envMapIntensity: 1 })); cl.position.y = 1.06; chest.add(cl);
    chest.position.set(7.2, 0.3, 3.5); chest.rotation.y = -0.6; shrine.add(chest);

    /* ---------- fireflies / ash motes ---------- */
    var fl = null, flBase = null;
    if (quality.flies > 0) {
      var fp = new Float32Array(quality.flies * 3); flBase = new Float32Array(quality.flies * 3);
      for (i = 0; i < quality.flies; i++) { flBase[i * 3] = (rnd() - 0.5) * 60; flBase[i * 3 + 1] = rnd() * 6 + 0.4; flBase[i * 3 + 2] = (rnd() - 0.5) * 60; }
      var fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
      fl = new THREE.Points(fg, new THREE.PointsMaterial({ map: tGold, color: 0xffe9a8, size: 0.55, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85 }));
      scene.add(fl);
    }

    /* ---------- characters, built from primitives ---------- */
    function mat(color, o) { o = o || {}; return new THREE.MeshStandardMaterial({ color: color, roughness: o.r == null ? 0.7 : o.r, metalness: o.m || 0, emissive: o.e || '#000000', emissiveIntensity: o.ei || 0, flatShading: true, envMapIntensity: o.env || 0.6 }); }
    function cast(g) { g.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); return g; }

    function buildAuren() {
      var g = new THREE.Group(), body = new THREE.Group(); g.add(body);
      var cloth = mat('#2f3f66'), trim = mat('#c9a84c', { m: 0.9, r: 0.3, env: 1 }), skin = mat('#c99a78', { r: 0.8 }), hair = mat('#1a1722');
      var legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.55, 3, 6), cloth); legL.position.set(-0.2, 0.55, 0);
      var legR = legL.clone(); legR.position.x = 0.2;
      var torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.55, 4, 8), cloth); torso.position.y = 1.25;
      var belt = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 6, 14), trim); belt.rotation.x = Math.PI / 2; belt.position.y = 1.05;
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), skin); head.position.y = 1.95;
      var cap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), hair); cap.position.y = 1.99;
      var capeGeo = new THREE.PlaneGeometry(0.8, 1.3, 4, 6); capeGeo.translate(0, -0.62, 0);
      var cape = new THREE.Mesh(capeGeo, new THREE.MeshStandardMaterial({ color: '#7a1f2b', roughness: 0.9, side: THREE.DoubleSide, flatShading: true }));
      cape.position.set(0, 1.75, -0.3);
      var arm = new THREE.Group(); arm.position.set(0.42, 1.55, 0);
      var upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.45, 3, 6), cloth); upper.position.y = -0.28; arm.add(upper);
      var blade = new THREE.Group(); blade.position.set(0.05, -0.55, 0.1);
      var bl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 0.03), mat('#cfe3f0', { m: 0.9, r: 0.2, e: '#35d6ee', ei: 0.9, env: 1.4 })); bl.position.y = 0.62; blade.add(bl);
      var gd = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.08), trim); gd.position.y = 0.06; blade.add(gd);
      blade.rotation.x = Math.PI / 2 - 0.4; arm.add(blade);
      var lh = new THREE.Group(); lh.position.set(-0.42, 1.25, 0.12);
      var lg = new THREE.Sprite(new THREE.SpriteMaterial({ map: tCyan, color: 0x9be9ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.0 })); lg.scale.set(1.3, 1.3, 1); lh.add(lg);
      body.add(legL, legR, torso, belt, head, cap, cape, arm, lh);
      cast(g);
      var capeBase = Array.prototype.slice.call(capeGeo.attributes.position.array);
      return { group: g, body: body, arm: arm, blade: blade, cape: cape, capeGeo: capeGeo, capeBase: capeBase, legL: legL, legR: legR, handGlow: lg, mats: [cloth, skin, hair] };
    }

    function buildWraith(isArcher) {
      var g = new THREE.Group(), body = new THREE.Group(); g.add(body);
      var m1 = mat(isArcher ? '#2a3550' : '#2b2630', { r: 0.9, e: isArcher ? '#0a3a55' : '#2a0e18', ei: 0.5 });
      var robe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.75, 2.3, 7), m1); robe.position.y = 1.15;
      var hood = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 7), m1); hood.position.y = 2.6;
      var eyeCol = isArcher ? '#35d6ee' : '#ff5a3a';
      var eyeM = new THREE.MeshBasicMaterial({ color: eyeCol });
      var e1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), eyeM); e1.position.set(-0.13, 2.45, 0.3);
      var e2 = e1.clone(); e2.position.x = 0.13;
      var arm = new THREE.Group(); arm.position.set(0.5, 1.7, 0.1);
      var claw = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), m1); claw.position.y = -0.4; arm.add(claw);
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: isArcher ? tCyan : tViolet, color: isArcher ? 0x66ddff : 0xff6a4a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 })); halo.scale.set(3.4, 3.4, 1); halo.position.y = 1.7;
      body.add(robe, hood, e1, e2, arm, halo);
      if (isArcher) {
        var bow = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 5, 14, Math.PI), mat('#35d6ee', { e: '#35d6ee', ei: 1 })); bow.position.set(-0.55, 1.7, 0.35); bow.rotation.set(0, 0, Math.PI / 2); body.add(bow);
      }
      m1.userData.e0 = m1.emissive.clone();
      cast(g);
      return { group: g, body: body, arm: arm, halo: halo, mats: [m1], baseEmissive: 0.5 };
    }

    function buildBoss() {
      var g = new THREE.Group(), body = new THREE.Group(); g.add(body);
      var stoneM = mat('#3a3548', { r: 0.8, m: 0.2, env: 1 });
      var seamM = new THREE.MeshBasicMaterial({ color: '#35d6ee' });
      var core = new THREE.Mesh(new THREE.OctahedronGeometry(1.7, 0), stoneM); core.position.y = 3.4; core.scale.set(1, 1.5, 1);
      var seam = new THREE.Mesh(new THREE.OctahedronGeometry(1.74, 0), new THREE.MeshBasicMaterial({ color: '#35d6ee', wireframe: true })); seam.position.copy(core.position); seam.scale.copy(core.scale);
      var base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.9, 1.6, 8), stoneM); base.position.y = 0.8;
      var eye = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd36b' })); eye.position.set(0, 3.7, 1.15);
      var rings = [];
      for (var k = 0; k < 9; k++) {
        var lit = k < 7;                              /* the nine rings of the wall: two are dark */
        var rm2 = new THREE.Mesh(new THREE.TorusGeometry(2.2 + k * 0.28, 0.06, 6, 40), new THREE.MeshBasicMaterial({ color: lit ? (k % 2 ? '#e2c86d' : '#35d6ee') : '#241f2e' }));
        rm2.position.y = 3.4; rm2.rotation.set(k * 0.35, k * 0.6, k * 0.2); body.add(rm2); rings.push(rm2);
      }
      var halo2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: tCyan, color: 0x77ddff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.45 })); halo2.scale.set(11, 11, 1); halo2.position.y = 3.4;
      body.add(core, seam, base, eye, halo2);
      stoneM.userData.e0 = stoneM.emissive.clone();
      cast(g);
      return { group: g, body: body, rings: rings, halo: halo2, mats: [stoneM], baseEmissive: 0 };
    }

    var auren = buildAuren(); scene.add(auren.group);

    /* ---------- pooled effects ---------- */
    var rings = [], ringPool = [];
    function newRing(color) {
      var m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 56), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); return m;
    }
    function ringFx(x, z, radius, color, life, grow) {
      var m = ringPool.pop() || newRing(color);
      m.material.color.set(color); m.visible = true; m.position.set(x, heightAt(x, z) + 0.12, z);
      rings.push({ m: m, r: radius, life: life, age: 0, grow: grow });
    }
    var BURST = 160, burstGeo = new THREE.BufferGeometry(), burstPos = new Float32Array(BURST * 3), burstVel = new Float32Array(BURST * 3), burstLife = new Float32Array(BURST);
    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
    var burstPts = new THREE.Points(burstGeo, new THREE.PointsMaterial({ map: tGold, color: 0xffe6a0, size: 0.7, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    burstPts.frustumCulled = false; scene.add(burstPts);
    for (i = 0; i < BURST; i++) burstPos[i * 3 + 1] = -999;
    var burstNext = 0;
    function burst(x, y, z, n, color) {
      if (reduced) n = Math.ceil(n / 3);
      burstPts.material.color.set(color || '#ffe6a0');
      for (var k = 0; k < n; k++) {
        var j = burstNext++ % BURST;
        burstPos[j * 3] = x; burstPos[j * 3 + 1] = y; burstPos[j * 3 + 2] = z;
        burstVel[j * 3] = (Math.random() - 0.5) * 7; burstVel[j * 3 + 1] = Math.random() * 6 + 1; burstVel[j * 3 + 2] = (Math.random() - 0.5) * 7;
        burstLife[j] = 0.5 + Math.random() * 0.4;
      }
    }
    /* the arc is centred on the player's forward (+z after the y-rotation), so one group turn aims it */
    var slashG = new THREE.Group(); scene.add(slashG);
    var slash = new THREE.Mesh(new THREE.RingGeometry(0.6, 2.7, 24, 1, -Math.PI / 2 - 1.05, 2.1), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    slash.rotation.x = -Math.PI / 2; slashG.add(slash); var slashAge = 99;
    var projMeshes = [];
    for (i = 0; i < 14; i++) {
      var pm2 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: '#7fe9ff' })); pm2.visible = false; scene.add(pm2); projMeshes.push(pm2);
    }

    /* ---------- enemy handles ---------- */
    var enemies = [];
    function addEnemy(type, x, z) {
      var v = type === 'boss' ? buildBoss() : buildWraith(type === 'archer');
      scene.add(v.group);
      var tele = newRing('#ff4a3a'); tele.material.opacity = 0.0;
      var h = { v: v, type: type, tele: tele, flashT: 0, dead: false, hover: Math.random() * 6, deathT: -1 };
      enemies.push(h);
      return {
        pose: function (px, pz, facing, speedFrac, t) {
          var y = heightAt(px, pz) + (type === 'boss' ? 0.4 + Math.sin(t * 1.2) * 0.25 : 0.2 + Math.sin(t * 2 + h.hover) * 0.12);
          v.group.position.set(px, y, pz); v.group.rotation.y = facing;
          if (type === 'boss') { v.rings.forEach(function (r, k) { r.rotation.x += 0.004 * (k + 1); r.rotation.y += 0.006 * (10 - k); }); }
          else { v.body.rotation.z = Math.sin(t * 3 + h.hover) * 0.05; v.body.rotation.x = 0.08 * speedFrac; }
        },
        telegraph: function (radius, frac, px, pz) {
          if (radius <= 0) { tele.visible = false; return; }
          tele.visible = true; tele.position.set(px, heightAt(px, pz) + 0.14, pz);
          tele.scale.set(radius, radius, 1); tele.material.opacity = 0.2 + 0.55 * frac; tele.material.color.setHSL(0.02, 1, 0.35 + 0.25 * frac);
        },
        strike: function (swing) { if (v.arm) v.arm.rotation.x = swing ? -1.6 : 0; },
        flash: function () { h.flashT = 0.14; },
        die: function () { h.deathT = 0; h.dead = true; tele.visible = false; },
        remove: function () { scene.remove(v.group); tele.visible = false; ringPool.push(tele); var ix = enemies.indexOf(h); if (ix >= 0) enemies.splice(ix, 1); },
        isGone: function () { return h.deathT >= 0.7; }
      };
    }

    /* ---------- per-frame ---------- */
    var camPos = new THREE.Vector3(0, 14, 62), camLook = new THREE.Vector3(0, 1.5, 46), shake = 0, yaw = 0, fovKick = 0, clockT = 0;
    var cam = { dist: 15.5, height: 11.5 };
    var stoneState = 'dormant', aurenFlash = 0, vec = new THREE.Vector3();

    function update(dt, t, player, aim) {
      clockT = t;
      /* player pose */
      var p = auren, y0 = heightAt(player.x, player.z);
      p.group.position.set(player.x, y0 + (player.roll > 0 ? 0.35 : 0), player.z);
      p.group.rotation.y = player.facing;
      p.body.rotation.x = player.roll > 0 ? player.roll * Math.PI * 2 * 0.9 : 0.1 * Math.min(1, player.speed);
      var sw = player.swing;                                  /* 0..1 over the attack */
      p.arm.rotation.x = sw > 0 ? -2.2 + sw * 3.6 : -0.15;
      p.arm.rotation.z = sw > 0 ? 0.4 : 0;
      var stride = Math.sin(t * 11) * 0.7 * Math.min(1, player.speed);
      p.legL.rotation.x = stride; p.legR.rotation.x = -stride;
      p.group.position.y += Math.abs(Math.sin(t * 11)) * 0.06 * Math.min(1, player.speed);
      var arr = p.capeGeo.attributes.position;
      for (var q2 = 0; q2 < arr.count; q2++) {
        var by = p.capeBase[q2 * 3 + 1], depth = -by / 1.3;
        arr.setZ(q2, -depth * (0.2 + 0.7 * Math.min(1, player.speed)) + Math.sin(t * 6 + q2 * 0.9) * 0.05 * depth * (reduced ? 0.3 : 1));
      }
      arr.needsUpdate = true;
      p.handGlow.material.opacity = player.weight > 5 ? 0.25 + 0.5 * (player.weight / 100) : 0;
      aurenFlash = Math.max(0, aurenFlash - dt);
      p.mats.forEach(function (m) { m.emissive.setRGB(aurenFlash > 0 ? 0.8 : 0, aurenFlash > 0 ? 0.1 : 0, aurenFlash > 0 ? 0.1 : 0); m.emissiveIntensity = aurenFlash > 0 ? 1 : 0; });

      /* enemies: hit flash, death fade */
      for (var k = enemies.length - 1; k >= 0; k--) {
        var h = enemies[k];
        if (h.flashT > 0) { h.flashT -= dt; }
        h.v.mats.forEach(function (m) { if (h.flashT > 0) { m.emissive.setRGB(1, 0.9, 0.7); m.emissiveIntensity = 1.4; } else { m.emissive.copy(m.userData.e0); m.emissiveIntensity = h.v.baseEmissive; } });
        if (h.deathT >= 0) {
          h.deathT += dt; var f = Math.min(1, h.deathT / 0.7);
          h.v.group.scale.setScalar(1 - f * 0.9); h.v.group.position.y += dt * 1.4;
          h.v.group.traverse(function (o) { if (o.material && o.material.opacity !== undefined && o.isSprite) o.material.opacity *= 0.9; });
        }
      }
      /* effects */
      for (var r = rings.length - 1; r >= 0; r--) {
        var fx = rings[r]; fx.age += dt; var u = fx.age / fx.life;
        if (u >= 1) { fx.m.visible = false; ringPool.push(fx.m); rings.splice(r, 1); continue; }
        var sc = fx.grow ? fx.r * (0.2 + 0.8 * u) : fx.r; fx.m.scale.set(sc, sc, 1); fx.m.material.opacity = 0.7 * (1 - u);
      }
      slashAge += dt;
      slash.material.opacity = slashAge < 0.22 ? 0.75 * (1 - slashAge / 0.22) : 0;
      for (var b = 0; b < BURST; b++) {
        if (burstLife[b] > 0) {
          burstLife[b] -= dt; burstVel[b * 3 + 1] -= 14 * dt;
          burstPos[b * 3] += burstVel[b * 3] * dt; burstPos[b * 3 + 1] += burstVel[b * 3 + 1] * dt; burstPos[b * 3 + 2] += burstVel[b * 3 + 2] * dt;
          if (burstLife[b] <= 0) burstPos[b * 3 + 1] = -999;
        }
      }
      burstGeo.attributes.position.needsUpdate = true;

      /* the stone: breathing light, brighter as the quest wakes it */
      var lvl = stoneState === 'dormant' ? 0.6 : (stoneState === 'awake' ? 1.2 : 0.35);
      var pulse = 0.5 + 0.5 * Math.sin(t * 2.6);
      stone.rotation.y = t * 0.5; stone.position.y = 2.7 + Math.sin(t * 1.3) * 0.12;
      stoneMat.emissiveIntensity = (0.6 + 0.7 * pulse) * lvl;
      stoneLight.intensity = (55 + 55 * pulse) * lvl; stoneGlow.material.opacity = 0.45 + 0.45 * pulse * lvl;
      beam.material.opacity = 0.08 + 0.1 * pulse * lvl;
      ringMats.forEach(function (m, n) { if (n < 7) m.opacity = 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.8 - n * 0.6)) * lvl; });

      /* ash motes drift around the player */
      if (fl) {
        var fa = fl.geometry.attributes.position.array;
        for (var f2 = 0; f2 < quality.flies; f2++) {
          var fx0 = flBase[f2 * 3], fz0 = flBase[f2 * 3 + 2];
          fa[f2 * 3] = player.x + (((fx0 + t * 0.4 * ((f2 % 3) - 1)) % 30 + 30) % 30 - 15) * 2;
          fa[f2 * 3 + 1] = flBase[f2 * 3 + 1] + Math.sin(t * 0.8 + f2) * 0.5;
          fa[f2 * 3 + 2] = player.z + (((fz0 + t * 0.3) % 30 + 30) % 30 - 15) * 2;
        }
        fl.geometry.attributes.position.needsUpdate = true;
      }
      ring.rotation.z = Math.sin(t * 0.05) * 0.02;

      /* camera: a fixed three-quarter angle that follows, with an optional yaw the player can turn */
      yaw += (aim.yawTarget - yaw) * Math.min(1, dt * 6);
      var tx = player.x + Math.sin(yaw) * cam.dist, tz = player.z + Math.cos(yaw) * cam.dist;
      camPos.x += (tx - camPos.x) * Math.min(1, dt * 5); camPos.z += (tz - camPos.z) * Math.min(1, dt * 5);
      camPos.y += ((y0 + cam.height) - camPos.y) * Math.min(1, dt * 4);
      camLook.x += (player.x - camLook.x) * Math.min(1, dt * 9); camLook.z += (player.z - camLook.z) * Math.min(1, dt * 9); camLook.y += ((y0 + 1.6) - camLook.y) * Math.min(1, dt * 6);
      shake = Math.max(0, shake - dt * 3);
      camera.position.set(camPos.x + (reduced ? 0 : (Math.random() - 0.5) * shake), camPos.y + (reduced ? 0 : (Math.random() - 0.5) * shake), camPos.z);
      camera.lookAt(camLook);
      fovKick += ((player.roll > 0 ? 6 : 0) - fovKick) * Math.min(1, dt * 8);
      camera.fov = 52 + (reduced ? 0 : fovKick); camera.updateProjectionMatrix();
      moon.position.set(player.x - 26, 38, player.z + 18); moon.target.position.set(player.x, y0, player.z); moon.target.updateMatrixWorld();
      renderer.render(scene, camera);
    }

    function resize(w, h) {
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }

    return {
      THREE: THREE, heightAt: heightAt, SHRINE: SHRINE, START: START, HALF: HALF,
      addEnemy: addEnemy, update: update, resize: resize, renderer: renderer,
      setStoneState: function (s) { stoneState = s; },
      setReduced: function (v) { reduced = !!v; },
      chestPos: function () { return { x: SHRINE.x + 7.2, z: SHRINE.z + 3.5 }; },
      slash: function (x, z, facing) { slashG.position.set(x, heightAt(x, z) + 0.2, z); slashG.rotation.y = facing; slashAge = 0; },
      ring: ringFx, burst: burst,
      shake: function (a) { shake = Math.max(shake, a); },
      flashPlayer: function () { aurenFlash = 0.16; },
      setProjectiles: function (list) {
        for (var n = 0; n < projMeshes.length; n++) {
          var pr = list[n], m = projMeshes[n];
          if (pr) { m.visible = true; m.position.set(pr.x, heightAt(pr.x, pr.z) + 1.3, pr.z); } else m.visible = false;
        }
      },
      project: function (x, y, z) {
        vec.set(x, y, z).project(camera);
        var w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
        return { x: (vec.x * 0.5 + 0.5) * w, y: (-vec.y * 0.5 + 0.5) * h, visible: vec.z < 1 };
      },
      setYaw: function (v) { /* handled through aim.yawTarget */ },
      info: function () { var i2 = renderer.info; return { calls: i2.render.calls, triangles: i2.render.triangles, enemies: enemies.length, quality: quality }; },
      dispose: function () { renderer.dispose(); }
    };
  }

  root.OmegaOriginsScene = { create: create, heightAt: heightAt, SHRINE: SHRINE, START: START, HALF: HALF };
})(typeof window !== 'undefined' ? window : globalThis);
