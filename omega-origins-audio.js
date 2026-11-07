/* omega-origins-audio.js -- synthesized sound for MYTH OF THE STONES: ORIGINS, Vertical Slice 0.
 *
 * Every sound is made in code with the Web Audio API; no audio file is loaded or copied. The valley's
 * under-tone is the franchise's 9.1717 Hz motif: 9.1717 Hz by itself is below hearing, so it is heard as a
 * *beat*, a 110 Hz carrier whose loudness is modulated at 9.1717 Hz. The context is created only after the
 * first player gesture (browsers require it), and the whole module is silent and harmless if Web Audio is
 * missing or the player mutes it.
 * Browser global: window.OmegaOriginsAudio. */
(function (root) {
  'use strict';
  var ctx = null, master = null, humGain = null, muted = false, vol = 0.6, started = false;
  var HUM_HZ = 9.1717;

  function ensure() {
    if (ctx) return ctx;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = muted ? 0 : vol; master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }
  function startHum() {
    if (started || !ensure()) return;
    started = true;
    var carrier = ctx.createOscillator(); carrier.type = 'sine'; carrier.frequency.value = 110;
    var carrier2 = ctx.createOscillator(); carrier2.type = 'triangle'; carrier2.frequency.value = 164.8;
    var am = ctx.createGain(); am.gain.value = 0.5;
    var lfo = ctx.createOscillator(); lfo.frequency.value = HUM_HZ;
    var lfoDepth = ctx.createGain(); lfoDepth.gain.value = 0.5;
    humGain = ctx.createGain(); humGain.gain.value = 0.0;
    lfo.connect(lfoDepth); lfoDepth.connect(am.gain);
    carrier.connect(am); carrier2.connect(am); am.connect(humGain); humGain.connect(master);
    carrier.start(); carrier2.start(); lfo.start();
    humGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 3);
  }
  function tone(freq, dur, type, gain, slideTo) {
    if (!ensure() || muted) return;
    var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain || 0.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, gain, hp) {
    if (!ensure() || muted) return;
    var n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ctx.createBufferSource(); s.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 1200;
    var g = ctx.createGain(); g.gain.value = gain || 0.2;
    s.connect(f); f.connect(g); g.connect(master); s.start();
  }
  var api = {
    unlock: function () { if (ensure() && ctx.state === 'suspended') ctx.resume(); startHum(); },
    setMuted: function (m) { muted = !!m; if (master) master.gain.value = muted ? 0 : vol; },
    isMuted: function () { return muted; },
    setVolume: function (v) { vol = Math.max(0, Math.min(1, v)); if (master && !muted) master.gain.value = vol; },
    /* the hum swells as the stone wakes: 0..1 */
    humLevel: function (l) { if (humGain) humGain.gain.linearRampToValueAtTime(0.05 + 0.12 * l, ctx.currentTime + 0.4); },
    swing: function () { noise(0.14, 0.18, 1800); tone(380, 0.12, 'sawtooth', 0.04, 160); },
    hit: function () { tone(150, 0.14, 'square', 0.12, 60); noise(0.08, 0.16, 900); },
    hurt: function () { tone(110, 0.22, 'sawtooth', 0.16, 55); },
    dodge: function () { noise(0.22, 0.1, 600); },
    echo: function () { tone(880, 0.5, 'sine', 0.12, 1760); tone(440, 0.6, 'triangle', 0.08, 220); },
    telegraph: function () { tone(220, 0.18, 'triangle', 0.05, 330); },
    kill: function () { tone(520, 0.25, 'triangle', 0.1, 130); },
    levelUp: function () { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { tone(f, 0.35, 'sine', 0.12); }, i * 110); }); },
    read: function () { tone(196, 1.6, 'sine', 0.12, 392); tone(98, 2, 'triangle', 0.1); },
    pickup: function () { tone(660, 0.12, 'sine', 0.1); setTimeout(function () { tone(990, 0.16, 'sine', 0.1); }, 80); },
    boss: function () { tone(70, 0.9, 'sawtooth', 0.15, 40); }
  };
  root.OmegaOriginsAudio = api;
})(typeof window !== 'undefined' ? window : globalThis);
