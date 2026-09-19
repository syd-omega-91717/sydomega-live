/* ==========================================================================
   Ω SYD OMEGA 91717 — SEASONAL & ELEMENTAL THEMING (omega-theme-personalization.js)
   Proposal #22: Dynamic Theme Personalization

   Personalize the platform's visual identity to each member's zodiac element
   and the current calendar season. Fire members see warm golds/reds, water
   members see cool cyans/blues, earth members see greens/browns, air members
   see silvers/purples. Seasonal modulation (spring brightens, summer saturates,
   fall warms, winter desaturates) layers automatically on top.

   No new tables/RPCs: reads existing profiles.sign (populated via omega-agents.json
   zodiac mapping) and current date. Publishes CSS tokens to :root; all pages
   inherit automatically. Respects prefers-reduced-motion (applies static palette,
   no transitions).
   ========================================================================== */
(function(){
  if(window.__omegaThemePersonalization) return;
  window.__omegaThemePersonalization = true;

  var prefersReduced = false;
  try { prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e) {}

  /* Element → color palette mapping */
  var ELEMENT_PALETTES = {
    'fire': {
      primary: '#d97706',    /* warm gold-orange */
      secondary: '#dc2626',  /* fire red */
      accent: '#f59e0b',     /* solar amber */
      glow: '#fbbf24'        /* bright gold for glow */
    },
    'water': {
      primary: '#0891b2',    /* cyan */
      secondary: '#0369a1',  /* deep blue */
      accent: '#6366f1',     /* indigo */
      glow: '#06b6d4'        /* cyan glow */
    },
    'earth': {
      primary: '#22c55e',    /* green */
      secondary: '#84cc16',  /* lime */
      accent: '#b45309',     /* brown accent */
      glow: '#4ade80'        /* bright green */
    },
    'air': {
      primary: '#a78bfa',    /* purple */
      secondary: '#e0e7ff',  /* light lavender */
      accent: '#c084fc',     /* lighter purple */
      glow: '#d8b4fe'        /* soft purple glow */
    }
  };

  /* Season → saturation/brightness modifiers */
  var SEASON_MODIFIERS = {
    'spring': { saturation: 1.15, brightness: 1.10 },    /* 3-5 (Mar-May): brighten */
    'summer': { saturation: 1.20, brightness: 1.00 },    /* 6-8 (Jun-Aug): full saturation */
    'fall': { saturation: 1.08, brightness: 1.05 },      /* 9-11 (Sep-Nov): warm */
    'winter': { saturation: 0.90, brightness: 0.95 }     /* 12,1,2 (Dec-Feb): desaturate */
  };

  /**
   * Get current season from month (0-11)
   */
  function getSeason() {
    var month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter'; /* 11, 0, 1 */
  }

  /**
   * Map sign name (e.g., "Aries") to element (fire/water/air/earth)
   * Uses zodiac triplicities
   */
  function signToElement(sign) {
    if (!sign) return 'fire'; /* default fallback */

    var fireSigns = ['Aries', 'Leo', 'Sagittarius'];
    var waterSigns = ['Cancer', 'Scorpio', 'Pisces'];
    var earthSigns = ['Taurus', 'Virgo', 'Capricorn'];
    var airSigns = ['Gemini', 'Libra', 'Aquarius'];

    if (fireSigns.indexOf(sign) !== -1) return 'fire';
    if (waterSigns.indexOf(sign) !== -1) return 'water';
    if (earthSigns.indexOf(sign) !== -1) return 'earth';
    if (airSigns.indexOf(sign) !== -1) return 'air';

    return 'fire'; /* default */
  }

  /**
   * Modulate hex color by saturation and brightness factors
   * Converts hex → HSL, applies modifiers, converts back to hex
   */
  function modulateColor(hex, saturation, brightness) {
    /* Remove # if present */
    hex = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var l = (max + min) / 2;
    var s = max === min ? 0 : (l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min));
    var h = 0;
    if (max !== min) {
      if (max === r) h = (((g - b) / (max - min)) + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = (((b - r) / (max - min)) + 2) / 6;
      else h = (((r - g) / (max - min)) + 4) / 6;
    }

    /* Apply modifiers */
    s = Math.min(1, s * saturation);
    l = Math.min(1, l * brightness);

    /* Convert HSL back to RGB */
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h * 6) % 2 - 1));
    var m = l - c / 2;
    var rc = 0, gc = 0, bc = 0;

    if (h < 1/6) { rc = c; gc = x; }
    else if (h < 2/6) { rc = x; gc = c; }
    else if (h < 3/6) { gc = c; bc = x; }
    else if (h < 4/6) { gc = x; bc = c; }
    else if (h < 5/6) { rc = x; bc = c; }
    else { rc = c; bc = x; }

    var R = Math.round((rc + m) * 255).toString(16).padStart(2, '0');
    var G = Math.round((gc + m) * 255).toString(16).padStart(2, '0');
    var B = Math.round((bc + m) * 255).toString(16).padStart(2, '0');

    return '#' + R + G + B;
  }

  /**
   * Compute and apply personalized theme based on member's sign and current season
   */
  function applyTheme() {
    if (prefersReduced) {
      /* Apply base fire palette (default), no transitions */
      var basePalette = ELEMENT_PALETTES['fire'];
      document.documentElement.style.setProperty('--theme-primary', basePalette.primary);
      document.documentElement.style.setProperty('--theme-secondary', basePalette.secondary);
      document.documentElement.style.setProperty('--theme-accent', basePalette.accent);
      document.documentElement.style.setProperty('--theme-glow', basePalette.glow);
      return;
    }

    try {
      /* Read member's sign from window context */
      var profile = window.__omegaProfile || (window.OmegaAuth && window.OmegaAuth.getProfile && window.OmegaAuth.getProfile());
      if (!profile || !profile.sign) return;

      var element = signToElement(profile.sign);
      var palette = ELEMENT_PALETTES[element] || ELEMENT_PALETTES['fire'];
      var season = getSeason();
      var modifier = SEASON_MODIFIERS[season] || SEASON_MODIFIERS['spring'];

      /* Apply seasonal modulation */
      var themePrimary = modulateColor(palette.primary, modifier.saturation, modifier.brightness);
      var themeSecondary = modulateColor(palette.secondary, modifier.saturation, modifier.brightness);
      var themeAccent = modulateColor(palette.accent, modifier.saturation, modifier.brightness);
      var themeGlow = modulateColor(palette.glow, modifier.saturation, modifier.brightness);

      /* Apply to :root with smooth transition (unless reduced-motion) */
      var root = document.documentElement;
      root.style.setProperty('--theme-primary', themePrimary);
      root.style.setProperty('--theme-secondary', themeSecondary);
      root.style.setProperty('--theme-accent', themeAccent);
      root.style.setProperty('--theme-glow', themeGlow);

      /* Optional: debug log (remove in production) */
      /* console.log('[OmegaTheme] Applied:', { element, season, primary: themePrimary }); */
    } catch(e) {
      /* Silent fail; fallback to existing palette */
    }
  }

  /**
   * Initialize on page load
   */
  function init() {
    applyTheme();

    /* Listen for profile updates */
    try {
      document.addEventListener('omega:profile-updated', function() {
        applyTheme();
      });
    } catch(e) {}
  }

  /**
   * Public API
   */
  window.OmegaThemePersonalization = {
    /**
     * Force recompute theme (useful for testing or manual refresh)
     */
    refresh: function() { applyTheme(); },

    /**
     * Get current theme state (for debugging)
     */
    getState: function() {
      return {
        season: getSeason(),
        primary: getComputedStyle(document.documentElement).getPropertyValue('--theme-primary'),
        secondary: getComputedStyle(document.documentElement).getPropertyValue('--theme-secondary'),
        accent: getComputedStyle(document.documentElement).getPropertyValue('--theme-accent'),
        glow: getComputedStyle(document.documentElement).getPropertyValue('--theme-glow')
      };
    }
  };

  /* Initialize on load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
