/* ==========================================================================
   Ω SYD OMEGA 91717 — VOICE-RESPONSIVE ANIMATIONS (omega-voice-responsive.js)
   Proposal #25: Voice-Responsive Animations

   Synchronize particle emission rate, constellation node glow intensity, and
   bloom to the copilot's voice stream speed and energy level.

   As omega-copilot.js streams a response token-by-token (or simulates streaming
   via response length), the particle system pulses in sync:
   - Faster tokens → faster particle burst (emission rate peaks)
   - Slower tokens / silence → particles settle (emission rate drops)
   - Voice energy (via Web Audio API peak frequency) modulates glow intensity
   - Fallback: text-streaming speed drives animation on non-audio responses

   Fully disabled under prefers-reduced-motion per user preference.
   ========================================================================== */
(function(){
  if(window.__omegaVoiceResponsive) return;
  window.__omegaVoiceResponsive = true;

  /* Respect prefers-reduced-motion */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* Configuration */
  var CONFIG = {
    /* Particle emission rates (synchronized with Phase 3) */
    emissionRates: {
      idle: 3,
      slow: 5,
      normal: 10,
      fast: 15,
      intense: 20
    },

    /* Token timing thresholds (ms per token) */
    tokenTimings: {
      fast: 40,      /* < 40ms = intense (multiple tokens per ~frame) */
      normal: 100,   /* < 100ms = normal */
      slow: 200      /* >= 200ms = slow */
    },

    /* Glow intensity modulation (0.0-1.0 scale for constellation) */
    glowIntensity: {
      idle: 0.3,
      slow: 0.5,
      normal: 0.8,
      fast: 1.0,
      peak: 1.2
    },

    /* Bloom intensity modulation */
    bloomIntensity: {
      idle: 0.2,
      slow: 0.4,
      normal: 0.7,
      fast: 1.0
    },

    /* Smoothing factor for emission rate transitions (0-1, higher = smoother) */
    emissionSmoothing: 0.15,

    /* Web Audio configuration (for voice energy detection) */
    audioConfig: {
      fftSize: 256,
      analyzeFrequencyRange: { min: 80, max: 4000 }  /* Hz range for voice */
    }
  };

  /* State tracking */
  var state = {
    isStreaming: false,
    streamStartTime: null,
    lastTokenTime: null,
    tokenCount: 0,
    currentEmissionRate: CONFIG.emissionRates.idle,
    currentGlowIntensity: CONFIG.glowIntensity.idle,
    currentBloomIntensity: CONFIG.bloomIntensity.idle,
    audioAnalyser: null,
    audioContext: null,
    voiceEnergyPeak: 0,
    voiceEnergyDecay: 0.95  /* Decay voice energy over time */
  };

  /**
   * Initialize Web Audio API for voice energy detection
   * Safe fallback if AudioContext is unavailable or denied
   */
  function initAudioAnalyser() {
    if(prefersReduced || state.audioAnalyser) return;

    try {
      if(!window.AudioContext && !window.webkitAudioContext) return;

      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioCtx();

      /* Request microphone access for live voice energy analysis */
      if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({audio: true})
          .then(function(stream) {
            var source = state.audioContext.createMediaStreamSource(stream);
            state.audioAnalyser = state.audioContext.createAnalyser();
            state.audioAnalyser.fftSize = CONFIG.audioConfig.fftSize;
            source.connect(state.audioAnalyser);
          })
          .catch(function(e) {
            /* Microphone access denied or unavailable — use fallback */
            console.debug('Voice energy detection unavailable, using text speed fallback');
          });
      }
    } catch(e) {
      /* AudioContext not available — fallback to text speed */
    }
  }

  /**
   * Detect voice energy from Web Audio analyser (peak frequency magnitude)
   */
  function getVoiceEnergy() {
    if(!state.audioAnalyser) return 0;

    try {
      var data = new Uint8Array(state.audioAnalyser.frequencyBinCount);
      state.audioAnalyser.getByteFrequencyData(data);

      /* Find peak in voice frequency range (80-4000 Hz) */
      var nyquist = state.audioContext.sampleRate / 2;
      var minBin = Math.floor((CONFIG.audioConfig.analyzeFrequencyRange.min / nyquist) * data.length);
      var maxBin = Math.ceil((CONFIG.audioConfig.analyzeFrequencyRange.max / nyquist) * data.length);

      var peak = 0;
      for(var i = minBin; i < maxBin; i++) {
        if(data[i] > peak) peak = data[i];
      }

      /* Normalize to 0-1 range (255 is max byte value) */
      return peak / 255;
    } catch(e) {
      return 0;
    }
  }

  /**
   * Calculate current token arrival speed and map to emission rate
   */
  function calculateEmissionRate() {
    if(!state.isStreaming) {
      return CONFIG.emissionRates.idle;
    }

    var now = Date.now();
    var timeSinceLastToken = now - (state.lastTokenTime || state.streamStartTime);

    if(timeSinceLastToken < CONFIG.tokenTimings.fast) {
      return CONFIG.emissionRates.intense;
    } else if(timeSinceLastToken < CONFIG.tokenTimings.normal) {
      return CONFIG.emissionRates.fast;
    } else if(timeSinceLastToken < CONFIG.tokenTimings.slow) {
      return CONFIG.emissionRates.normal;
    } else {
      return CONFIG.emissionRates.slow;
    }
  }

  /**
   * Calculate glow intensity based on token speed and voice energy
   */
  function calculateGlowIntensity() {
    if(!state.isStreaming) {
      return CONFIG.glowIntensity.idle;
    }

    var now = Date.now();
    var timeSinceLastToken = now - (state.lastTokenTime || state.streamStartTime);
    var baseIntensity;

    if(timeSinceLastToken < CONFIG.tokenTimings.fast) {
      baseIntensity = CONFIG.glowIntensity.fast;
    } else if(timeSinceLastToken < CONFIG.tokenTimings.normal) {
      baseIntensity = CONFIG.glowIntensity.normal;
    } else if(timeSinceLastToken < CONFIG.tokenTimings.slow) {
      baseIntensity = CONFIG.glowIntensity.slow;
    } else {
      baseIntensity = CONFIG.glowIntensity.idle;
    }

    /* Modulate with voice energy if available */
    var voiceEnergy = getVoiceEnergy();
    state.voiceEnergyPeak = Math.max(voiceEnergy, state.voiceEnergyPeak * state.voiceEnergyDecay);

    /* Blend base intensity with voice energy (voice energy can boost up to peak intensity) */
    return baseIntensity + (state.voiceEnergyPeak * (CONFIG.glowIntensity.peak - baseIntensity));
  }

  /**
   * Apply emission rate to particle system via OmegaPhase3 API
   */
  function applyEmissionRate(rate) {
    if(prefersReduced || !window.OmegaPhase3) return;

    try {
      /* Smooth transition to new rate */
      state.currentEmissionRate += (rate - state.currentEmissionRate) * CONFIG.emissionSmoothing;

      /* Update particle system */
      if(window.OmegaPhase3.setEmissionRate) {
        window.OmegaPhase3.setEmissionRate(Math.round(state.currentEmissionRate));
      }
    } catch(e) {
      /* OmegaPhase3 not ready — safe to ignore */
    }
  }

  /**
   * Apply glow intensity to constellation nodes
   */
  function applyGlowIntensity(intensity) {
    if(prefersReduced) return;

    try {
      var nodes = document.querySelectorAll('.ocn-node, [data-omega-emblem]');
      nodes.forEach(function(node) {
        var baseGlow = 'rgba(201,168,76,0.15)';  /* Default gold glow */
        var intensifiedGlow = 'rgba(201,168,76,' + (0.15 * intensity) + ')';

        /* Apply via CSS custom property for constellation effects */
        node.style.setProperty('--constellation-glow-intensity', intensity.toFixed(2));

        /* Optional: Update box-shadow for visual feedback */
        if(intensity > 0.7) {
          var glowSize = Math.round(2 + (intensity * 4));
          var glowColor = 'rgba(201,168,76,' + (0.3 * intensity) + ')';
          node.style.boxShadow = '0 0 ' + glowSize + 'px ' + glowColor;
        } else {
          node.style.boxShadow = '';
        }
      });
    } catch(e) {
      /* DOM not ready or selector mismatch — safe to ignore */
    }
  }

  /**
   * Apply bloom intensity to sculpture or cinematic layers
   */
  function applyBloomIntensity(intensity) {
    if(prefersReduced) return;

    try {
      var sculptureElement = document.querySelector('[data-omega-sculpture]');
      if(sculptureElement) {
        var filterValue = 'blur(' + (1 - intensity) + 'px) brightness(' + (0.9 + (intensity * 0.1)) + ')';
        sculptureElement.style.filter = filterValue;
      }
    } catch(e) {
      /* Sculpture not on page — safe to ignore */
    }
  }

  /**
   * Update animation frame — call this repeatedly while streaming
   */
  function update() {
    if(prefersReduced) return;

    var emissionRate = calculateEmissionRate();
    var glowIntensity = calculateGlowIntensity();
    var bloomIntensity = state.isStreaming
      ? CONFIG.bloomIntensity.normal + (emissionRate / CONFIG.emissionRates.intense) * (CONFIG.bloomIntensity.fast - CONFIG.bloomIntensity.normal)
      : CONFIG.bloomIntensity.idle;

    applyEmissionRate(emissionRate);
    applyGlowIntensity(glowIntensity);
    applyBloomIntensity(bloomIntensity);
  }

  /**
   * Animation loop
   */
  var animationFrameId = null;
  function animationLoop() {
    update();
    animationFrameId = requestAnimationFrame(animationLoop);
  }

  /**
   * Start animation loop
   */
  function startAnimationLoop() {
    if(prefersReduced || animationFrameId) return;
    animationFrameId = requestAnimationFrame(animationLoop);
  }

  /**
   * Stop animation loop
   */
  function stopAnimationLoop() {
    if(animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  /**
   * Listen for copilot stream start
   * Emitted by omega-copilot.js when a response begins streaming
   */
  document.addEventListener('omega:copilot-stream-start', function(e) {
    if(prefersReduced) return;

    state.isStreaming = true;
    state.streamStartTime = Date.now();
    state.lastTokenTime = state.streamStartTime;
    state.tokenCount = 0;
    state.voiceEnergyPeak = 0;

    /* Optionally initialize audio analyzer on first stream */
    if(!state.audioAnalyser) {
      initAudioAnalyser();
    }

    startAnimationLoop();
  });

  /**
   * Listen for copilot token arrival
   * Emitted by omega-copilot.js for each token/character
   */
  document.addEventListener('omega:copilot-token', function(e) {
    if(prefersReduced) return;

    state.lastTokenTime = Date.now();
    state.tokenCount = (state.tokenCount || 0) + 1;
  });

  /**
   * Listen for copilot stream end
   * Emitted by omega-copilot.js when response completes
   */
  document.addEventListener('omega:copilot-stream-end', function(e) {
    if(prefersReduced) return;

    state.isStreaming = false;

    /* Fade out animation over 1 second */
    var fadeOutDuration = 1000;
    var fadeOutStart = Date.now();

    var fadeOut = setInterval(function() {
      var elapsed = Date.now() - fadeOutStart;
      var progress = Math.min(elapsed / fadeOutDuration, 1);

      /* Linearly fade toward idle state */
      var idleEmissionRate = CONFIG.emissionRates.idle;
      var targetEmissionRate = idleEmissionRate + (state.currentEmissionRate - idleEmissionRate) * (1 - progress);

      applyEmissionRate(targetEmissionRate);

      var targetGlowIntensity = CONFIG.glowIntensity.idle + (state.currentGlowIntensity - CONFIG.glowIntensity.idle) * (1 - progress);
      applyGlowIntensity(targetGlowIntensity);

      var targetBloomIntensity = CONFIG.bloomIntensity.idle + (state.currentBloomIntensity - CONFIG.bloomIntensity.idle) * (1 - progress);
      applyBloomIntensity(targetBloomIntensity);

      if(progress >= 1) {
        clearInterval(fadeOut);
        stopAnimationLoop();
        state.currentEmissionRate = idleEmissionRate;
        state.currentGlowIntensity = CONFIG.glowIntensity.idle;
        state.currentBloomIntensity = CONFIG.bloomIntensity.idle;
      }
    }, 16);  /* ~60 FPS */
  });

  /**
   * Public API
   */
  window.OmegaVoiceResponsive = {
    isStreaming: function() { return state.isStreaming; },
    getTokenCount: function() { return state.tokenCount; },
    getVoiceEnergy: getVoiceEnergy,
    getEmissionRate: function() { return state.currentEmissionRate; },
    getGlowIntensity: function() { return state.currentGlowIntensity; }
  };

  /**
   * Initialize on load
   */
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if(!prefersReduced) {
        startAnimationLoop();
      }
    });
  } else {
    if(!prefersReduced) {
      startAnimationLoop();
    }
  }
})();
