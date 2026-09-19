/* SYD OMEGA 91717 -- Elemental Theming Engine
   Synchronizes member element affiliation with dynamic CSS token cycling.
   Driven by window.OmegaAxis changes, persists via localStorage, tier-gated. */
(function(){
  if(window.__omegaThemeElemental) return; window.__omegaThemeElemental=true;

  const ELEMENT_PALETTES = {
    earth: { accent: '#8B7355', soft: '#C4B5A0', glow: '#D4C5B5', primary: '#6B5344' },
    water: { accent: '#4A90E2', soft: '#7FB3E5', glow: '#9FC7F0', primary: '#2E5C8A' },
    fire: { accent: '#E74C3C', soft: '#EC7063', glow: '#F1948A', primary: '#A93226' },
    air: { accent: '#9B59B6', soft: '#C39BD3', glow: '#D7BDE2', primary: '#6C3483' }
  };

  function getSeasonalOffset(timestamp = Date.now()) {
    const day = Math.floor(timestamp / (24 * 60 * 60 * 1000)) % 365;
    const season = Math.floor(day / 91); // 0=spring, 1=summer, 2=fall, 3=winter
    const phases = [1.0, 1.15, 0.85, 0.95]; // brightness multiplier per season
    return phases[season];
  }

  function adjustBrightness(hex, factor) {
    try {
      const c = parseInt(hex.slice(1), 16);
      const r = Math.round((c >> 16) * factor).toString(16).padStart(2, '0');
      const g = Math.round(((c >> 8) & 0xFF) * factor).toString(16).padStart(2, '0');
      const b = Math.round((c & 0xFF) * factor).toString(16).padStart(2, '0');
      return '#' + r + g + b;
    } catch(e) { return hex; }
  }

  function updateSeasonalTokens(axis, element, season = null) {
    const palette = ELEMENT_PALETTES[element] || ELEMENT_PALETTES.earth;
    const seasonalBrightness = season ? getSeasonalOffset() : 1.0;

    const root = document.documentElement;
    root.style.setProperty('--page-accent', adjustBrightness(palette.accent, seasonalBrightness));
    root.style.setProperty('--page-soft', adjustBrightness(palette.soft, seasonalBrightness));
    root.style.setProperty('--page-glow', adjustBrightness(palette.glow, seasonalBrightness));
  }

  function restoreFromLocalStorage() {
    try {
      const stored = localStorage.getItem('omega_theme_state');
      if (!stored) return;

      const state = JSON.parse(stored);
      const age = Date.now() - (state.timestamp || 0);

      // Persist for 24 hours
      if (age < 24 * 60 * 60 * 1000) {
        updateSeasonalTokens(state.axis, state.element, true);
        return true;
      }
    } catch(e) { /* ignore */ }
    return false;
  }

  function persistState(axis, element) {
    try {
      localStorage.setItem('omega_theme_state', JSON.stringify({
        axis, element,
        timestamp: Date.now(),
        season: new Date().getMonth()
      }));
    } catch(e) { /* ignore if storage unavailable */ }
  }

  // Listen for theme update events
  document.addEventListener('omega-theme-update', function(e) {
    const { axis, element, tier } = e.detail || {};

    // Tier gating: only 3+ unlocks elemental themes
    if (tier && tier < 3) return;

    if (element && ELEMENT_PALETTES[element]) {
      updateSeasonalTokens(axis, element, true);
      persistState(axis, element);
    }
  });

  // Restore on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreFromLocalStorage);
  } else {
    restoreFromLocalStorage();
  }

  // Expose public API
  window.OmegaTheme = {
    init: function() { restoreFromLocalStorage(); },
    updateTokens: updateSeasonalTokens,
    getState: function() {
      try {
        return JSON.parse(localStorage.getItem('omega_theme_state') || '{}');
      } catch(e) { return {}; }
    },
    clearState: function() {
      try { localStorage.removeItem('omega_theme_state'); } catch(e) {}
    }
  };
})();
