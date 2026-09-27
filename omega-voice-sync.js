/**
 * omega-voice-sync.js — Voice-responsive particle animations
 *
 * Synchronizes particle emission rate to copilot stream speed and voice energy.
 * Listens to omega:copilot-token events and computes token arrival frequency,
 * dispatching omega:voice-energy with normalized rate for particle system tuning.
 *
 * Respects prefers-reduced-motion: disables Web Audio integration, falls back
 * to text-stream timing only when reduced motion is preferred.
 */

(function() {
  'use strict';

  /* Check for reduced motion preference */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* State tracking */
  let isStreaming = false;
  let tokenBuffer = [];
  let emissionTimestamp = 0;
  let tokenRateCheckInterval = null;
  let audioContext = null;
  let analyser = null;

  /* Configuration */
  const TOKEN_RATE_CHECK_MS = 100; /* Sample token rate every 100ms */
  const MAX_TOKENS_PER_SEC = 40;   /* Normalize to 40 tokens/sec = max rate */
  const MIN_EMISSION_RATE = 0.2;   /* Minimum emission rate scalar */
  const MAX_EMISSION_RATE = 1.0;   /* Maximum emission rate scalar */

  /**
   * Initialize Web Audio API for voice energy detection
   * Attaches AnalyserNode to copilot's audio element if present
   */
  function initializeWebAudio() {
    if (prefersReduced || audioContext) return;

    try {
      const audioElement = document.querySelector('audio[id*="copilot"]')
                        || document.querySelector('audio');
      if (!audioElement) return; /* No audio element, use text-stream timing only */

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();

      const source = audioContext.createMediaElementAudioSource(audioElement);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      source.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (e) {
      /* Web Audio API unavailable, fall back to text-stream timing */
      audioContext = null;
      analyser = null;
    }
  }

  /**
   * Compute voice energy level from AnalyserNode frequency data
   * Returns normalized 0–1 scalar based on peak frequency energy
   */
  function getVoiceEnergy() {
    if (!analyser) return 0.5; /* Default mid-range if no audio */

    try {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      /* Find peak frequency energy */
      let peak = 0;
      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > peak) peak = dataArray[i];
      }

      /* Normalize to 0–1 range (255 = max frequency energy) */
      return Math.max(0.3, Math.min(1.0, peak / 255));
    } catch (e) {
      return 0.5;
    }
  }

  /**
   * Dispatch omega:voice-energy event with current token rate and voice energy
   */
  function dispatchVoiceEnergy() {
    if (!isStreaming || tokenBuffer.length === 0) return;

    const now = performance.now();
    let elapsed = (now - emissionTimestamp) / 1000;

    if (elapsed <= 0) return;

    /* Compute tokens/sec from buffer */
    const tokensPerSec = tokenBuffer.length / elapsed;

    /* Normalize to 0–1 (40 tokens/sec = max rate) */
    let normalizedTokenRate = Math.min(tokensPerSec / MAX_TOKENS_PER_SEC, 1.0);
    normalizedTokenRate = Math.max(MIN_EMISSION_RATE, normalizedTokenRate);

    /* Blend with voice energy if audio available */
    let voiceEnergy = prefersReduced ? 0.5 : getVoiceEnergy();
    let blendedRate = (normalizedTokenRate + voiceEnergy) / 2;

    try {
      document.dispatchEvent(new CustomEvent('omega:voice-energy', {
        detail: {
          tokenRate: tokensPerSec,
          normalizedRate: blendedRate,
          voiceEnergy: voiceEnergy,
          tokenCount: tokenBuffer.length
        }
      }));
    } catch (e) {
      /* Silently fail if event dispatch unavailable */
    }

    /* Reset buffer for next window */
    tokenBuffer = [];
    emissionTimestamp = now;
  }

  /**
   * Start periodic token rate sampling when copilot stream begins
   */
  function startVoiceSync() {
    if (isStreaming) return;

    isStreaming = true;
    tokenBuffer = [];
    emissionTimestamp = performance.now();

    initializeWebAudio();

    if (!tokenRateCheckInterval) {
      tokenRateCheckInterval = setInterval(dispatchVoiceEnergy, TOKEN_RATE_CHECK_MS);
    }
  }

  /**
   * Stop periodic sampling when copilot stream ends
   */
  function stopVoiceSync() {
    isStreaming = false;

    if (tokenRateCheckInterval) {
      clearInterval(tokenRateCheckInterval);
      tokenRateCheckInterval = null;
    }

    /* Dispatch final energy event to settle particle system */
    try {
      document.dispatchEvent(new CustomEvent('omega:voice-energy', {
        detail: {
          tokenRate: 0,
          normalizedRate: 0,
          voiceEnergy: 0,
          streamEnded: true
        }
      }));
    } catch (e) {}

    /* Cleanup audio context if it was created */
    if (audioContext && audioContext.state === 'running') {
      try {
        audioContext.close();
      } catch (e) {}
      audioContext = null;
      analyser = null;
    }
  }

  /**
   * Handle individual token arrivals
   * Buffer token indices to compute arrival frequency
   */
  function handleCopilotToken(event) {
    if (!isStreaming) return;

    const detail = event.detail || {};
    tokenBuffer.push(detail.tokenIndex || 0);
  }

  /**
   * Public API
   */
  const OmegaVoiceSync = {
    init: startVoiceSync,
    cleanup: stopVoiceSync,
    isActive: () => isStreaming,
    getTokenRate: () => tokenBuffer.length / Math.max((performance.now() - emissionTimestamp) / 1000, 0.001)
  };

  /* Expose to window */
  window.OmegaVoiceSync = OmegaVoiceSync;

  /* ── EVENT LISTENERS ───────────────────────────────────────────────── */

  document.addEventListener('omega:copilot-stream-start', startVoiceSync);
  document.addEventListener('omega:copilot-stream-end', stopVoiceSync);
  document.addEventListener('omega:copilot-token', handleCopilotToken);

  /* Cleanup on page unload */
  window.addEventListener('beforeunload', stopVoiceSync);
})();
