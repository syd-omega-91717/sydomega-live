/* SYD OMEGA 91717 -- Service Worker
   Sovereign offline caching -- v2.0
   v2: cache bumped so the cinematic engine, unified void, and
   light-mode removal reach returning users (old cache-first v1
   would otherwise serve stale bg.js indefinitely). */
const CACHE='omega-v2';
const STATIC=[
  '/','index.html','dashboard.html','profile.html','cosmos.html',
  'vault.html','identity.html','ascension.html','family.html',
  'consultancy.html','intelligence.html','approvals.html',
  'nav.js','bg.js','omega-fx.js','theme.js','audio.js','emblem.js','i18n.js','upload.js',
  'manifest.json','icon-192.png','icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Courier+Prime:wght@400;700&family=Rajdhani:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC.map(u=>{
    try{return new Request(u,{cache:'reload'});}catch(x){return u;}
  }))).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  /* Only cache GET requests to our domain */
  if(e.request.method!=='GET') return;
  if(e.request.url.includes('supabase.co')) return; /* Never cache API */

  e.respondWith(
    caches.match(e.request).then(cached=>{
      const network=fetch(e.request).then(res=>{
        if(res.ok&&!e.request.url.includes('supabase')){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return res;
      }).catch(()=>null);
      return cached||network;
    })
  );
});
