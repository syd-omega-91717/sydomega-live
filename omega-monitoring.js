/* Ω Performance Monitor - Real-time performance tracking and optimization insights
   Purpose: Identify bottlenecks, track metrics, guide optimization efforts */

(function(){
  if(window.__omegaMonitoring) return;
  window.__omegaMonitoring = true;

  window.OmegaMetrics = {
    data: {
      pageLoadTime: 0,
      ttfb: 0,
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      apiCalls: [],
      errors: []
    },

    init: function() {
      // Measure Core Web Vitals
      if(window.PerformanceObserver) {
        // Largest Contentful Paint
        try {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.data.lcp = lastEntry.renderTime || lastEntry.loadTime;
          }).observe({entryTypes: ['largest-contentful-paint']});
        } catch(e) {}

        // Cumulative Layout Shift
        try {
          new PerformanceObserver((list) => {
            for(const entry of list.getEntries()) {
              if(!entry.hadRecentInput) {
                this.data.cls += entry.value;
              }
            }
          }).observe({entryTypes: ['layout-shift']});
        } catch(e) {}

        // First Input Delay
        try {
          new PerformanceObserver((list) => {
            for(const entry of list.getEntries()) {
              this.data.fid = entry.processingDuration;
            }
          }).observe({entryTypes: ['first-input']});
        } catch(e) {}
      }

      // Measure Navigation Timing
      window.addEventListener('load', () => {
        const nav = performance.getEntriesByType('navigation')[0];
        if(nav) {
          this.data.ttfb = nav.responseStart - nav.requestStart;
          this.data.pageLoadTime = nav.loadEventEnd - nav.fetchStart;
        }
      });
    },

    trackApi: function(endpoint, duration, status) {
      this.data.apiCalls.push({endpoint, duration, status, time: Date.now()});
      if(this.data.apiCalls.length > 100) this.data.apiCalls.shift();
    },

    trackError: function(error, context) {
      /* window's error/unhandledrejection events can carry a null error
         (e.g. cross-origin script errors) -- error.toString() then threw
         inside the platform's own error tracker, on agent-network.html and
         any other page where that fires. */
      const message = error === null || error === undefined ? String(error) : error.toString();
      this.data.errors.push({error: message, context, time: Date.now()});
      if(this.data.errors.length > 50) this.data.errors.shift();
    },

    report: function() {
      const avgApiTime = this.data.apiCalls.length > 0
        ? Math.round(this.data.apiCalls.reduce((a, c) => a + c.duration, 0) / this.data.apiCalls.length)
        : 0;
      
      return {
        ...this.data,
        avgApiTime,
        errorRate: this.data.apiCalls.length > 0
          ? Math.round((this.data.apiCalls.filter(c => c.status >= 400).length / this.data.apiCalls.length) * 100)
          : 0
      };
    }
  };

  OmegaMetrics.init();

  // Intercept API calls for tracking
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const start = performance.now();
    try {
      const response = await originalFetch.apply(this, args);
      OmegaMetrics.trackApi(args[0], performance.now() - start, response.status);
      return response;
    } catch(e) {
      OmegaMetrics.trackApi(args[0], performance.now() - start, 0);
      throw e;
    }
  };

  // Track errors
  window.addEventListener('error', (e) => {
    OmegaMetrics.trackError(e.error, {file: e.filename, line: e.lineno});
  });

  window.addEventListener('unhandledrejection', (e) => {
    OmegaMetrics.trackError(e.reason, {type: 'unhandledPromise'});
  });
})();
