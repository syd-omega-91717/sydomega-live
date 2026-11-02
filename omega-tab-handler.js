// Generic tab switching event handler for all tab-enabled pages
// Supports dynamic tab switching across pages via event delegation

(function() {
  if (window.__omegaTabHandlerInstalled) return;       // a page that also loads this file itself must not double-fire
  window.__omegaTabHandlerInstalled = true;
  const tabHandlers = {};

  // Register a page's tab handler function
  window.registerTabHandler = function(handler) {
    tabHandlers.default = handler;
  };

  // Set up event delegation for tab buttons.
  //
  // This listener is attached to `document`, so it never needed to wait for anything. It used to be wrapped in
  // `document.addEventListener('DOMContentLoaded', ...)`, but bg.js injects this file as a dynamic script, which
  // runs AFTER that event has already fired. The wrapper then never ran, the click listener was never installed,
  // and every data-tab-action button (dashboard, achievements, automation, leaderboard) silently did nothing.
  // Measured: readyState 'complete', click does nothing; re-fire DOMContentLoaded and the same click works.
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-tab-action]');
    if (!btn) return;

    const tabName = btn.dataset.tabAction;

    // Try to find and call the tab handler
    if (typeof window.switchTab === 'function') {
      window.switchTab(tabName, btn);
    } else if (typeof window.setTab === 'function') {
      window.setTab(tabName);
    } else if (tabHandlers.default) {
      tabHandlers.default(tabName, btn);
    }
  });
})();
