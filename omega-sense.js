/* ============================================================================
   SYD OMEGA 91717 — SENSE
   One voice for interaction feedback: a short synthesized tone and, on
   devices that have one, a haptic pattern, both shaped by the member's
   element. Before this, interaction sound was one fixed 458.5Hz sine
   (omega-9d.js) and haptics were three unrelated navigator.vibrate() calls.

   Element. Read from localStorage.omega_theme_element, which theme.js
   publishes from the member's sign through OmegaCanon.elementFor(). Never a
   copy of the sign→element table (CLAUDE.md 8.1 class 8). Unknown → SAND.

   Voices, all tuned to the platform's 458.5Hz (9.17 × 50):
     FIRE   triangle, bright, pitch bends up into the note
     WATER  sine gliding down, slow vibrato
     WIND   two detuned sines, airy, soft attack
     METAL  inharmonic bell partials (1, 2.76, 5.4), quick ring
     SAND   filtered square, warm and short

   Cues:
     press    one short note                  no haptic (every tap would buzz)
     success  rising fifth                    [12,40,18]
     error    falling minor third             [30,40,30]
     unlock   four-note arpeggio              [20,30,20,30,60]
     navigate one soft low note               no haptic

   What is wired automatically, and what deliberately is not:
     press  — pointerdown on buttons and card links: an acknowledgement, not a claim.
     error  — omegaToast(msg,'error'), the platform's failure toast.
     unlock — omega-sdt.js's gate celebration, which needs a server-authored event.
     success is NEVER inferred. bg.js echoes a gold toast with the button's own
     label on SAVE/SUBMIT/… clicks before any write has resolved, so a gold
     toast proves nothing; a success chime on it would assert a success that
     may not exist (CLAUDE.md 8.1 class 1). A page that has checked its write's
     `.error` calls OmegaSense.cue('success') itself.

   Gates: sound only when localStorage.omega_sound === 'on' (the same explicit
   opt-in omega-9d.js uses; the platform-wide default is an open owner decision
   in GAP_ANALYSIS.md). Haptics unless localStorage.omega_haptics === 'off'.
   prefers-reduced-motion silences both, as audio.js already treats it.
   Its own guard attribute, data-omega-sense (CLAUDE.md 8.1 class 5b).
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaSense) return;

  var ROOT_HZ = 458.5;
  var VOLUME = 0.035;
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var log = [];

  var CUES = {
    press:    { notes: [1],                 gap: 0,    dur: 0.09, haptic: null },
    success:  { notes: [1, 1.5],            gap: 0.09, dur: 0.16, haptic: [12, 40, 18] },
    error:    { notes: [0.94, 0.79],        gap: 0.11, dur: 0.18, haptic: [30, 40, 30] },
    unlock:   { notes: [1, 1.25, 1.5, 2],   gap: 0.08, dur: 0.22, haptic: [20, 30, 20, 30, 60] },
    navigate: { notes: [0.5],               gap: 0,    dur: 0.14, haptic: null }
  };

  function store(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function element() {
    var e = String(store('omega_theme_element') || 'SAND').toUpperCase();
    return VOICES[e] ? e : 'SAND';
  }
  function soundOn() { return !REDUCED && !!AC && store('omega_sound') === 'on'; }
  function hapticsOn() { return !REDUCED && typeof navigator.vibrate === 'function' && store('omega_haptics') !== 'off'; }

  function audio() {
    if (!ctx) { try { ctx = new AC(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function envelope(c, t, dur, attack) {
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(VOLUME, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(c.destination);
    return g;
  }
  function osc(c, type, hz, t, dur, out) {
    var o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(hz, t);
    o.connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
    return o;
  }

  var VOICES = {
    FIRE: function (c, hz, t, dur) {
      var o = osc(c, 'triangle', hz * 0.94, t, dur, envelope(c, t, dur, 0.004));
      o.frequency.exponentialRampToValueAtTime(hz, t + 0.04);
    },
    WATER: function (c, hz, t, dur) {
      var o = osc(c, 'sine', hz * 1.06, t, dur, envelope(c, t, dur, 0.012));
      o.frequency.exponentialRampToValueAtTime(hz, t + dur * 0.6);
      var lfo = c.createOscillator(), depth = c.createGain();
      lfo.frequency.value = 6; depth.gain.value = hz * 0.006;
      lfo.connect(depth); depth.connect(o.frequency);
      lfo.start(t); lfo.stop(t + dur + 0.02);
    },
    WIND: function (c, hz, t, dur) {
      var out = envelope(c, t, dur, 0.03);
      osc(c, 'sine', hz, t, dur, out);
      osc(c, 'sine', hz * 1.007, t, dur, out);
    },
    METAL: function (c, hz, t, dur) {
      var out = envelope(c, t, dur * 1.3, 0.002);
      [1, 2.76, 5.4].forEach(function (p, i) {
        var g = c.createGain(); g.gain.value = [1, 0.4, 0.18][i]; g.connect(out);
        osc(c, 'sine', hz * p, t, dur * 1.3, g);
      });
    },
    SAND: function (c, hz, t, dur) {
      var f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = hz * 2.2;
      f.connect(envelope(c, t, dur, 0.006));
      osc(c, 'square', hz, t, dur, f);
    }
  };

  function cue(kind) {
    var spec = CUES[kind];
    if (!spec) return false;
    var el = element(), played = false, buzzed = false;
    if (soundOn()) {
      var c = audio();
      if (c) {
        var t = c.currentTime + 0.005;
        spec.notes.forEach(function (n, i) {
          VOICES[el](c, ROOT_HZ * n, t + i * spec.gap, spec.dur);
        });
        played = true;
      }
    }
    if (spec.haptic && hapticsOn()) {
      try { buzzed = navigator.vibrate(spec.haptic) !== false; } catch (e) {}
    }
    log.push({ kind: kind, element: el, sound: played, haptic: buzzed });
    if (log.length > 20) log.shift();
    return played || buzzed;
  }

  /* press: an acknowledgement on the shared action surfaces. */
  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    var t = e.target && e.target.closest &&
      e.target.closest('button, .btn, [role="button"], a.card, .om-card, .osh-b');
    if (t && !t.disabled && !t.hasAttribute('data-no-sense')) cue('press');
  }, true);

  /* error: bg.js's omegaToast(msg,'error') is the platform's failure toast.
     Wrapped rather than observed: a document-wide MutationObserver waiting for
     the lazily created #omega-toasts would run on every mutation of every page. */
  function wrapToast() {
    var orig = window.omegaToast;
    if (typeof orig !== 'function' || orig.__omegaSense) return typeof orig === 'function';
    var wrapped = function (msg, type) {
      var out = orig.apply(this, arguments);
      if (type === 'error') cue('error');
      return out;
    };
    wrapped.__omegaSense = true;
    window.omegaToast = wrapped;
    return true;
  }
  if (!wrapToast()) document.addEventListener('DOMContentLoaded', wrapToast, { once: true });

  window.OmegaSense = {
    cue: cue,
    element: element,
    haptics: function (on) { try { localStorage.setItem('omega_haptics', on ? 'on' : 'off'); } catch (e) {} },
    status: function () {
      return { element: element(), sound: soundOn(), haptics: hapticsOn(), reduced: REDUCED, recent: log.slice() };
    }
  };
})();
