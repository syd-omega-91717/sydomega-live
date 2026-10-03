// Generic tab switching event handler
// Supports any page that uses tab-btn elements with onclick="switchTab(...)" or onclick="setTab(...)"

(function() {
  const tabHandlers = {};

  // Register a page's tab handler function
  window.registerTabHandler = function(handler) {
    tabHandlers.default = handler;
  };

  // Set up event delegation for tab buttons
  document.addEventListener('DOMContentLoaded', function() {
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
  });
})();
