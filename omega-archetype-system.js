/**
 * Phase C.4: Page Archetype System
 * Tags every page with its archetype identity for consistent visual treatment
 * across the platform's 12 archetype categories.
 *
 * Archetypes (from OMEGA_PAGE_CHARACTER_FRAMEWORK.md):
 * 1. Observatory (data observation, analytics, metrics)
 * 2. Arena (competition, comparison, performance)
 * 3. Studio (creation, editing, composition)
 * 4. Library (collection, archive, reference)
 * 5. Exchange (transaction, commerce, trade)
 * 6. Bazaar (marketplace, discovery, browsing)
 * 7. Council (governance, decision, oversight)
 * 8. Vault (storage, security, private data)
 * 9. Beacon (guidance, onboarding, orientation)
 * 10. Sentinel (protection, monitoring, alerts)
 * 11. Forge (production, manufacturing, building)
 * 12. Archive (history, memory, documentation)
 *
 * Each archetype has:
 * - Motion level (0-5): determines animation intensity and responsiveness
 * - Information disclosure pattern: immediate / exploration / deep
 * - Visual hierarchy: card density, spacing, emphasis
 */

(function(){
  if(window.OmegaArchetype) return;

  // Archetype registry: maps pages to their archetype identity
  var ARCHETYPE_REGISTRY = {
    // OBSERVATORY: Data observation and metric display
    'analytics.html': 'observatory',
    'dashboard.html': 'observatory',
    'metrics.html': 'observatory',
    'charts.html': 'observatory',
    'insights.html': 'observatory',

    // ARENA: Competitive comparison and performance
    'leaderboard.html': 'arena',
    'rankings.html': 'arena',
    'versus.html': 'arena',
    'competition.html': 'arena',
    'performance.html': 'arena',

    // STUDIO: Creative editing and composition
    'studio.html': 'studio',
    'editor.html': 'studio',
    'compose.html': 'studio',
    'create.html': 'studio',
    'design.html': 'studio',

    // LIBRARY: Collections and archives
    'library.html': 'library',
    'collections.html': 'library',
    'archive.html': 'library',
    'references.html': 'library',
    'vault.html': 'library',

    // EXCHANGE: Transactions and trading
    'transactions.html': 'exchange',
    'trading.html': 'exchange',
    'exchange.html': 'exchange',
    'checkout.html': 'exchange',
    'payment.html': 'exchange',

    // BAZAAR: Marketplace and discovery
    'marketplace.html': 'bazaar',
    'shop.html': 'bazaar',
    'discover.html': 'bazaar',
    'browse.html': 'bazaar',
    'explore.html': 'bazaar',

    // COUNCIL: Governance and oversight
    'governance.html': 'council',
    'council.html': 'council',
    'decisions.html': 'council',
    'voting.html': 'council',
    'approvals.html': 'council',

    // VAULT: Secure storage and private data
    'vault.html': 'vault',
    'storage.html': 'vault',
    'secrets.html': 'vault',
    'private.html': 'vault',
    'secure.html': 'vault',

    // BEACON: Guidance and onboarding
    'welcome.html': 'beacon',
    'onboard.html': 'beacon',
    'guide.html': 'beacon',
    'tutorial.html': 'beacon',
    'help.html': 'beacon',

    // SENTINEL: Monitoring and protection
    'security.html': 'sentinel',
    'monitoring.html': 'sentinel',
    'alerts.html': 'sentinel',
    'protection.html': 'sentinel',
    'threats.html': 'sentinel',

    // FORGE: Production and building
    'projects.html': 'forge',
    'build.html': 'forge',
    'production.html': 'forge',
    'manufacturing.html': 'forge',
    'factory.html': 'forge',

    // ARCHIVE: History and documentation
    'history.html': 'archive',
    'timeline.html': 'archive',
    'chronicles.html': 'archive',
    'documentation.html': 'archive',
    'records.html': 'archive'
  };

  // Motion levels per archetype
  var MOTION_LEVELS = {
    'observatory': 1,      // Subtle (data-focused)
    'arena': 3,            // Interactive (competitive)
    'studio': 4,           // Dynamic (creation)
    'library': 1,          // Subtle (reference-focused)
    'exchange': 2,         // Responsive (transactional)
    'bazaar': 3,           // Interactive (exploratory)
    'council': 2,          // Responsive (governance)
    'vault': 1,            // Subtle (security-focused)
    'beacon': 3,           // Interactive (guidance)
    'sentinel': 2,         // Responsive (monitoring)
    'forge': 4,            // Dynamic (production)
    'archive': 1           // Subtle (reference)
  };

  var API = window.OmegaArchetype = {
    /**
     * Get archetype for current page
     */
    getCurrent: function(){
      var pageEl = document.documentElement;
      if(pageEl.getAttribute('data-archetype')) {
        return pageEl.getAttribute('data-archetype');
      }
      var archetype = detectArchetype();
      if(archetype) {
        pageEl.setAttribute('data-archetype', archetype);
      }
      return archetype;
    },

    /**
     * Get archetype by filename
     */
    get: function(filename){
      return ARCHETYPE_REGISTRY[filename] || null;
    },

    /**
     * Get motion level for archetype
     */
    getMotionLevel: function(archetype){
      return MOTION_LEVELS[archetype] || 2;
    },

    /**
     * Tag element with archetype
     */
    tag: function(element, filename){
      var archetype = API.get(filename);
      if(archetype){
        element.setAttribute('data-archetype', archetype);
        var motionLevel = API.getMotionLevel(archetype);
        element.setAttribute('data-motion-level', motionLevel);
        element.classList.add('archetype-' + archetype);
        element.classList.add('motion-' + motionLevel);
      }
      return archetype;
    },

    /**
     * Apply archetype styling to page
     */
    applyToPage: function(){
      var archetype = API.getCurrent();
      if(!archetype) return false;

      var motionLevel = API.getMotionLevel(archetype);
      var html = document.documentElement;

      html.classList.add('archetype-' + archetype);
      html.classList.add('motion-' + motionLevel);
      html.style.setProperty('--archetype-motion-level', motionLevel);

      return true;
    },

    /**
     * Register custom archetype
     */
    register: function(filename, archetype){
      ARCHETYPE_REGISTRY[filename] = archetype;
    },

    /**
     * Register motion level
     */
    registerMotion: function(archetype, level){
      MOTION_LEVELS[archetype] = level;
    }
  };

  /**
   * Detect archetype from page filename
   */
  function detectArchetype(){
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';
    return API.get(filename);
  }

  /**
   * Auto-initialize on load
   */
  function autoInit(){
    API.applyToPage();
  }

  document.addEventListener('DOMContentLoaded', autoInit);
  if(document.readyState !== 'loading') autoInit();
})();
