// Generic quest system event handlers for all quest-enabled pages
// Supports dynamic quest start and detail display across pages

(function() {
  // Map page identifiers to their quest functions
  // Each page that uses this script should define these in its own scope
  const questHandlers = {};

  // Register a page's quest handlers
  window.registerQuestHandlers = function(pageName, handlers) {
    questHandlers[pageName] = handlers;
  };

  // Get the current page identifier from data-page attribute
  function getCurrentPageName() {
    const pageElement = document.querySelector('[data-page]');
    return pageElement ? pageElement.getAttribute('data-page') : null;
  }

  // Handle quest start button clicks
  window.handleQuestStart = function(pageName) {
    const handlers = questHandlers[pageName];
    if (handlers && handlers.onStart) {
      handlers.onStart();
    } else {
      // Fallback: try to find and call startXQuest or window.startXQuest
      const functionName = 'start' + pageName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Quest';
      if (typeof window[functionName] === 'function') {
        window[functionName]();
      }
    }
  };

  // Handle quest detail button clicks
  window.handleQuestDetail = function(pageName) {
    const handlers = questHandlers[pageName];
    if (handlers && handlers.onDetail) {
      handlers.onDetail();
    } else {
      // Fallback: try to find and call showXQuestDetail or window.showXQuestDetail
      const functionName = 'show' + pageName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'QuestDetail';
      if (typeof window[functionName] === 'function') {
        window[functionName]();
      }
    }
  };

  // Set up event delegation for quest buttons
  document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-quest-action]');
      if (!btn) return;

      const action = btn.dataset.questAction;
      const pageName = getCurrentPageName();

      if (action === 'start' && pageName) {
        window.handleQuestStart(pageName);
      } else if (action === 'detail' && pageName) {
        window.handleQuestDetail(pageName);
      }
    });
  });
})();
