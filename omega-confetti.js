/* omega-confetti.js   SYD OMEGA 91717   v2
   Sovereign celebration engine — canvas particle burst for gate unlocks,
   achievement completions, milestone events, and tier-based celebration events.

   API:
     OmegaCelebration.burst(options?)     — one immediate burst at center
     OmegaCelebration.gate(gateNum, name) — cinematic gate-unlock sequence
     OmegaCelebration.milestone(text)     — softer glow burst + banner
     OmegaCelebration.apex()             — maximum effect for Gate XII
     OmegaCelebrate.emit(eventType, metadata) — emit custom celebration
     OmegaCelebrate.setTier(tier)         — set member tier (1-3+)
     OmegaCelebrate.getTier()             — get current tier
     OmegaCelebrate.enable()              — enable celebrations
     OmegaCelebrate.disable()             — disable celebrations

   Auto-trigger: listens for the custom events:
     'omega:gate-unlock'  → e.detail { gate, name }
     'omega:achievement'  → e.detail { title }
     'omega:apex'         → (no detail)
     'omega:task-complete' → e.detail { intensity?, metadata? }
     'omega:streak-record' → e.detail { streak, metadata? }
     'omega:social-milestone' → e.detail { type, metadata? }

   Respects prefers-reduced-motion (pulse glow instead of particles).
   Tier-based intensity: tier 1 (low), tier 2 (medium), tier 3+ (high). */
