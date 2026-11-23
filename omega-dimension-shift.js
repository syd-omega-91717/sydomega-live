/* ============================================================================
   SYD OMEGA 91717 -- DIMENSION SHIFT (a quiet moment for every saved task)

   When a task is saved, the platform answers it for about a second: a faint
   wash in the member's own element colour, a small label naming the realm
   ("REALM OF FIRE"), and a window event that the council chamber's coins
   listen to (the executors who share the member's element light up). It is
   deliberately subtle: this fires on every task, so it must never get in the
   way of the next one. Nothing blocks input; nothing is announced loudly.

   THE SIGNAL IS REAL, NOT PER-PAGE. Tasks are written to task_completions
   from a dozen pages and modules, and only one of them dispatches a celebration
   event. bg.js's fetch recorder already sees every backend request; it now
   reports the method and the PATHNAME (never the query string, which can carry a
   token) in omega:fetch-settled. A shift fires when a POST to
   /rest/v1/task_completions settles ok. The older omega:task-complete event
   (habits.html) also fires one; the throttle below makes the two a single shift.

   THE ELEMENT IS THE MEMBER'S OWN. omega-backdrop.js already fetches it to
   tint the page and publishes it as window.OmegaMemberElement; this reads that
   rather than making a second profiles query on every page. Colours come from
   OmegaRealm.palette, with an inline fallback. A member whose element is not
   known yet gets the neutral "THE SOVEREIGN" gold.

   WHAT IT DOES NOT DO: it does not move the member anywhere, award anything,
   or claim a number. "Dimension" here is the realm (element) the member
   belongs to, shown for a moment. Reduced motion: no wash and no movement,
   just the label for the same time and the screen-reader line.
   Pure ASCII.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaDimensionShift) return;

  var MIN_GAP_MS = 2500;      /* one shift per burst of saves, and one for the habits event + its own insert */
  var WASH_MS = 1100, LABEL_MS = 1700;
  var last = 0;

  var NAMES = { FIRE: 'FIRE', WATER: 'WATER', WIND: 'WIND', METAL: 'METAL', SAND: 'SAND', SOUL: 'SOUL', SPACE: 'SPACE', VOID: 'VOID', NINTH: 'THE ALL', SOVEREIGN: 'THE SOVEREIGN' };
  var PALETTE_KEY = { FIRE: 'Fire', WATER: 'Water', WIND: 'Wind', METAL: 'Metal', SAND: 'Sand', SOUL: 'Soul', SPACE: 'Space', VOID: 'Void', NINTH: 'The All' };
  var FALLBACK = { FIRE: '#ff7a45', WATER: '#3da9ff', WIND: '#7fe0cf', METAL: '#c8cdd6', SAND: '#d9b86a', SOUL: '#9b6bf0', SPACE: '#5a78e6', VOID: '#b43a3a', NINTH: '#f3d98a', SOVEREIGN: '#c9a84c' };

  function element() {
    var e = window.OmegaMemberElement;
    return (typeof e === 'string' && Object.prototype.hasOwnProperty.call(NAMES, e)) ? e : 'SOVEREIGN';
  }
  function colour(el) {
    try {
      var pal = window.OmegaRealm && window.OmegaRealm.palette, k = PALETTE_KEY[el];
      var c = pal && k && pal[k] && pal[k].core;
      if (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) return c;
    } catch (e) { }
    return FALLBACK[el] || FALLBACK.SOVEREIGN;
  }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function reduced() { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }

  /* one polite, visually hidden line for assistive technology */
  function announce(text) {
    var r = document.getElementById('omega-dimension-live');
    if (!r) {
      r = document.createElement('div');
      r.id = 'omega-dimension-live'; r.setAttribute('role', 'status'); r.setAttribute('aria-live', 'polite');
      r.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
      (document.body || document.documentElement).appendChild(r);
    }
    r.textContent = '';
    setTimeout(function () { r.textContent = text; }, 30);   /* a changed node is what a live region announces */
  }

  function gone(node, ms) { setTimeout(function () { if (node && node.parentNode) node.parentNode.removeChild(node); }, ms); }

  function show(source) {
    if (!document.body) return false;
    if (document.visibilityState && document.visibilityState !== 'visible') return false;
    var now = Date.now();
    if (now - last < MIN_GAP_MS) return false;
    last = now;

    var el = element(), hex = colour(el), c = rgb(hex), name = NAMES[el], still = reduced();

    /* the wash: fixed, transparent to the pointer, below every dialog and above nothing the member is using */
    if (!still) {
      var wash = document.createElement('div');
      wash.id = 'omega-dimension-wash'; wash.setAttribute('aria-hidden', 'true');
      wash.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8500;opacity:0;' +
        'background:radial-gradient(ellipse at 50% 42%,rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',.20) 0%,rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',.07) 45%,rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0) 72%)';
      document.body.appendChild(wash);
      try { wash.animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { duration: WASH_MS, easing: 'ease-out', fill: 'none' }); } catch (e) { }
      gone(wash, WASH_MS + 200);
    }

    /* the label: top centre, clear of the top-left button and of every bottom-anchored bar */
    var label = document.createElement('div');
    label.id = 'omega-dimension-label'; label.setAttribute('aria-hidden', 'true');
    label.textContent = 'REALM OF ' + name;
    label.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 72px);transform:translateX(-50%);pointer-events:none;z-index:8501;' +
      'font:11px/1 "Courier Prime",monospace;letter-spacing:3px;white-space:nowrap;padding:7px 14px;color:' + hex + ';' +
      'border:1px solid rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',.5);background:rgba(5,5,10,.78);border-radius:2px';
    document.body.appendChild(label);
    if (!still) { try { label.animate([{ opacity: 0, transform: 'translateX(-50%) translateY(-6px)' }, { opacity: 1, transform: 'translateX(-50%) translateY(0)', offset: 0.18 }, { opacity: 1, offset: 0.78 }, { opacity: 0 }], { duration: LABEL_MS, easing: 'ease-out', fill: 'none' }); } catch (e) { } }
    gone(label, LABEL_MS + 100);

    announce('Task saved. Realm of ' + name.toLowerCase() + '.');
    try { window.dispatchEvent(new CustomEvent('omega:dimension-shift', { detail: { element: el, name: name, colour: hex, source: source || 'api', at: now } })); } catch (e) { }
    return true;
  }

  /* the real signal: a successful insert into task_completions, seen by bg.js's recorder on any page */
  document.addEventListener('omega:fetch-settled', function (e) {
    var d = e && e.detail;
    if (d && d.ok && d.m === 'POST' && /\/rest\/v1\/task_completions$/.test(d.p || '')) show('task_completions');
  });
  /* the older habits.html event; dispatched on document, so it is listened for there (and on window for any page that bubbles it) */
  document.addEventListener('omega:task-complete', function () { show('task-complete'); });
  window.addEventListener('omega:task-complete', function () { show('task-complete'); });

  window.OmegaDimensionShift = {
    trigger: function (source) { return show(source || 'api'); },
    element: element,
    minGapMs: MIN_GAP_MS
  };
})();
