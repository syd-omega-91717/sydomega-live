/* ============================================================================
   SYD OMEGA 91717 -- SHARED SUPABASE CLIENT (singleton)

   WHY THIS EXISTS
   The console showed nine GoTrueClient instances on a single page load:

     Multiple GoTrueClient instances detected in the same browser context.
     ... may produce undefined behavior when used concurrently under the
     same storage key.

   Ten shared scripts each called createClient() independently -- 13 instances
   in total. They all read and write the same auth-token storage key, so their
   token refreshes can race each other. Supabase classes this as a warning
   rather than an error, but the failure mode it describes (a refresh from one
   client invalidating another's in-flight request) is real and intermittent,
   which makes it very hard to diagnose later.

   USAGE
     var sb = await window.OmegaSB.get();     // promise, memoized

   The module and the client are both cached, so the Supabase library is
   imported once per page regardless of how many scripts ask for it.

   FAIL-SAFE
   Callers keep their own createClient() path as a fallback. If this file
   fails to load for any reason, every script still works exactly as before --
   it simply goes back to creating its own instance.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaSB) return;

  var URL  = "https://ydqhzvvoyufiiqvzcjns.supabase.co";
  var KEY  = "sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q";
  var _p   = null;   // memoized promise for the client

  function get() {
    if (_p) return _p;
    _p = import('https://esm.sh/@supabase/supabase-js@2')
      .then(function (mod) {
        var createClient = mod.createClient || (mod.default && mod.default.createClient);
        if (!createClient) throw new Error('supabase createClient unavailable');
        return createClient(URL, KEY);
      })
      .catch(function (e) {
        _p = null;               // allow a later retry rather than caching failure
        throw e;
      });
    return _p;
  }

  window.OmegaSB = { get: get, url: URL, key: KEY };
})();
