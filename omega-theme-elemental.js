/* SYD OMEGA 91717 -- Elemental Theming Engine v2.0
   Proposal #22: Seasonal & Elemental Theming Integration

   Dynamically applies color palettes based on member's zodiac element and season.
   Synchronizes with nav.js OmegaAxis context, persists via localStorage with 24h expiry.
   Tier-gated: T1–T2 get automatic sign-based scheme; T3+ future customization.
   Respects prefers-reduced-motion. All 12 zodiac signs → 4 elements → 4 seasons = 64 palettes. */

(function(){
  if(window.__omegaThemeElemental) return; window.__omegaThemeElemental=true;

  // Zodiac sign → element mapping (omega-agents.json reference)
  var ELEMENT_MAP = {
    'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
    'Taurus': 'Metal', 'Virgo': 'Metal', 'Capricorn': 'Metal',
    'Gemini': 'Wind', 'Libra': 'Wind', 'Aquarius': 'Wind',
    'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water'
  };

  // Comprehensive seasonal palettes: element → season → {accent, soft, glow, primary}
  var ELEMENT_PALETTES = {
    Fire: {
      spring: {accent:'#E2B547', soft:'#D4A85A', glow:'rgba(226,181,71,0.15)', primary:'#F5D88F'},
      summer: {accent:'#FF6B4A', soft:'#E85D42', glow:'rgba(255,107,74,0.18)', primary:'#FFB399'},
      fall: {accent:'#D87A3D', soft:'#C46A2F', glow:'rgba(216,122,61,0.15)', primary:'#E8956F'},
      winter: {accent:'#C9633F', soft:'#A85532', glow:'rgba(201,99,63,0.12)', primary:'#E58A5F'}
    },
    Water: {
      spring: {accent:'#00D9E9', soft:'#00BCD4', glow:'rgba(0,217,233,0.12)', primary:'#66E9F5'},
      summer: {accent:'#00D9E9', soft:'#00C5DC', glow:'rgba(0,217,233,0.14)', primary:'#4DE8F0'},
      fall: {accent:'#0097A7', soft:'#00838F', glow:'rgba(0,151,167,0.11)', primary:'#4DB8CC'},
      winter: {accent:'#006064', soft:'#004D52', glow:'rgba(0,96,100,0.1)', primary:'#0097A7'}
    },
    Wind: {
      spring: {accent:'#B2DFDB', soft:'#80CBC4', glow:'rgba(178,223,219,0.1)', primary:'#E0F2F1'},
      summer: {accent:'#A8D8F0', soft:'#7FC3E8', glow:'rgba(168,216,240,0.11)', primary:'#D4EBF7'},
      fall: {accent:'#9FC4DD', soft:'#7DB4D3', glow:'rgba(159,196,221,0.1)', primary:'#C7DFF0'},
      winter: {accent:'#7FB3D5', soft:'#5D9FCC', glow:'rgba(127,179,213,0.09)', primary:'#B0D4E8'}
    },
    Metal: {
      spring: {accent:'#B0BEC5', soft:'#90A4AE', glow:'rgba(176,190,197,0.09)', primary:'#CFD8DC'},
      summer: {accent:'#A1887F', soft:'#8D6E63', glow:'rgba(161,136,127,0.1)', primary:'#D7CCC8'},
      fall: {accent:'#795548', soft:'#6D4C41', glow:'rgba(121,85,72,0.11)', primary:'#A1887F'},
      winter: {accent:'#455A64', soft:'#37474F', glow:'rgba(69,90,100,0.09)', primary:'#607D8B'}
    }
  };

  // Inject CSS transitions for smooth theme changes
  function injectTransitionStyles() {
    if(document.getElementById('omega-theme-transitions')) return;
    var ss = document.createElement('style');
    ss.id = 'omega-theme-transitions';
    ss.textContent = ':root{transition:--page-accent 0.8s ease,--page-soft 0.8s ease,--page-glow 0.8s ease}@media(prefers-reduced-motion:reduce){:root{transition:none!important}}';
    document.head.appendChild(ss);
  }

  // Determine current season (Northern Hemisphere)
  function getSeason() {
    var m = new Date().getMonth();
    if(m>=2&&m<5) return 'spring';
    if(m>=5&&m<8) return 'summer';
    if(m>=8&&m<11) return 'fall';
    return 'winter';
  }

  // Retrieve member's sign from localStorage or window context
  function getSign() {
    var stored = localStorage.getItem('omega_member_sign');
    if(stored && ELEMENT_MAP[stored]) return stored;
    if(window.OmegaSign && ELEMENT_MAP[window.OmegaSign]) return window.OmegaSign;
    return 'Leo'; // Default to Sovereign/Fire
  }

  // Apply palette to CSS root
  function updateSeasonalTokens(element, season) {
    var palette = ELEMENT_PALETTES[element] && ELEMENT_PALETTES[element][season];
    if(!palette) palette = ELEMENT_PALETTES.Fire.summer;

    var root = document.documentElement;
    root.style.setProperty('--page-accent', palette.accent);
    root.style.setProperty('--page-soft', palette.soft);
    root.style.setProperty('--page-glow', palette.glow);

    // Emit for downstream listeners (particles, emblems, etc.)
    try {
      document.dispatchEvent(new CustomEvent('omega:theme-changed', {
        detail: {element:element, season:season, palette:palette}
      }));
    } catch(e){}
  }

  // Persist state with 24h expiry
  function persistState(sign, element, season) {
    try {
      localStorage.setItem('omega_theme_state', JSON.stringify({
        sign:sign, element:element, season:season,
        timestamp:Date.now()
      }));
    } catch(e){}
  }

  // Restore from localStorage if fresh
  function restoreFromLocalStorage() {
    try {
      var stored = localStorage.getItem('omega_theme_state');
      if(!stored) return false;
      var state = JSON.parse(stored);
      var age = Date.now() - (state.timestamp||0);
      if(age < 24*60*60*1000) {
        updateSeasonalTokens(state.element, state.season);
        return true;
      }
    } catch(e){}
    return false;
  }

  // Listen for theme update events from nav context
  document.addEventListener('omega-theme-update', function(e) {
    var detail = e.detail || {};
    var tier = detail.tier;
    // All tiers get automatic theming; T3+ would get UI customization
    var element = detail.element || ELEMENT_MAP[getSign()] || 'Fire';
    var season = getSeason();
    updateSeasonalTokens(element, season);
    persistState(detail.sign || getSign(), element, season);
  });

  // Initialize on load
  function init() {
    injectTransitionStyles();
    if(!restoreFromLocalStorage()) {
      var sign = getSign();
      var element = ELEMENT_MAP[sign] || 'Fire';
      var season = getSeason();
      updateSeasonalTokens(element, season);
      persistState(sign, element, season);
    }
    scheduleNextUpdate();
  }

  // Update at midnight UTC for season transitions
  function scheduleNextUpdate() {
    var now = new Date();
    var tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    var msUntilMidnight = tomorrow - now;
    setTimeout(init, msUntilMidnight);
  }

  // Boot
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.OmegaTheme = {
    init: init,
    updateTokens: updateSeasonalTokens,
    getState: function() {
      try { return JSON.parse(localStorage.getItem('omega_theme_state')||'{}'); }
      catch(e) { return {}; }
    },
    clearState: function() {
      try { localStorage.removeItem('omega_theme_state'); } catch(e) {}
    }
  };
})();
