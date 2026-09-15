/* Ω Enhanced Search - Faster, smarter, more relevant search results
   Purpose: Improve search performance and result relevance */

(function(){
  if(window.__omegaSearchEnhanced) return;
  window.__omegaSearchEnhanced = true;

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  window.OmegaSearchEnhanced = {
    index: new Map(),
    
    buildIndex: function() {
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

    search: function(query, maxResults = 10) {
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
      const raw = String(query || '').trim();
      if(!raw) return;

      /* Highlight text nodes only. Never rebuild an element with innerHTML:
         search input is user-controlled and must not become executable markup. */
      const regex = new RegExp('(' + escapeRegExp(raw) + ')', 'gi');
      document.querySelectorAll('.card, p, h1, h2, h3').forEach(el => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const nodes = [];
        let node;
        while((node = walker.nextNode())) {
          if(node.parentElement && node.parentElement.closest('mark')) continue;
          regex.lastIndex = 0;
          if(regex.test(node.nodeValue)) nodes.push(node);
        }

        nodes.forEach(textNode => {
          const value = textNode.nodeValue;
          regex.lastIndex = 0;
          const fragment = document.createDocumentFragment();
          let last = 0;
          let match;
          while((match = regex.exec(value))) {
            if(match.index > last) fragment.appendChild(document.createTextNode(value.slice(last, match.index)));
            const mark = document.createElement('mark');
            mark.style.background = 'rgba(201,168,76,0.3)';
            mark.textContent = match[0];
            fragment.appendChild(mark);
            last = match.index + match[0].length;
          }
          if(last < value.length) fragment.appendChild(document.createTextNode(value.slice(last)));
          if(last > 0 && textNode.parentNode) textNode.parentNode.replaceChild(fragment, textNode);
        });
      });
    }
  };

  // Initialize on page load
  if(document.readyState !== 'loading') OmegaSearchEnhanced.buildIndex();
  else document.addEventListener('DOMContentLoaded', () => OmegaSearchEnhanced.buildIndex());
})();