(function () {
  'use strict';
  if (window.OmegaCelebration) return;

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var _enabled = true;
  var _currentTier = 1;

  /* ─── TIER CONFIGURATION ────────────────────────────────────────── */
  var TIER_CONFIG = {
    1: { particlesPerSec: 3, duration: 800, opacity: 0.4, audio: false },
    2: { particlesPerSec: 8, duration: 1200, opacity: 0.5, audio: false },
    3: { particlesPerSec: 15, duration: 1800, opacity: 0.7, audio: true },
    4: { particlesPerSec: 20, duration: 2000, opacity: 0.8, audio: true },
    5: { particlesPerSec: 25, duration: 2500, opacity: 0.9, audio: true }
  };

  function _getTierConfig() {
    return TIER_CONFIG[Math.min(_currentTier, 5)] || TIER_CONFIG[1];
  }

  /* ─── PALETTE ───────────────────────────────────────────────────── */
  var COLORS = ['#C9A84C','#E2C86D','#00E5FF','#9B6BF0','#3fb27f','#ffffff','#E86A3A'];

  /* ─── CANVAS LAYER ──────────────────────────────────────────────── */
  var _cv = null, _ctx = null;

  function getCanvas() {
    if (_cv) return _cv;
    _cv = document.createElement('canvas');
    _cv.id = 'omega-confetti-cv';
    _cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:9998;pointer-events:none';
    document.body.appendChild(_cv);
    _ctx = _cv.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize);
    return _cv;
  }

  function _resize() {
    if (!_cv) return;
    _cv.width = window.innerWidth;
    _cv.height = window.innerHeight;
  }

  /* ─── PARTICLE SYSTEM ───────────────────────────────────────────── */
  var _particles = [], _raf = null;

  function Particle(x, y, opts) {
    opts = opts || {};
    this.x = x;
    this.y = y;
    var speed = opts.speed || (3 + Math.random() * 6);
    var angle = (opts.angle || Math.random() * Math.PI * 2);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - (opts.upBias || 2);
    this.gravity = opts.gravity !== undefined ? opts.gravity : 0.18;
    this.life = 1;
    this.decay = 0.012 + Math.random() * 0.018;
    this.size = opts.size || (4 + Math.random() * 6);
    this.color = opts.color || COLORS[Math.floor(Math.random() * COLORS.length)];
    this.shape = opts.shape || (Math.random() < 0.4 ? 'rect' : 'circle');
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.15;
    this.trail = [];
  }

  Particle.prototype.update = function () {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 4) this.trail.shift();
    this.vx *= 0.98;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.rotation += this.rotSpeed;
  };

  Particle.prototype.draw = function (ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(this.life, 1);
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    if (this.shape === 'rect') {
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    } else if (this.shape === 'star') {
      _star(ctx, 0, 0, 5, this.size / 2, this.size / 4);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  function _star(ctx, cx, cy, spikes, outer, inner) {
    var step = Math.PI / spikes, rot = -Math.PI / 2;
    ctx.beginPath();
    for (var i = 0; i < 2 * spikes; i++) {
      var r = (i % 2 === 0) ? outer : inner;
      ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
      rot += step;
    }
    ctx.closePath();
  }

  function _loop() {
    var cv = getCanvas();
    _ctx.clearRect(0, 0, cv.width, cv.height);
    _particles = _particles.filter(function (p) { return p.life > 0; });
    _particles.forEach(function (p) { p.update(); p.draw(_ctx); });
    if (_particles.length > 0) {
      _raf = requestAnimationFrame(_loop);
    } else {
      _ctx.clearRect(0, 0, cv.width, cv.height);
      _raf = null;
    }
  }

  function _startLoop() {
    if (!_raf) { getCanvas(); _raf = requestAnimationFrame(_loop); }
  }

  /* ─── STATIC FALLBACK FOR PREFERS-REDUCED-MOTION ──────────────────── */
  function _staticPulse(accentColor) {
    if (!REDUCE) return;
    var old = document.getElementById('omega-celeb-pulse');
    if (old) old.remove();
    var div = document.createElement('div');
    div.id = 'omega-celeb-pulse';
    div.style.cssText = [
      'position:fixed;inset:0;width:100%;height:100%;',
      'pointer-events:none;z-index:9998;',
      'background-color:' + (accentColor || '#C9A84C') + ';',
      'opacity:0;animation:omega-pulse 0.3s ease-out forwards'
    ].join('');
    var style = document.createElement('style');
    if (!document.getElementById('omega-pulse-keyframes')) {
      style.id = 'omega-pulse-keyframes';
      style.textContent = '@keyframes omega-pulse{0%{opacity:0.15}100%{opacity:0}}';
      document.head.appendChild(style);
    }
    document.body.appendChild(div);
    setTimeout(function () { if (div.parentNode) div.remove(); }, 350);
  }

  /* ─── BURST FACTORY ─────────────────────────────────────────────── */
  function _spawnBurst(x, y, count, opts) {
    if (!_enabled) return;
    if (REDUCE) { _staticPulse(opts && opts.color); return; }
    getCanvas();
    for (var i = 0; i < count; i++) {
      _particles.push(new Particle(x, y, opts));
    }
    _startLoop();
  }

  function _centerX() { return window.innerWidth / 2; }
  function _centerY() { return window.innerHeight * 0.4; }

  /* Dynamic event text is escaped before entering the banner's trusted markup. */
  function _escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ─── BANNER SYSTEM ─────────────────────────────────────────────── */
  function _showBanner(html, accentColor, duration) {
    var old = document.getElementById('omega-celeb-banner');
    if (old) old.remove();
    var div = document.createElement('div');
    div.id = 'omega-celeb-banner';
    div.innerHTML = html;
    div.style.cssText = [
      'position:fixed;top:clamp(60px,10vh,100px);left:50%;transform:translateX(-50%);',
      'z-index:9999;pointer-events:none;text-align:center;',
      'background:rgba(8,8,15,.95);border:1px solid ' + (accentColor || '#C9A84C') + ';',
      'border-top:3px solid ' + (accentColor || '#C9A84C') + ';',
      'border-radius:2px;padding:16px 32px;',
      'box-shadow:0 0 40px ' + (accentColor || '#C9A84C') + '33,0 20px 60px rgba(0,0,0,.7);',
      'animation:omega-celeb-in .4s cubic-bezier(.34,1.56,.64,1) both',
    ].join('');
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes omega-celeb-in{from{opacity:0;transform:translateX(-50%) translateY(-20px) scale(.9)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}',
      '@keyframes omega-celeb-out{to{opacity:0;transform:translateX(-50%) translateY(-12px) scale(.96)}}'
    ].join('');
    document.head.appendChild(style);
    document.body.appendChild(div);
    setTimeout(function () {
      if (div.parentNode) {
        div.style.animation = 'omega-celeb-out .3s ease forwards';
        setTimeout(function () { if (div.parentNode) div.remove(); }, 350);
      }
    }, duration || 3500);
    return div;
  }

  /* ─── PUBLIC API ────────────────────────────────────────────────── */
  var API = {

    burst: function (opts) {
      opts = opts || {};
      var cx = opts.x !== undefined ? opts.x : _centerX();
      var cy = opts.y !== undefined ? opts.y : _centerY();
      _spawnBurst(cx, cy, opts.count || 80, {
        speed: opts.speed || 6,
        upBias: 3,
        size: opts.size || 6,
        color: opts.color || null,
        shape: opts.shape || null
      });
    },

    gate: function (gateNum, gateName) {
      var cx = _centerX(), cy = _centerY();
      var accentColor = gateNum >= 10 ? '#E2C86D' : '#C9A84C';
      var count = 40 + gateNum * 8;

      /* Multi-wave burst */
      _spawnBurst(cx, cy, count, { speed: 7, upBias: 4, shape: 'star', color: accentColor });
      setTimeout(function () {
        _spawnBurst(cx - 80, cy + 40, Math.floor(count / 2), { speed: 5, upBias: 2 });
        _spawnBurst(cx + 80, cy + 40, Math.floor(count / 2), { speed: 5, upBias: 2 });
      }, 200);
      setTimeout(function () {
        _spawnBurst(cx, cy - 40, Math.floor(count / 3), { speed: 4, upBias: 5, shape: 'circle' });
      }, 420);

      var ROMAN = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
      _showBanner(
        '<div style="font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:4px;color:' + accentColor + ';margin-bottom:6px">GATE ' + (ROMAN[gateNum] || gateNum) + ' UNLOCKED</div>' +
        '<div style="font-family:\'Cinzel Decorative\',serif;font-size:clamp(16px,3vw,22px);color:#e9e6dc;letter-spacing:2px">' + _escapeHtml((gateName || '').toUpperCase()) + '</div>' +
        '<div style="font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:2px;color:rgba(233,230,220,.45);margin-top:6px">AUTHORITY THRESHOLD CROSSED &middot; SYD OMEGA 91717</div>',
        accentColor, 4000
      );
    },

    milestone: function (text) {
      var cx = _centerX(), cy = _centerY();
      _spawnBurst(cx, cy, 50, { speed: 4, upBias: 2, size: 5, color: '#3fb27f' });
      _showBanner(
        '<div style="font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:3px;color:#3fb27f;margin-bottom:5px">MILESTONE REACHED</div>' +
        '<div style="font-family:\'Cinzel Decorative\',serif;font-size:clamp(13px,2.5vw,18px);color:#e9e6dc">' + _escapeHtml(String(text || 'SOVEREIGN MILESTONE').toUpperCase()) + '</div>',
        '#3fb27f', 3000
      );
    },

    apex: function () {
      var cx = _centerX(), cy = _centerY();
      /* Grand finale — 5 waves */
      var delays = [0, 180, 380, 600, 900];
      delays.forEach(function (d, i) {
        setTimeout(function () {
          _spawnBurst(cx, cy, 120, { speed: 8 + i, upBias: 5, shape: i % 2 === 0 ? 'star' : 'rect', color: i < 2 ? '#E2C86D' : null });
          _spawnBurst(cx - 120, cy + 60, 40, { speed: 5, upBias: 3 });
          _spawnBurst(cx + 120, cy + 60, 40, { speed: 5, upBias: 3 });
        }, d);
      });
      _showBanner(
        '<div style="font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:4px;color:#E2C86D;margin-bottom:8px">GATE XII &middot; SOVEREIGN APEX</div>' +
        '<div style="font-family:\'Cinzel Decorative\',serif;font-size:clamp(18px,4vw,28px);color:#E2C86D;text-shadow:0 0 20px rgba(226,200,109,.5)">&#937; APEX SOVEREIGN &#937;</div>' +
        '<div style="font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:3px;color:rgba(226,200,109,.6);margin-top:8px">AUTH = 27.8367 &middot; A=9 B=9 C=9 &middot; LATTICE COMPLETE</div>',
        '#E2C86D', 6000
      );
    }
  };

  /* ─── AUTO-TRIGGER FROM CUSTOM EVENTS ───────────────────────────── */
  window.addEventListener('omega:gate-unlock', function (e) {
    if (!e.detail) return;
    var tier = e.detail.tier;
    if (tier) _currentTier = tier;
    var g = e.detail.gate, n = e.detail.name;
    if (g >= 12) { API.apex(); }
    else { API.gate(g, n); }
  });

  window.addEventListener('omega:achievement', function (e) {
    if (!e.detail) return;
    var tier = e.detail.tier;
    if (tier) _currentTier = tier;
    API.milestone(e.detail && e.detail.title);
  });

  window.addEventListener('omega:task-complete', function (e) {
    if (!e.detail) return;
    var tier = e.detail.tier;
    if (tier) _currentTier = tier;
    var cfg = _getTierConfig();
    var count = Math.ceil(cfg.particlesPerSec * (cfg.duration / 1000));
    var cx = window.innerWidth / 2, cy = window.innerHeight * 0.4;
    _spawnBurst(cx, cy, count, {
      speed: 4 + (tier || 1),
      upBias: 2,
      color: '#00E5FF',
      shape: 'circle'
    });
    _showBanner(
      '<div style="font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:2px;color:#00E5FF">TASK COMPLETED</div>' +
      '<div style="font-family:\'Rajdhani\',sans-serif;font-size:13px;color:#e9e6dc">progress recorded</div>',
      '#00E5FF', cfg.duration
    );
  });

  window.addEventListener('omega:streak-record', function (e) {
    if (!e.detail) return;
    var tier = e.detail.tier;
    if (tier) _currentTier = tier;
    var streak = e.detail.streak || 0;
    var cfg = _getTierConfig();
    var count = Math.ceil(cfg.particlesPerSec * (cfg.duration / 1000) * 1.2);
    var cx = window.innerWidth / 2, cy = window.innerHeight * 0.4;
    _spawnBurst(cx, cy, count, {
      speed: 5 + (tier || 1),
      upBias: 3,
      color: '#3fb27f',
      shape: 'star'
    });
    _showBanner(
      '<div style="font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:2px;color:#3fb27f">STREAK MILESTONE</div>' +
      '<div style="font-family:\'Cinzel Decorative\',serif;font-size:16px;color:#e9e6dc">' + streak + ' DAYS</div>',
      '#3fb27f', cfg.duration
    );
  });

  window.addEventListener('omega:social-milestone', function (e) {
    if (!e.detail) return;
    var tier = e.detail.tier;
    if (tier) _currentTier = tier;
    var type = e.detail.type || 'milestone';
    var cfg = _getTierConfig();
    var count = Math.ceil(cfg.particlesPerSec * (cfg.duration / 1000));
    var cx = window.innerWidth / 2, cy = window.innerHeight * 0.4;
    var accentMap = {
      follower: '#E2C86D',
      badge: '#9B6BF0',
      publish: '#00E5FF',
      milestone: '#C9A84C'
    };
    var accent = accentMap[type] || '#C9A84C';
    _spawnBurst(cx, cy, count, {
      speed: 4 + (tier || 1),
      upBias: 2,
      color: accent,
      shape: 'rect'
    });
    var typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    _showBanner(
      '<div style="font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:2px;color:' + accent + '">' + typeLabel.toUpperCase() + '</div>' +
      '<div style="font-family:\'Rajdhani\',sans-serif;font-size:13px;color:#e9e6dc">social impact</div>',
      accent, cfg.duration
    );
  });

  window.addEventListener('omega:apex', function () { API.apex(); });

  /* ─── EXTENDED API WITH TIER MANAGEMENT ─────────────────────────── */
  var ExtendedAPI = Object.assign({}, API, {
    setTier: function (tier) { _currentTier = Math.max(1, Math.min(tier, 5)); },
    getTier: function () { return _currentTier; },
    enable: function () { _enabled = true; },
    disable: function () { _enabled = false; },
    emit: function (eventType, detail) {
      detail = detail || {};
      if (detail.tier === undefined) detail.tier = _currentTier;
      document.dispatchEvent(new CustomEvent('omega:' + eventType, { detail: detail }));
    }
  });

  window.OmegaCelebration = API;
  window.OmegaCelebrate = ExtendedAPI;
})();
