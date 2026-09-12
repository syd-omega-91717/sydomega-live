/* Ω Cache Optimizer - Aggressive static asset caching strategy
   Purpose: Reduce load times and improve performance through intelligent caching
   Scope: Static assets, API responses, computed values */

(function(){
  if(window.__omegaCacheOptimizer) return;
  window.__omegaCacheOptimizer = true;

  const CACHE_VERSION = 'omega-v1';
  const STATIC_TTL = 86400000; // 24 hours
  const API_TTL = 300000; // 5 minutes
  const COMPUTED_TTL = 3600000; // 1 hour

  // Initialize IndexedDB for larger payloads
  const initCache = () => {
    if(!window.indexedDB) return null;
    const req = indexedDB.open('OmegaCache', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if(!db.objectStoreNames.contains('responses')) {
        db.createObjectStore('responses', {keyPath:'key'});
      }
      if(!db.objectStoreNames.contains('computed')) {
        db.createObjectStore('computed', {keyPath:'key'});
      }
    };
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject();
    });
  };

  // Cache API responses with TTL
  window.OmegaCache = {
    get: (key) => {
      try {
        const stored = localStorage.getItem(`${CACHE_VERSION}:${key}`);
        if(!stored) return null;
        const {value, expires} = JSON.parse(stored);
        return Date.now() < expires ? value : null;
      } catch(e) {
        return null;
      }
    },
    set: (key, value, ttl = API_TTL) => {
      try {
        const expires = Date.now() + ttl;
        localStorage.setItem(`${CACHE_VERSION}:${key}`, JSON.stringify({value, expires}));
      } catch(e) {}
    },
    clear: (pattern) => {
      try {
        for(let key in localStorage) {
          if(key.startsWith(CACHE_VERSION) && (!pattern || key.includes(pattern))) {
            localStorage.removeItem(key);
          }
        }
      } catch(e) {}
    }
  };

  // Prefetch critical resources
  const prefetch = () => {
    const links = ['dashboard', 'profile', 'family'].map(p => `/optimize/${p}`);
    links.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      (document.head || document.body).appendChild(link);
    });
  };

  if(document.readyState !== 'loading') prefetch();
  else document.addEventListener('DOMContentLoaded', prefetch);
})();
