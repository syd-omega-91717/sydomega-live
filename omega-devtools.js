/* Ω DevTools - Developer experience improvements, debugging utilities
   Purpose: Better error messages, debugging capabilities, development utilities */

(function(){
  if(window.__omegaDevtools) return;
  window.__omegaDevtools = true;

  window.OmegaDevTools = {
    // Enhanced error reporting
    reportError: (error, context = {}) => {
      const report = {
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        context
      };
      
      console.error('[ERROR] Ω Error Report:', report);
      
      // Could send to backend error tracking service
      return report;
    },

    // Performance profiling
    profile: (name, fn) => {
      const start = performance.now();
      const result = fn();
      const duration = performance.now() - start;
      
      console.log(`⏱︎ ${name}: ${duration.toFixed(2)}ms`);
      return result;
    },

    // DOM inspector
    inspect: (selector) => {
      const elements = document.querySelectorAll(selector);
      console.log(`[INSPECT] Found ${elements.length} elements matching "${selector}"`);
      elements.forEach((el, i) => {
        console.log(`  ${i + 1}. ${el.tagName}`, el);
      });
      return elements;
    },

    // State inspector
    inspectState: (obj, depth = 2) => {
      const inspect = (o, d) => {
        if(d === 0) return '...';
        const type = typeof o;
        if(type === 'object') {
          if(Array.isArray(o)) return `[${o.length}]`;
          return `{${Object.keys(o).length} keys}`;
        }
        return type;
      };
      
      console.log('[STATE] State:', inspect(obj, depth));
      return obj;
    },

    // API call logger
    logApiCall: (method, url, response) => {
      const status = response.status;
      const emoji = status >= 200 && status < 300 ? '✅︎' : '❌︎';
      console.log(`${emoji} ${method} ${url} - ${status}`);
    },

    // Performance timeline
    timeline: {
      marks: [],
      mark: (name) => {
        const time = performance.now();
        this.marks.push({name, time});
        console.log(`⏳︎ Mark: ${name} @ ${time.toFixed(2)}ms`);
      },
      measure: (startMark, endMark) => {
        const start = this.marks.find(m => m.name === startMark);
        const end = this.marks.find(m => m.name === endMark);
        if(start && end) {
          const duration = end.time - start.time;
          console.log(`[TIMELINE] ${startMark} → ${endMark}: ${duration.toFixed(2)}ms`);
          return duration;
        }
      }
    }
  };

  // Global access for console usage
  window.Ω = window.OmegaDevTools;
})();
