/* Shared embedded presentation switch for the Agent Council workspace. */
(function(){
  'use strict';
  try {
    if (new URLSearchParams(window.location.search).get('embed') === '1') {
      document.documentElement.classList.add('omega-agent-embed');
    }
  } catch (_) {
    /* Standalone presentation remains the safe default. */
  }
}());
