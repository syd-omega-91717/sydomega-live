/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN SERVICE WORKER
   Cache-first for static assets, network-first for API/Supabase calls.
   Enables offline graceful degradation for core pages.
   ========================================================================== */
var CACHE_NAME='omega-91717-v3';
var CORE_ASSETS=[
  '/dashboard.html','/vault.html','/gaming.html','/leaderboard.html',
  '/knowledge.html','/analytics.html','/privacy.html','/404.html',
  '/bg.js','/omega-user.js','/omega-matrix.js','/omega-chrono.js',
  '/omega-sdt.js','/omega-search.js','/omega-notify.js','/omega-canon.js',
  '/omega-tokens.json','/omega-canon.json','/omega-page-emblem.js',
  'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Rajdhani:wght@300;400;600&family=Courier+Prime:wght@400;700&display=swap'
];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){
    return Promise.allSettled(CORE_ASSETS.map(function(url){return cache.add(url).catch(function(){});}));
  }));
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(names){
    return Promise.all(names.filter(function(n){return n!==CACHE_NAME;}).map(function(n){return caches.delete(n);}));
  }));
  self.clients.claim();
});

self.addEventListener('fetch',function(e){
  var url=e.request.url;
  /* Network-first for Supabase, API calls */
  if(url.includes('supabase.co')||url.includes('api.anthropic')||url.includes('esm.sh')){
    e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request);}));
    return;
  }
  /* Cache-first for static assets */
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(res){
        if(res&&res.status===200&&res.type==='basic'){
          var clone=res.clone();
          caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,clone);});
        }
        return res;
      }).catch(function(){
        /* Offline fallback */
        if(e.request.headers.get('accept').includes('text/html')){
          return caches.match('/dashboard.html');
        }
      });
    })
  );
});
