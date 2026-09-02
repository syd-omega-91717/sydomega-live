/**
 * Phase D.1: Page Feature Registry & Capability Discovery
 * Provides runtime capability detection and feature declaration for pages.
 * Enables selective feature loading, conditional UI rendering, and
 * graceful degradation based on platform capabilities.
 *
 * Feature categories:
 * - Data: Supabase queries, RLS-protected tables, real-time subscriptions
 * - Interaction: Forms, drag-drop, gesture controls, WebGL/Canvas rendering
 * - Media: Image optimization, video playback, audio synthesis
 * - Storage: IndexedDB, localStorage, blob handling
 * - Communication: WebSocket, EventSource, WebRTC
 * - Advanced: Web Workers, Service Workers, PWA offline
 */

(function(){
  if(window.OmegaPageFeatures) return;

  // Platform capability detection
  var CAPABILITIES = {
    // Storage APIs
    localStorage: typeof localStorage !== 'undefined',
    indexedDB: typeof indexedDB !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',

    // Worker APIs
    webWorker: typeof Worker !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,

    // Media APIs
    canvas: (function(){
      var el = document.createElement('canvas');
      return !!(el.getContext && el.getContext('2d'));
    })(),
    webgl: (function(){
      var el = document.createElement('canvas');
      return !!(el.getContext && (el.getContext('webgl') || el.getContext('experimental-webgl')));
    })(),
    audioContext: typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined',
    videoElement: document.createElement('video').canPlayType !== undefined,

    // Network APIs
    fetch: typeof fetch !== 'undefined',
    websocket: typeof WebSocket !== 'undefined',
    eventSource: typeof EventSource !== 'undefined',
    webrtc: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),

    // User input
    pointerEvents: 'PointerEvent' in window,
    touchEvents: 'ontouchstart' in window,
    wheelEvent: 'onwheel' in document.createElement('div'),

    // Media queries
    mediaQueries: window.matchMedia !== undefined,

    // Performance APIs
    performanceObserver: typeof PerformanceObserver !== 'undefined',
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    resizeObserver: typeof ResizeObserver !== 'undefined',
    mutationObserver: typeof MutationObserver !== 'undefined',

    // Clipboard
    clipboardAPI: typeof navigator.clipboard !== 'undefined',

    // Geolocation
    geolocation: typeof navigator.geolocation !== 'undefined',

    // Permissions
    permissionsAPI: typeof navigator.permissions !== 'undefined',

    // Vibration
    vibration: typeof navigator.vibrate !== 'undefined',

    // Share API
    shareAPI: typeof navigator.share !== 'undefined',

    // CSS features
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex'),
    cssCustomProperties: CSS.supports('--test', '0'),
    cssBackdropFilter: CSS.supports('backdrop-filter', 'blur(1px)'),

    // Layout shift monitoring
    layoutShiftMonitoring: typeof PerformanceObserver !== 'undefined' && 'cls' in performance,

    // Dark mode preference
    darkModePreference: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  };

  // Feature declarations per page
  var PAGE_FEATURES = {};

  var API = window.OmegaPageFeatures = {
    /**
     * Check if a capability is available
     */
    has: function(capability){
      return CAPABILITIES[capability] === true;
    },

    /**
     * Get all available capabilities
     */
    all: function(){
      return Object.keys(CAPABILITIES).filter(function(key){
        return CAPABILITIES[key] === true;
      });
    },

    /**
     * Check if multiple capabilities are available
     */
    hasAll: function(capabilities){
      return capabilities.every(function(cap){
        return API.has(cap);
      });
    },

    /**
     * Check if at least one capability is available
     */
    hasAny: function(capabilities){
      return capabilities.some(function(cap){
        return API.has(cap);
      });
    },

    /**
     * Declare features for current page
     */
    declare: function(features){
      var pageId = getPageId();
      PAGE_FEATURES[pageId] = features;
      applyFeatureStyling(features);
      return API;
    },

    /**
     * Check if page has declared feature
     */
    supports: function(featureName){
      var pageId = getPageId();
      var features = PAGE_FEATURES[pageId];
      if(!features) return false;
      return features.indexOf(featureName) !== -1;
    },

    /**
     * Get all declared features for page
     */
    getDeclared: function(){
      var pageId = getPageId();
      return PAGE_FEATURES[pageId] || [];
    },

    /**
     * Conditionally load a module based on capabilities
     */
    loadIfCapable: function(moduleId, requiredCapabilities){
      if(API.hasAll(requiredCapabilities)){
        var script = document.createElement('script');
        script.src = '/omega-' + moduleId + '.js';
        script.defer = true;
        script.setAttribute('data-omega-' + moduleId, '1');
        document.head.appendChild(script);
        return true;
      }
      return false;
    },

    /**
     * Get capability status as data attribute
     */
    getStatusString: function(){
      var statuses = [];
      if(API.has('serviceWorker')) statuses.push('offline');
      if(API.has('webWorker')) statuses.push('threaded');
      if(API.has('indexedDB')) statuses.push('persistent');
      if(API.has('audioContext')) statuses.push('audio');
      if(API.has('webgl')) statuses.push('3d');
      if(API.has('webrtc')) statuses.push('realtime');
      return statuses.join(' ');
    }
  };

  /**
   * Get current page identifier
   */
  function getPageId(){
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';
    return filename.replace('.html', '');
  }

  /**
   * Apply feature-specific styling
   */
  function applyFeatureStyling(features){
    var html = document.documentElement;

    if(features && features.length > 0){
      for(var i = 0; i < features.length; i++){
        html.setAttribute('data-feature-' + features[i], '1');
      }
    }

    // Add capability indicators to document
    html.setAttribute('data-capabilities', API.getStatusString());
  }

  /**
   * Auto-initialize capability detection
   */
  function autoInit(){
    var html = document.documentElement;
    html.setAttribute('data-capabilities', API.getStatusString());
  }

  // Initialize immediately
  autoInit();
  document.addEventListener('DOMContentLoaded', autoInit);
})();
