/* Ω Resilience Engine - Automatic recovery, retry logic, and fault tolerance
   Purpose: Handle transient failures gracefully, maintain UX during outages */

(function(){
  if(window.__omegaResilience) return;
  window.__omegaResilience = true;

  const MAX_RETRIES = 3;
  const RETRY_DELAY = [100, 500, 1500]; // Exponential backoff in ms

  // Wrap fetch with automatic retry logic
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    let lastError;
    for(let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await originalFetch.apply(this, args);
        if(response.ok || attempt === MAX_RETRIES) return response;
        if(response.status >= 500) throw new Error(`Server error: ${response.status}`);
        return response;
      } catch(e) {
        lastError = e;
        if(attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY[attempt]));
        }
      }
    }
    throw lastError;
  };

  // Circuit breaker for API endpoints
  window.OmegaCircuitBreaker = {
    state: {},
    check: function(endpoint) {
      const info = this.state[endpoint];
      if(!info) return true;
      if(info.state === 'open' && Date.now() - info.lastFailure > 30000) {
        info.state = 'half-open';
        return true;
      }
      return info.state !== 'open';
    },
    record: function(endpoint, success) {
      if(!this.state[endpoint]) this.state[endpoint] = {failures: 0, state: 'closed'};
      const info = this.state[endpoint];
      if(success) {
        info.failures = 0;
        info.state = 'closed';
      } else {
        info.failures++;
        info.lastFailure = Date.now();
        if(info.failures >= 3) info.state = 'open';
      }
    }
  };

  // Graceful degradation for failed components
  window.OmegaGracefulDegrade = {
    show: (containerId, message) => {
      const el = document.getElementById(containerId);
      if(el) {
        el.innerHTML = `<div style="padding:16px;background:rgba(139,0,0,0.1);border:1px solid #C4453C;border-radius:4px;color:#C4453C;font-size:13px">${message}</div>`;
      }
    },
    hide: (containerId) => {
      const el = document.getElementById(containerId);
      if(el) el.innerHTML = '';
    }
  };
})();
