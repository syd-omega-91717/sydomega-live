/**
 * Phase C.5: Archetype-Specific Motion & Visual Styling
 * Applies animation intensity, timing functions, and visual hierarchy
 * to pages based on their archetype identity and motion level.
 *
 * Motion levels:
 * 0: Static (no animation)
 * 1: Subtle (fade, gentle transitions, 300-500ms)
 * 2: Responsive (scale, slide, 200-400ms)
 * 3: Interactive (bounce, orbit, 150-350ms)
 * 4: Dynamic (flip, transform chains, 100-300ms)
 * 5: Intense (rapid sequences, 50-200ms)
 *
 * Paired with archetype-specific information disclosure patterns:
 * - Immediate: All content visible at rest
 * - Exploration: Content reveals on interaction
 * - Deep: Progressive multi-stage reveals
 */

(function(){
  if(window.OmegaArchetypeMotion) return;

  var API = window.OmegaArchetypeMotion = {
    /**
     * Apply motion styling based on page archetype
     */
    applyMotionStyling: function(){
      if(!window.OmegaArchetype) return false;
      var archetype = window.OmegaArchetype.getCurrent();
      if(!archetype) return false;

      var motionLevel = window.OmegaArchetype.getMotionLevel(archetype);
      injectMotionStylesheet(motionLevel, archetype);
      return true;
    },

    /**
     * Get motion timing based on level (ms)
     */
    getMotionTiming: function(level){
      var timings = {
        0: 0,           // Static
        1: 400,         // Subtle
        2: 300,         // Responsive
        3: 200,         // Interactive
        4: 150,         // Dynamic
        5: 100          // Intense
      };
      return timings[level] || 300;
    },

    /**
     * Get easing function for level
     */
    getEasingFunction: function(level){
      var easings = {
        0: 'linear',                          // Static
        1: 'cubic-bezier(0.4, 0, 0.2, 1)',   // Subtle (material decelerate)
        2: 'cubic-bezier(0.4, 0, 0.6, 1)',   // Responsive (standard)
        3: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Interactive (bounce)
        4: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)', // Dynamic (elastic)
        5: 'cubic-bezier(0.6, -0.6, 0.4, 1.6)' // Intense (overshoot)
      };
      return easings[level] || 'ease';
    },

    /**
     * Calculate stagger delay for child elements
     */
    getStaggerDelay: function(level, itemIndex){
      var baseDelay = API.getMotionTiming(level);
      var staggerMultiplier = 0.1 - (level * 0.01); // Higher levels = tighter stagger
      return baseDelay * staggerMultiplier * itemIndex;
    }
  };

  /**
   * Inject motion stylesheet for the page's archetype
   */
  function injectMotionStylesheet(motionLevel, archetype){
    var styleId = 'omega-archetype-motion-' + motionLevel + '-' + archetype;
    if(document.getElementById(styleId)) return;

    var timing = API.getMotionTiming(motionLevel);
    var easing = API.getEasingFunction(motionLevel);
    var css = buildMotionCSS(motionLevel, timing, easing, archetype);

    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Build motion-specific CSS rules
   */
  function buildMotionCSS(level, timing, easing, archetype){
    var rules = '';

    // Base motion rules per level
    rules += '[data-motion-level="' + level + '"] .card { ';
    rules += 'transition: all ' + timing + 'ms ' + easing + '; ';
    rules += '} ';

    rules += '[data-motion-level="' + level + '"] .kpi { ';
    rules += 'transition: transform ' + timing + 'ms ' + easing + ', opacity ' + timing + 'ms linear; ';
    rules += '} ';

    // Hover effects scale with motion level
    if(level >= 1){
      rules += '[data-motion-level="' + level + '"] .card:hover { ';
      rules += 'transform: translateY(' + (-2 + level * 2) + 'px); ';
      rules += '} ';

      rules += '[data-motion-level="' + level + '"] .btn:hover { ';
      rules += 'transition: all ' + (timing * 0.75) + 'ms ' + easing + '; ';
      rules += 'transform: scale(' + (1 + level * 0.02) + '); ';
      rules += '} ';
    }

    // Interactive hover for levels 2+
    if(level >= 2){
      rules += '[data-motion-level="' + level + '"] .card:hover { ';
      rules += 'box-shadow: 0 ' + (4 + level * 2) + 'px ' + (8 + level * 4) + 'px rgba(0, 0, 0, ' + (0.1 + level * 0.05) + '); ';
      rules += '} ';
    }

    // Dynamic animations for levels 3+
    if(level >= 3){
      rules += '@keyframes motion-' + level + '-entrance { ';
      rules += 'from { opacity: 0; transform: translateY(' + (level * 10) + 'px); } ';
      rules += 'to { opacity: 1; transform: translateY(0); } ';
      rules += '} ';

      rules += '[data-motion-level="' + level + '"] .card { ';
      rules += 'animation: motion-' + level + '-entrance ' + timing + 'ms ' + easing + ' forwards; ';
      rules += '} ';
    }

    // Intense pulse for levels 4+
    if(level >= 4){
      rules += '@keyframes motion-' + level + '-pulse { ';
      rules += '0%, 100% { opacity: 1; transform: scale(1); } ';
      rules += '50% { opacity: 0.95; transform: scale(1.02); } ';
      rules += '} ';

      rules += '[data-motion-level="' + level + '"] .kpi:hover { ';
      rules += 'animation: motion-' + level + '-pulse ' + (timing * 2) + 'ms ' + easing + ' infinite; ';
      rules += '} ';
    }

    // Reduce motion respect
    rules += '@media (prefers-reduced-motion: reduce) { ';
    rules += '[data-motion-level] .card, ';
    rules += '[data-motion-level] .kpi, ';
    rules += '[data-motion-level] .btn { ';
    rules += 'animation: none !important; ';
    rules += 'transition: none !important; ';
    rules += 'transform: none !important; ';
    rules += '} ';
    rules += '} ';

    return rules;
  }

  /**
   * Auto-initialize on load
   */
  function autoInit(){
    API.applyMotionStyling();
  }

  document.addEventListener('DOMContentLoaded', autoInit);
  if(document.readyState !== 'loading') autoInit();
})();
