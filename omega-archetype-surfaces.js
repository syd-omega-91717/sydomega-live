/**
 * Phase C.6: Archetype Visual Surface Configuration
 * Defines visual hierarchy, card density, spacing, and information
 * disclosure patterns for each of the 12 archetypes.
 *
 * Information disclosure patterns:
 * - Immediate: All content visible at rest (Observatory, Library, Archive)
 * - Exploration: Content reveals on hover/interaction (Arena, Bazaar, Studio)
 * - Deep: Progressive multi-stage reveals (Council, Vault, Beacon)
 *
 * Visual hierarchy dimensions:
 * - Card density: compact | normal | spacious
 * - Border treatment: minimal | accent | glow
 * - Spacing scale: 0.75x | 1x | 1.25x | 1.5x
 * - Shadow depth: flat | lifted | floating
 */

(function(){
  if(window.OmegaArchetypeSurfaces) return;

  // Visual surface configuration per archetype
  var SURFACE_CONFIG = {
    // OBSERVATORY: Data observation — high density, immediate disclosure
    'observatory': {
      disclosurePattern: 'immediate',
      cardDensity: 'compact',
      spacing: 0.9,
      borderTreatment: 'minimal',
      shadowDepth: 'flat',
      gridColumns: { desktop: 4, tablet: 3, mobile: 2 }
    },

    // ARENA: Competition — normal density, exploration disclosure
    'arena': {
      disclosurePattern: 'exploration',
      cardDensity: 'normal',
      spacing: 1.0,
      borderTreatment: 'accent',
      shadowDepth: 'lifted',
      gridColumns: { desktop: 3, tablet: 2, mobile: 1 }
    },

    // STUDIO: Creation — spacious, exploration (progressive reveal of tools)
    'studio': {
      disclosurePattern: 'exploration',
      cardDensity: 'spacious',
      spacing: 1.2,
      borderTreatment: 'glow',
      shadowDepth: 'floating',
      gridColumns: { desktop: 2, tablet: 1, mobile: 1 }
    },

    // LIBRARY: Collection — compact, immediate (reference-focused)
    'library': {
      disclosurePattern: 'immediate',
      cardDensity: 'compact',
      spacing: 0.85,
      borderTreatment: 'minimal',
      shadowDepth: 'flat',
      gridColumns: { desktop: 4, tablet: 3, mobile: 2 }
    },

    // EXCHANGE: Transaction — normal, exploration (progressive checkout flow)
    'exchange': {
      disclosurePattern: 'exploration',
      cardDensity: 'normal',
      spacing: 1.0,
      borderTreatment: 'accent',
      shadowDepth: 'lifted',
      gridColumns: { desktop: 3, tablet: 2, mobile: 1 }
    },

    // BAZAAR: Marketplace — normal, exploration (browsing discovery)
    'bazaar': {
      disclosurePattern: 'exploration',
      cardDensity: 'normal',
      spacing: 1.1,
      borderTreatment: 'accent',
      shadowDepth: 'lifted',
      gridColumns: { desktop: 3, tablet: 2, mobile: 1 }
    },

    // COUNCIL: Governance — spacious, deep (multi-stage proposals)
    'council': {
      disclosurePattern: 'deep',
      cardDensity: 'spacious',
      spacing: 1.25,
      borderTreatment: 'glow',
      shadowDepth: 'floating',
      gridColumns: { desktop: 2, tablet: 1, mobile: 1 }
    },

    // VAULT: Security — compact, deep (security review pattern)
    'vault': {
      disclosurePattern: 'deep',
      cardDensity: 'compact',
      spacing: 1.0,
      borderTreatment: 'glow',
      shadowDepth: 'lifted',
      gridColumns: { desktop: 3, tablet: 2, mobile: 1 }
    },

    // BEACON: Guidance — spacious, exploration (onboarding discovery)
    'beacon': {
      disclosurePattern: 'exploration',
      cardDensity: 'spacious',
      spacing: 1.3,
      borderTreatment: 'accent',
      shadowDepth: 'floating',
      gridColumns: { desktop: 2, tablet: 1, mobile: 1 }
    },

    // SENTINEL: Monitoring — normal, immediate (always visible alerts)
    'sentinel': {
      disclosurePattern: 'immediate',
      cardDensity: 'normal',
      spacing: 1.0,
      borderTreatment: 'accent',
      shadowDepth: 'lifted',
      gridColumns: { desktop: 3, tablet: 2, mobile: 1 }
    },

    // FORGE: Production — spacious, exploration (complex workflows)
    'forge': {
      disclosurePattern: 'exploration',
      cardDensity: 'spacious',
      spacing: 1.2,
      borderTreatment: 'glow',
      shadowDepth: 'floating',
      gridColumns: { desktop: 2, tablet: 1, mobile: 1 }
    },

    // ARCHIVE: Documentation — compact, immediate (reference navigation)
    'archive': {
      disclosurePattern: 'immediate',
      cardDensity: 'compact',
      spacing: 0.9,
      borderTreatment: 'minimal',
      shadowDepth: 'flat',
      gridColumns: { desktop: 4, tablet: 3, mobile: 2 }
    }
  };

  // Spacing scale multipliers (applied to --spacing base unit)
  var SPACING_SCALES = {
    compact: { card: 0.75, gap: 0.8, padding: 0.8 },
    normal: { card: 1.0, gap: 1.0, padding: 1.0 },
    spacious: { card: 1.25, gap: 1.3, padding: 1.2 }
  };

  var API = window.OmegaArchetypeSurfaces = {
    /**
     * Get surface configuration for archetype
     */
    get: function(archetype){
      return SURFACE_CONFIG[archetype] || SURFACE_CONFIG['archive'];
    },

    /**
     * Get spacing multiplier for density
     */
    getSpacingMultiplier: function(density){
      return SPACING_SCALES[density] || SPACING_SCALES['normal'];
    },

    /**
     * Apply surface styling to page
     */
    applySurfaceStyle: function(){
      if(!window.OmegaArchetype) return false;
      var archetype = window.OmegaArchetype.getCurrent();
      if(!archetype) return false;

      var config = API.get(archetype);
      var spacing = SPACING_SCALES[config.cardDensity];

      injectSurfaceStylesheet(archetype, config, spacing);
      return true;
    },

    /**
     * Get information disclosure pattern
     */
    getDisclosurePattern: function(archetype){
      var config = API.get(archetype);
      return config.disclosurePattern;
    },

    /**
     * Check if content should be immediately visible
     */
    isImmediate: function(archetype){
      return API.getDisclosurePattern(archetype) === 'immediate';
    },

    /**
     * Check if content reveals on exploration
     */
    isExploration: function(archetype){
      return API.getDisclosurePattern(archetype) === 'exploration';
    },

    /**
     * Check if content uses deep/progressive reveal
     */
    isDeep: function(archetype){
      return API.getDisclosurePattern(archetype) === 'deep';
    }
  };

  /**
   * Inject surface stylesheet for the page's archetype
   */
  function injectSurfaceStylesheet(archetype, config, spacing){
    var styleId = 'omega-archetype-surface-' + archetype;
    if(document.getElementById(styleId)) return;

    var css = buildSurfaceCSS(archetype, config, spacing);
    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Build surface-specific CSS rules
   */
  function buildSurfaceCSS(archetype, config, spacing){
    var rules = '';

    // Root element data attributes
    rules += 'html[data-archetype="' + archetype + '"] { ';
    rules += '--archetype-spacing: ' + config.spacing + '; ';
    rules += '--card-gap: calc(var(--spacing) * ' + spacing.gap + '); ';
    rules += '--card-padding: calc(var(--spacing) * ' + spacing.padding + '); ';
    rules += '} ';

    // Card grid density
    rules += '[data-archetype="' + archetype + '"] .card-grid { ';
    rules += 'gap: calc(var(--spacing) * ' + spacing.gap + '); ';
    rules += '} ';

    // Card styling per density
    rules += '[data-archetype="' + archetype + '"] .card { ';
    rules += 'padding: calc(var(--spacing) * ' + spacing.padding + '); ';
    rules += 'border-radius: ' + getBorderRadius(config.borderTreatment) + '; ';
    rules += 'border: ' + getBorderStyle(config.borderTreatment) + '; ';
    rules += 'box-shadow: ' + getBoxShadow(config.shadowDepth) + '; ';
    rules += '} ';

    // KPI styling
    rules += '[data-archetype="' + archetype + '"] .kpi { ';
    rules += 'min-height: ' + getKpiHeight(config.cardDensity) + '; ';
    rules += 'padding: calc(var(--spacing) * ' + (spacing.padding * 0.8) + '); ';
    rules += '} ';

    /* Content disclosure is a semantic interaction contract, not a visual
       surface rule. Hiding .card-content on hover made essential information
       unavailable to touch, keyboard and assistive-technology users. Pages
       that need progressive disclosure must own it with <details>/<summary>
       or an explicit aria-expanded control. Surface styling never hides data. */

    return rules;
  }

  /**
   * Get border radius based on treatment
   */
  function getBorderRadius(treatment){
    var radii = {
      'minimal': '4px',
      'accent': '6px',
      'glow': '8px'
    };
    return radii[treatment] || '4px';
  }

  /**
   * Get border style based on treatment
   */
  function getBorderStyle(treatment){
    var styles = {
      'minimal': '1px solid rgba(255, 255, 255, 0.05)',
      'accent': '1px solid rgba(255, 255, 255, 0.1)',
      'glow': '1px solid rgba(255, 255, 255, 0.15)'
    };
    return styles[treatment] || '1px solid rgba(255, 255, 255, 0.05)';
  }

  /**
   * Get box shadow based on depth
   */
  function getBoxShadow(depth){
    var shadows = {
      'flat': 'none',
      'lifted': '0 2px 8px rgba(0, 0, 0, 0.15)',
      'floating': '0 8px 24px rgba(0, 0, 0, 0.2)'
    };
    return shadows[depth] || 'none';
  }

  /**
   * Get KPI height based on density
   */
  function getKpiHeight(density){
    var heights = {
      'compact': '80px',
      'normal': '100px',
      'spacious': '120px'
    };
    return heights[density] || '100px';
  }

  /**
   * Auto-initialize on load
   */
  function autoInit(){
    API.applySurfaceStyle();
  }

  document.addEventListener('DOMContentLoaded', autoInit);
  if(document.readyState !== 'loading') autoInit();
})();
