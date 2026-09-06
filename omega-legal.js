/* ==========================================================================
   Ω SYD OMEGA 91717 — LEGAL COMPLIANCE ENGINE (omega-legal.js)

   Directives:
   A. COPYRIGHT BADGE — shows a discreet Ω copyright notice on every page.
      The badge is injected once into the document footer and marked with
      ARIA so screen readers can reach it.

   B. GDPR / PRIVACY CONSENT BANNER — shown on first visit (or when consent
      is missing). Respects the EU ePrivacy Directive and GDPR Art. 7.
      Uses localStorage to remember the choice — no cookies written.
      Choices: Accept All | Essential Only | View Policy

   C. TERMS FOOTER LINKS — injects canonical links to Terms, Privacy, and
      Cookie Policy at the bottom of every .lf / footer element found on
      the page, so no page is ever without legal navigation.

   D. DIGITAL WATERMARK — adds a hidden (non-user-visible) meta signature
      to assert authorship without impacting the visual layout.
      Tracks content origin via a static <meta> tag and a JS token.

   All text is visible by default; zero external requests; zero cookies.
   ========================================================================== */
(function(){
  'use strict';
  if(window.__omegaLegalActive) return;
  window.__omegaLegalActive = true;

  var YEAR = new Date().getFullYear();
  var OWNER = 'Ω SYD OMEGA 91717';  /* Ω */
  var COPYRIGHT = '© ' + YEAR + ' ' + OWNER + '. All rights reserved.';

  /* ── A. DIGITAL WATERMARK META ──────────────────────────────────────── */
  (function(){
    try{
      var head = document.head || document.documentElement;
      if(!document.querySelector('meta[name="copyright"]')){
        var m1 = document.createElement('meta');
        m1.name = 'copyright'; m1.content = COPYRIGHT;
        head.appendChild(m1);
      }
      if(!document.querySelector('meta[name="author"]')){
        var m2 = document.createElement('meta');
        m2.name = 'author'; m2.content = OWNER;
        head.appendChild(m2);
      }
      if(!document.querySelector('meta[property="og:site_name"]')){
        var m3 = document.createElement('meta');
        m3.setAttribute('property','og:site_name');
        m3.content = OWNER;
        head.appendChild(m3);
      }
    }catch(e){}
  })();

  /* ── B. GDPR CONSENT BANNER ─────────────────────────────────────────── */
  var CONSENT_KEY = 'omega_consent_v1';
  var CONSENT_CSS_ID = 'omega-legal-css';

  function getConsent(){ try{ return localStorage.getItem(CONSENT_KEY); }catch(e){ return null; } }
  function setConsent(v){ try{ localStorage.setItem(CONSENT_KEY, v); }catch(e){} }

  function injectCSS(){
    if(document.getElementById(CONSENT_CSS_ID)) return;
    var s = document.createElement('style');
    s.id = CONSENT_CSS_ID;
    s.textContent = [
      '#omega-consent{position:fixed;bottom:var(--omega-chrome-bottom,0px);left:0;right:0;z-index:9990;',
      'background:rgba(2,2,6,.97);border-top:1px solid rgba(201,168,76,.25);',
      'padding:clamp(12px,2vw,18px) clamp(14px,3vw,36px);',
      'display:flex;align-items:center;flex-wrap:wrap;gap:12px;',
      'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);',
      'animation:omega-consent-rise .35s ease both}',
      '@keyframes omega-consent-rise{from{transform:translateY(100%)}to{transform:none}}',
      '#omega-consent .lc-text{flex:1;min-width:200px;',
      'font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:1.5px;',
      'line-height:1.8;color:rgba(233,230,220,.7)}',
      '#omega-consent .lc-text a{color:#00E5FF;text-decoration:none}',
      '#omega-consent .lc-text a:hover{text-decoration:underline}',
      '#omega-consent .lc-btns{display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0}',
      '#omega-consent .lc-btn{font-family:"Courier Prime",monospace;font-size:12px;',
      'letter-spacing:2px;padding:7px 16px;border:1px solid;border-radius:2px;',
      'cursor:pointer;background:none;transition:.18s;white-space:nowrap}',
      '#omega-consent .lc-accept{color:#C9A84C;border-color:rgba(201,168,76,.4)}',
      '#omega-consent .lc-accept:hover{background:rgba(201,168,76,.1);border-color:#C9A84C}',
      '#omega-consent .lc-essential{color:rgba(138,134,118,.8);border-color:rgba(138,134,118,.25)}',
      '#omega-consent .lc-essential:hover{background:rgba(138,134,118,.06)}',
      '#omega-consent .lc-policy{color:#00E5FF;border-color:rgba(0,229,255,.2)}',
      '#omega-consent .lc-policy:hover{background:rgba(0,229,255,.06)}',
      '.omega-legal-footer{font-family:"Courier Prime",monospace;font-size:12px;',
      'letter-spacing:1.5px;color:rgba(138,134,118,.5);display:flex;flex-wrap:wrap;',
      'gap:10px;align-items:center;justify-content:center;padding:8px 0;',
      'border-top:1px solid rgba(201,168,76,.07);margin-top:8px}',
      '.omega-legal-footer a{color:rgba(138,134,118,.6);text-decoration:none}',
      /* 7.5px text gives these a ~10px-tall hit area on a phone. The text
         size is deliberate (fine print) so only the hit area grows, to the
         24px WCAG 2.5.8 floor. */
      '@media(max-width:760px){.omega-legal-footer a{display:inline-flex;',
      'align-items:center;min-height:24px;padding:0 4px}}',
      '.omega-legal-footer a:hover{color:rgba(201,168,76,.8)}',
      '.omega-copyright-badge{font-family:"Courier Prime",monospace;font-size:12px;',
      'letter-spacing:1.5px;color:rgba(138,134,118,.45)}',
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  }

  function showBanner(){
    if(document.getElementById('omega-consent')) return;
    injectCSS();
    var b = document.createElement('div');
    b.id = 'omega-consent';
    b.setAttribute('role','dialog');
    b.setAttribute('aria-live','polite');
    b.setAttribute('aria-label','Cookie and privacy consent');
    b.innerHTML =
      '<div class="lc-text">'+OWNER+' uses essential cookies to run the platform. '
      +'We do not track you without consent. '
      +'<a href="/privacy.html">Privacy Policy</a> &middot; '
      +'<a href="/terms.html">Terms</a></div>'
      +'<div class="lc-btns">'
      +'<button class="lc-btn lc-policy" onclick="window.open(\'/privacy.html\',\'_self\')" type="button">POLICY</button>'
      +'<button class="lc-btn lc-essential" id="omega-consent-essential" type="button">ESSENTIAL ONLY</button>'
      +'<button class="lc-btn lc-accept" id="omega-consent-accept" type="button">ACCEPT ALL</button>'
      +'</div>';
    document.body.appendChild(b);
    document.getElementById('omega-consent-accept').addEventListener('click',function(){
      setConsent('all'); b.remove();
    });
    document.getElementById('omega-consent-essential').addEventListener('click',function(){
      setConsent('essential'); b.remove();
    });
  }

  /* ── C. TERMS FOOTER LINKS ──────────────────────────────────────────── */
  function injectLegalFooter(){
    injectCSS();
    /* Append to any .lf footer band already in the DOM */
    var footers = document.querySelectorAll('.lf, footer, [data-omega-footer]');
    var injected = false;
    footers.forEach(function(f){
      if(!f.querySelector('.omega-legal-footer')){
        var lf = document.createElement('div');
        lf.className = 'omega-legal-footer';
        lf.innerHTML =
          '<span class="omega-copyright-badge">'+COPYRIGHT+'</span>'
          +'<a href="/terms.html">TERMS</a>'
          +'<a href="/privacy.html">PRIVACY</a>'
          +'<a href="/compliance.html">COMPLIANCE</a>';
        f.appendChild(lf);
        injected = true;
      }
    });
    /* If no footer exists yet, inject one at the bottom of #app or body */
    if(!injected){
      var target = document.getElementById('app') || document.querySelector('.main') || document.body;
      if(target && !target.querySelector('.omega-legal-footer')){
        var lf2 = document.createElement('div');
        lf2.className = 'omega-legal-footer';
        lf2.style.cssText = 'padding:12px clamp(14px,3vw,36px);margin-top:auto';
        lf2.innerHTML =
          '<span class="omega-copyright-badge">'+COPYRIGHT+'</span>'
          +'<a href="/terms.html">TERMS</a>'
          +'<a href="/privacy.html">PRIVACY</a>'
          +'<a href="/compliance.html">COMPLIANCE</a>';
        target.appendChild(lf2);
      }
    }
  }

  /* ── D. BOOT ─────────────────────────────────────────────────────────── */
  function boot(){
    /* Only public/pre-login pages get the consent banner */
    var path = (location.pathname||'/').replace(/\.html$/,'');
    var publicPages = ['/account','/enter','/reset','/terms','/pending','/index','/',''];
    var isPublic = publicPages.indexOf(path) > -1;
    if(!getConsent() || isPublic){
      /* Delay banner 2s to not compete with page boot */
      setTimeout(showBanner, 2000);
    }
    /* Legal footer on all pages */
    setTimeout(injectLegalFooter, 1000);
    /* Re-inject after dynamic content renders */
    document.addEventListener('omega:populated', function(){
      setTimeout(injectLegalFooter, 500);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ── PUBLIC API ──────────────────────────────────────────────────────── */
  window.OmegaLegal = {
    getConsent: getConsent,
    setConsent: setConsent,
    showBanner: showBanner,
    copyright: COPYRIGHT,
  };
})();
