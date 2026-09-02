/**
 * Phase C.3: Emblem Integration Layer
 * Wires SVG emblems from omega-emblems-catalog.js into sidebar navigation
 * and applies glass effects with cursor-reactive lighting.
 *
 * Auto-injected by bg.js on every page after emblem catalog loads.
 * Provides emblem-enhanced sidebar rendering and integration hooks.
 */

(function(){
  if(window.OmegaEmblemIntegration) return;

  // Wait for catalog to load
  var checkCatalog = setInterval(function(){
    if(!window.OmegaEmblems) return;
    clearInterval(checkCatalog);
    init();
  }, 50);

  function init(){
    window.OmegaEmblemIntegration = {
      renderEmblem: renderEmblem,
      enhanceNavItem: enhanceNavItem,
      injectSidebarEmblems: injectSidebarEmblems
    };

    // Auto-enhance navbar on load
    document.addEventListener('DOMContentLoaded', injectSidebarEmblems);
    if(document.readyState !== 'loading') injectSidebarEmblems();

    // Cursor-reactive glass light on emblem elements
    setupCursorTracking();
  }

  /**
   * Render a single emblem as an inline SVG element
   */
  function renderEmblem(pageFilename, options){
    options = options || {};
    var emblem = window.OmegaEmblems.get(pageFilename);
    if(!emblem) return null;

    var size = options.size || 32;
    var color = options.color || 'currentColor';

    var wrapper = document.createElement('div');
    wrapper.className = 'emblem-icon';
    wrapper.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:' + size + 'px;height:' + size + 'px;flex-shrink:0;';
    wrapper.innerHTML = emblem.svg.replace(/viewBox="[^"]*"/, 'viewBox="0 0 64 64"').replace(/fill="none"/, 'fill="none"').replace(/stroke="currentColor"/, 'stroke="' + color + '"').replace(/fill="currentColor"/, 'fill="' + color + '"');

    return wrapper;
  }

  /**
   * Enhance a navigation item with emblem + domain color
   */
  function enhanceNavItem(navElement, pageFilename){
    if(!navElement) return;

    var emblem = window.OmegaEmblems.get(pageFilename);
    if(!emblem) return;

    // Add domain color CSS custom property
    var domainColor = 'var(--' + emblem.domain.toLowerCase() + '-accent, var(--gold))';
    navElement.style.setProperty('--domain-color', domainColor);
    navElement.classList.add('nav-emblem-enhanced');
    navElement.setAttribute('data-emblem-domain', emblem.domain);

    // Inject emblem SVG if not already present
    var existingEmblem = navElement.querySelector('.emblem-icon');
    if(!existingEmblem){
      var emblemEl = renderEmblem(pageFilename, {size: 24});
      if(emblemEl){
        navElement.insertBefore(emblemEl, navElement.firstChild);
      }
    }
  }

  /**
   * Auto-enhance all navigation items in the sidebar
   */
  function injectSidebarEmblems(){
    // Target #omega-side (main sidebar) or .side (shell-based layout)
    var sidebar = document.getElementById('omega-side') || document.querySelector('.side');
    if(!sidebar) return;

    var navItems = sidebar.querySelectorAll('a[href], .nav-item');
    navItems.forEach(function(item){
      var href = item.getAttribute('href') || '';
      var pageFilename = href.split('/').pop() || '';
      if(pageFilename && pageFilename.endsWith('.html')){
        enhanceNavItem(item, pageFilename);
      }
    });
  }

  /**
   * Cursor-reactive glass light: tracks pointer on .card, .kpi, .glass elements
   * and updates --mx/--my for radial-gradient centering
   */
  function setupCursorTracking(){
    var rAFId = null;
    var elements = new WeakMap();

    function onPointerMove(e){
      if(rAFId) return;
      rAFId = requestAnimationFrame(function(){
        rAFId = null;
        var x = e.clientX;
        var y = e.clientY;

        // Find all glass elements under cursor
        var glossy = document.querySelectorAll('.card, .kpi, .kpi-card, .glass, .glass-cyan');
        glossy.forEach(function(el){
          var rect = el.getBoundingClientRect();
          // Only update if hovering
          if(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom){
            var mx = ((x - rect.left) / rect.width) * 100;
            var my = ((y - rect.top) / rect.height) * 100;
            el.style.setProperty('--mx', mx + '%');
            el.style.setProperty('--my', my + '%');
          }
        });
      });
    }

    // Passive listener for performance
    try{
      document.addEventListener('pointermove', onPointerMove, {passive: true});
    }catch(e){
      document.addEventListener('pointermove', onPointerMove);
    }
  }
})();
