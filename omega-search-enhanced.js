/* Ω Enhanced Search - Faster, smarter, more relevant search results
   Purpose: Improve search performance and result relevance */

(function(){
  if(window.__omegaSearchEnhanced) return;
  window.__omegaSearchEnhanced = true;

  window.OmegaSearchEnhanced = {
    index: new Map(),
    
    buildIndex: () => {
      const elements = document.querySelectorAll('[data-searchable], .card, h1, h2, h3, p');
      elements.forEach(el => {
        const text = el.textContent.toLowerCase();
        const words = text.split(/\s+/);
        words.forEach(word => {
          if(word.length > 2) {
            if(!this.index.has(word)) this.index.set(word, []);
            this.index.get(word).push(el);
          }
        });
      });
    },

    search: (query, maxResults = 10) => {
      const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      if(terms.length === 0) return [];

      const results = new Map();
      terms.forEach(term => {
        const matches = this.index.get(term) || [];
        matches.forEach(el => {
          const score = results.get(el) || 0;
          results.set(el, score + 1);
        });
      });

      return Array.from(results.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxResults)
        .map(([el, score]) => ({
          element: el,
          title: el.textContent.substring(0, 100),
          score,
          visible: el.offsetParent !== null
        }));
    },

    highlight: (query) => {
      const regex = new RegExp(`(${query})`, 'gi');
      document.querySelectorAll('.card, p, h1, h2, h3').forEach(el => {
        el.innerHTML = el.innerHTML.replace(regex, '<mark style="background:rgba(201,168,76,0.3)">$1</mark>');
      });
    }
  };

  // Initialize on page load
  if(document.readyState !== 'loading') OmegaSearchEnhanced.buildIndex();
  else document.addEventListener('DOMContentLoaded', () => OmegaSearchEnhanced.buildIndex());
})();
