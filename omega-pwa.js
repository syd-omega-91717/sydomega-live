/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN PWA ENGINE (omega-pwa.js)

   Progressive Web App installation and app-upgrade experience.
   Wires the browser's beforeinstallprompt event into a sovereign install
   banner. Shows once per session; never appears on mobile until PWA criteria
   are met; fully dismissible and respects prior decisions.

   Features:
   A. INSTALL BANNER — gold sovereign banner at page bottom with install CTA
   B. APP BADGE UPDATE — posts badgeCount to the OS app icon via Badge API
   C. DISPLAY MODE DETECTION — detects standalone/fullscreen vs browser tab
   D. SHARE NATIVE — OmegaPWA.share(title, text, url) via Web Share API
   E. NETWORK STATUS BANNER — shows "You are offline" ribbon when connection drops

   Public API:
     OmegaPWA.install()                 — trigger install prompt
     OmegaPWA.share(title, text, url)   — native share sheet
     OmegaPWA.badge(count)             — set app badge (OS badge API)
     OmegaPWA.isInstalled()            — true if running as PWA
     OmegaPWA.isOnline()               — navigator.onLine wrapper
   ========================================================================== */
(function(){
  'use strict';
  if(window.__omegaPWAActive) return;
  window.__omegaPWAActive = true;

  var INSTALL_KEY  = 'omega_pwa_install_v1';
  var DISMISS_KEY  = 'omega_pwa_dismissed_v1';
  var SHOW_DELAY   = 12000;            /* 12s after load before showing banner */
  var _prompt      = null;             /* captured beforeinstallprompt event */
  var _bannerEl    = null;
  var _awaitingConsent = false;      /* one MutationObserver at a time */

  /* ── A. INSTALL BANNER ─────────────────────────────────────────────── */
  function injectBannerCSS(){
    if(document.getElementById('omega-pwa-css')) return;
    var s = document.createElement('style');
    s.id = 'omega-pwa-css';
    s.textContent = [
      '#omega-install-banner{',
        'position:fixed;bottom:0;left:0;right:0;z-index:9990;',
        'background:rgba(10,10,15,.98);border-top:1px solid rgba(201,168,76,.3);',
        'padding:14px clamp(14px,3vw,36px);',
        'display:flex;align-items:center;justify-content:space-between;gap:12px;',
        'transform:translateY(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);',
        'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)',
      '}',
      '#omega-install-banner.show{transform:translateY(0)}',
      '#omega-install-banner .pwa-text{flex:1;min-width:0}',
      '#omega-install-banner .pwa-title{font-family:"Cinzel Decorative",serif;font-size:12px;color:#C9A84C;letter-spacing:2px;margin-bottom:3px}',
      '#omega-install-banner .pwa-sub{font-family:"Courier Prime",monospace;font-size:12px;color:rgba(138,134,118,.7);letter-spacing:1px}',
      '#omega-install-banner .pwa-actions{display:flex;gap:8px;flex-shrink:0}',
      '#omega-install-banner .pwa-btn{font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:2px;padding:8px 14px;border:1px solid;cursor:pointer;transition:.15s;border-radius:1px;white-space:nowrap}',
      '#omega-install-banner .pwa-install{background:#C9A84C;color:#0A0A0F;border-color:#C9A84C}',
      '#omega-install-banner .pwa-install:hover{background:transparent;color:#C9A84C}',
      '#omega-install-banner .pwa-dismiss{background:transparent;color:rgba(138,134,118,.6);border-color:rgba(138,134,118,.2)}',
      '#omega-install-banner .pwa-dismiss:hover{border-color:rgba(138,134,118,.4);color:rgba(138,134,118,.9)}',
      /* Network offline banner */
      '#omega-offline-banner{',
        'position:fixed;top:0;left:0;right:0;z-index:9991;',
        'background:#8B0000;color:rgba(233,230,220,.9);',
        'font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:2px;',
        'text-align:center;padding:6px;',
        'transform:translateY(-100%);transition:transform .3s ease',
      '}',
      '#omega-offline-banner.show{transform:translateY(0)}',
    ].join('');
    document.head.appendChild(s);
  }

  function createBanner(){
    if(_bannerEl || !_prompt) return;
    injectBannerCSS();

    _bannerEl = document.createElement('div');
    _bannerEl.id = 'omega-install-banner';
    _bannerEl.setAttribute('role', 'banner');
    _bannerEl.setAttribute('aria-label', 'Install SYD OMEGA 91717 as an app');
    _bannerEl.innerHTML = [
      '<div class="pwa-text">',
        '<div class="pwa-title">&#937; INSTALL THE SOVEREIGN APP</div>',
        '<div class="pwa-sub">Add to home screen &mdash; access dashboard, matrix &amp; vault offline &middot; No app store required</div>',
      '</div>',
      '<div class="pwa-actions">',
        '<button class="pwa-btn pwa-install" id="pwa-install-btn">&#8659; INSTALL</button>',
        '<button class="pwa-btn pwa-dismiss" id="pwa-dismiss-btn">&times; DISMISS</button>',
      '</div>',
    ].join('');

    document.body.appendChild(_bannerEl);

    document.getElementById('pwa-install-btn').addEventListener('click', function(){
      install();
    });
    document.getElementById('pwa-dismiss-btn').addEventListener('click', function(){
      hideBanner();
      try{ localStorage.setItem(DISMISS_KEY, '1'); }catch(e){}
    });

    /* Show after 300ms to ensure DOM is painted */
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ _bannerEl.classList.add('show'); });
    });
  }

  function hideBanner(){
    if(_bannerEl){ _bannerEl.classList.remove('show'); }
  }

  /* Consent outranks the install invitation, and this is not a preference.
     Both this banner and omega-legal.js's #omega-consent are
     position:fixed; bottom:0; left:0; right:0; z-index:9990 -- identical
     anchoring in the same stacking context, neither aware of the other. So the
     later paint wins outright. Measured in a 1280x800 render of the front door:
     they overlapped by 61px, and elementFromPoint at the centre of each consent
     control returned this banner's buttons -- ACCEPT ALL intercepted by
     #pwa-dismiss-btn, ESSENTIAL ONLY by #pwa-install-btn. A member could not
     record a cookie choice at all, which also meant the consent banner could
     never be dismissed. Raising a z-index would only have hidden the other bar's
     text instead; the two must not be on screen together.

     So the install offer waits for consent to be resolved. omega-legal.js
     removes #omega-consent from the DOM on either choice, so its disappearance
     is the signal. If the member never chooses, the invitation simply does not
     appear this visit and is offered again on the next one -- the correct
     trade for a legal gate. */
  function consentPending(){
    var el = document.getElementById('omega-consent');
    return !!(el && el.getBoundingClientRect().height > 0);
  }

  function showBannerIfEligible(){
    if(!_prompt) return;
    try{
      if(localStorage.getItem(INSTALL_KEY)) return;  /* already installed */
      if(localStorage.getItem(DISMISS_KEY)) return;  /* user dismissed */
    }catch(e){}
    /* Don't show if already in standalone / fullscreen (PWA installed) */
    if(isInstalled()) return;
    if(consentPending()){ waitForConsent(); return; }
    createBanner();
  }

  function waitForConsent(){
    if(_awaitingConsent) return;
    _awaitingConsent = true;
    /* MutationObserver rather than a poll: the banner is removed by a click
       handler, so there is exactly one edge to observe and no interval to leak.
       Guarded on document.body because bg.js can load this module before the
       body exists (CLAUDE.md 8.1 class 5a). */
    if(!document.body){
      document.addEventListener('DOMContentLoaded', function(){
        _awaitingConsent = false; waitForConsent();
      }, { once: true });
      return;
    }
    var obs = new MutationObserver(function(){
      if(consentPending()) return;
      obs.disconnect();
      _awaitingConsent = false;
      showBannerIfEligible();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function install(){
    if(!_prompt) return;
    hideBanner();
    _prompt.prompt();
    _prompt.userChoice.then(function(choice){
      if(choice.outcome === 'accepted'){
        try{ localStorage.setItem(INSTALL_KEY, '1'); }catch(e){}
        if(window.OmegaNotify && window.OmegaNotify.showToast){
          window.OmegaNotify.showToast('Sovereign app installed. Welcome to offline authority.', 'success');
        }
      }
      _prompt = null;
    }).catch(function(){});
  }

  /* ── B. APP BADGE ──────────────────────────────────────────────────── */
  function badge(count){
    if(!('setAppBadge' in navigator)) return;
    if(count > 0){
      navigator.setAppBadge(count).catch(function(){});
    } else {
      navigator.clearAppBadge().catch(function(){});
    }
  }

  /* ── C. DISPLAY MODE DETECTION ─────────────────────────────────────── */
  function isInstalled(){
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           window.navigator.standalone === true;
  }

  /* ── D. NATIVE SHARE ───────────────────────────────────────────────── */
  function share(title, text, url){
    if(navigator.share){
      return navigator.share({ title: title, text: text, url: url || location.href });
    }
    /* Fallback — copy URL to clipboard */
    if(navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(url || location.href).then(function(){
        if(window.OmegaNotify && window.OmegaNotify.showToast){
          window.OmegaNotify.showToast('Link copied to clipboard.', 'success');
        }
      });
    }
    return Promise.resolve();
  }

  /* ── E. NETWORK STATUS BANNER ──────────────────────────────────────── */
  (function setupNetworkBanner(){
    injectBannerCSS();

    var offBanner = document.createElement('div');
    offBanner.id = 'omega-offline-banner';
    offBanner.innerHTML = '&#8226; YOU ARE OFFLINE &mdash; SYD OMEGA 91717 IS OPERATING IN SOVEREIGN CACHE MODE &bull; RECONNECT TO SYNC YOUR MATRIX';
    offBanner.setAttribute('role', 'alert');
    offBanner.setAttribute('aria-live', 'assertive');

    function attachBanner(){
      if(!document.body){ requestAnimationFrame(attachBanner); return; }
      document.body.appendChild(offBanner);
      if(!navigator.onLine) offBanner.classList.add('show');
    }
    attachBanner();

    window.addEventListener('offline', function(){
      offBanner.classList.add('show');
      if(window.OmegaA11y) window.OmegaA11y.announce('You are offline. Operating in cache mode.', 'assertive');
    });
    window.addEventListener('online', function(){
      offBanner.classList.remove('show');
      if(window.OmegaA11y) window.OmegaA11y.announce('Connection restored.', 'polite');
    });
  })();

  /* ── CAPTURE INSTALL PROMPT ────────────────────────────────────────── */
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    _prompt = e;
    /* Show banner with a delay so it doesn't fire immediately on load */
    setTimeout(showBannerIfEligible, SHOW_DELAY);
  });

  /* Fired when user completes installation via browser UI (not our banner) */
  window.addEventListener('appinstalled', function(){
    try{ localStorage.setItem(INSTALL_KEY, '1'); }catch(e){}
    hideBanner();
    if(window.OmegaNotify && window.OmegaNotify.showToast){
      window.OmegaNotify.showToast('Ω SYD OMEGA 91717 installed as sovereign app.', 'success');
    }
    _prompt = null;
  });

  /* ── PUBLIC API ────────────────────────────────────────────────────── */
  window.OmegaPWA = {
    install:     install,
    share:       share,
    badge:       badge,
    isInstalled: isInstalled,
    isOnline:    function(){ return navigator.onLine; },
    showBanner:  showBannerIfEligible,
  };
})();
