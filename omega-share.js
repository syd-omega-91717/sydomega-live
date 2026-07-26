/* ============================================================================
   SYD OMEGA 91717 -- SOVEREIGN SHARE LAYER (manifest section 7)
   A share button on every page that broadcasts the member's sovereign status
   (sign / grade / authority) to Instagram, X, Facebook, WhatsApp, Telegram,
   Reddit, LinkedIn, TikTok -- or the native share sheet on mobile (which covers
   every installed app). Clean SVG emblems, no emoji. Pure ASCII.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaShare) return;
  window.__omegaShare = 1;
  var APEX = 27.8367, SITE = 'https://sydomega.com';

  var css = [
    '#osh-btn{position:fixed;right:12px;bottom:16px;z-index:9000;height:38px;padding:0 14px;display:flex;align-items:center;gap:7px;border:1px solid rgba(201,168,76,.3);background:rgba(10,10,15,.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#C9A84C;font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:2px;border-radius:19px;cursor:pointer;transition:all .2s}',
    '#osh-btn:hover{border-color:rgba(201,168,76,.6);color:#E2C86D}',
    '#osh-btn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.6}',
    '#osh-ov{position:fixed;inset:0;z-index:9600;background:rgba(2,2,6,.72);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;padding:20px}',
    '#osh-ov.open{display:flex}',
    '#osh-card{width:100%;max-width:440px;border:1px solid rgba(201,168,76,.3);background:rgba(10,10,16,.98);border-radius:16px;padding:22px;font-family:"Courier Prime",monospace;color:#c8c5ba;box-shadow:0 24px 70px rgba(0,0,0,.7)}',
    '#osh-card h3{font-family:"Cinzel Decorative",serif;color:#C9A84C;font-size:17px;margin:0 0 4px}',
    '#osh-quote{font-size:12px;color:#8a8676;margin:0 0 16px;line-height:1.5}',
    '.osh-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}',
    '.osh-b{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border:1px solid rgba(201,168,76,.2);border-radius:10px;color:#d8d5cb;text-decoration:none;font-size:9px;letter-spacing:1px;cursor:pointer;background:none;transition:all .2s}',
    '.osh-b:hover{border-color:rgba(201,168,76,.6);color:#E2C86D;transform:translateY(-2px)}',
    '.osh-b svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.5}',
    '#osh-row{display:flex;gap:10px;margin-top:16px}',
    '#osh-copy{flex:1;height:38px;border:1px solid rgba(201,168,76,.3);background:rgba(201,168,76,.08);color:#E2C86D;border-radius:19px;font-family:inherit;font-size:11px;letter-spacing:2px;cursor:pointer}',
    '#osh-close{height:38px;padding:0 18px;border:1px solid rgba(201,168,76,.2);background:none;color:#c8c5ba;border-radius:19px;font-family:inherit;font-size:11px;letter-spacing:2px;cursor:pointer}',
    '@media(max-width:760px){#osh-btn{bottom:224px}}'
  ].join('');
  var st = document.createElement('style'); st.id = 'osh-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  var IC = {
    x: '<svg viewBox="0 0 24 24"><path d="M4 4l16 16M20 4L4 20"/></svg>',
    fb: '<svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8a0 0 0 0 1 1-1z"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M4 20l1.5-4A8 8 0 1 1 9 19z"/><path d="M8.5 9.5c.5 2 2 3.5 4 4l1-1 2 1c-.5 1.5-2 2-3.5 1.5A7 7 0 0 1 7 9c0-1.5.5-2 2-1.5z"/></svg>',
    tg: '<svg viewBox="0 0 24 24"><path d="M21 4L3 11l5 2 2 6 3-4 5 4z"/></svg>',
    rd: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M9 16c2 1 4 1 6 0M16 6l-1 4"/></svg>',
    li: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4"/></svg>',
    ig: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1"/></svg>',
    tt: '<svg viewBox="0 0 24 24"><path d="M15 4v9a4 4 0 1 1-4-4M15 7a5 5 0 0 0 4 2"/></svg>'
  };

  var STATE = { text: 'I am ascending through the 104,976-Node Matrix of SYD OMEGA 91717. The Code. The Frequency. The Legacy.' };

  function enc(x) { return encodeURIComponent(x); }
  function targets() {
    var t = STATE.text, u = SITE;
    return [
      ['X', IC.x, 'https://twitter.com/intent/tweet?text=' + enc(t) + '&url=' + enc(u)],
      ['FACEBOOK', IC.fb, 'https://www.facebook.com/sharer/sharer.php?u=' + enc(u) + '&quote=' + enc(t)],
      ['WHATSAPP', IC.wa, 'https://wa.me/?text=' + enc(t + ' ' + u)],
      ['TELEGRAM', IC.tg, 'https://t.me/share/url?url=' + enc(u) + '&text=' + enc(t)],
      ['REDDIT', IC.rd, 'https://www.reddit.com/submit?url=' + enc(u) + '&title=' + enc(t)],
      ['LINKEDIN', IC.li, 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc(u)],
      ['INSTAGRAM', IC.ig, 'native'],
      ['TIKTOK', IC.tt, 'native']
    ];
  }

  function openNative() {
    if (navigator.share) { navigator.share({ title: 'SYD OMEGA 91717', text: STATE.text, url: SITE }).catch(function () {}); }
    else { copyLink(); alert('Link copied -- paste it into the app to share.'); }
  }
  function copyLink() {
    var s = STATE.text + ' ' + SITE;
    if (navigator.clipboard) navigator.clipboard.writeText(s).catch(function () {});
  }

  function build() {
    var btn = document.createElement('button'); btn.id = 'osh-btn'; btn.type = 'button';
    btn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 11l8-4M8 13l8 4"/></svg><span>SHARE</span>';
    document.body.appendChild(btn);

    var ov = document.createElement('div'); ov.id = 'osh-ov';
    ov.innerHTML = '<div id="osh-card"><h3>Broadcast your ascent</h3><div id="osh-quote"></div><div class="osh-grid" id="osh-grid"></div><div id="osh-row"><button id="osh-copy">COPY LINK</button><button id="osh-close">CLOSE</button></div></div>';
    document.body.appendChild(ov);
    var grid = ov.querySelector('#osh-grid');
    targets().forEach(function (tg) {
      var el = document.createElement(tg[2] === 'native' ? 'button' : 'a');
      el.className = 'osh-b'; el.innerHTML = tg[1] + '<span>' + tg[0] + '</span>';
      if (tg[2] === 'native') { el.onclick = openNative; }
      else { el.href = tg[2]; el.target = '_blank'; el.rel = 'noopener'; }
      grid.appendChild(el);
    });
    ov.querySelector('#osh-copy').onclick = function () { copyLink(); this.textContent = 'COPIED'; var b = this; setTimeout(function () { b.textContent = 'COPY LINK'; }, 1400); };
    ov.querySelector('#osh-close').onclick = function () { ov.classList.remove('open'); };
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.classList.remove('open'); });
    btn.onclick = function () { ov.querySelector('#osh-quote').textContent = STATE.text; ov.classList.add('open'); };
  }

  function personalize() {
    (window.OmegaSB?window.OmegaSB.get():import('https://esm.sh/@supabase/supabase-js@2').then(function(m){return m.createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co', 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q');})).then(function (sb) {
      sb.auth.getSession().then(function (r) {
        var s = r && r.data && r.data.session; if (!s) return;
        sb.from('profiles').select('sign,axis_a,axis_b,axis_c').eq('id', s.user.id).maybeSingle().then(function (res) {
          var d = res && res.data; if (!d) return;
          var auth = Math.sqrt(Math.pow(d.axis_a||0.001,3)+Math.pow(d.axis_b||0.001,3)+Math.pow(d.axis_c||0.001,3));
          var g = Math.max(1, Math.min(12, Math.ceil(auth / APEX * 12)));
          STATE.text = 'I have reached Grade ' + g + ' as a ' + (d.sign || 'Sovereign') + ' in the 104,976-Node Matrix of SYD OMEGA 91717. The Code. The Frequency. The Legacy.';
        }).catch(function () {});
      }).catch(function () {});
    }).catch(function () {});
  }

  function boot() { build(); personalize(); }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
