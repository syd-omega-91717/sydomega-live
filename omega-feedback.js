/* ============================================================================
   SYD OMEGA 91717 -- FEEDBACK WIDGET
   A discreet feedback button for signed-in members on every page. Opens a
   panel to leave a comment + optional 1-5 star rating; submits to the
   submit_feedback RPC. Pure ASCII, reduced-motion safe, mobile-aware.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaFeedback) return;
  window.__omegaFeedback = 1;

  var css = [
    '#ofb-btn{position:fixed;left:12px;bottom:16px;z-index:9000;height:38px;padding:0 14px;border:1px solid rgba(201,168,76,.3);background:rgba(10,10,15,.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#C9A84C;font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:2px;border-radius:19px;cursor:pointer;transition:all .2s}',
    '#ofb-btn:hover{border-color:rgba(201,168,76,.6);color:#E2C86D}',
    '#ofb-ov{position:fixed;inset:0;z-index:9500;background:rgba(2,2,6,.72);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;padding:20px}',
    '#ofb-ov.open{display:flex}',
    '#ofb-card{width:100%;max-width:440px;border:1px solid rgba(201,168,76,.3);background:rgba(10,10,16,.98);border-radius:16px;padding:22px;font-family:"Courier Prime",monospace;color:#c8c5ba;box-shadow:0 24px 70px rgba(0,0,0,.7)}',
    '#ofb-card h3{color:#C9A84C;font-family:"Cinzel Decorative",serif;font-size:17px;margin:0 0 4px}',
    '#ofb-card p.sub{font-size:12px;color:#8a8676;margin:0 0 16px}',
    '#ofb-stars{display:flex;gap:6px;margin:0 0 14px}',
    '.ofb-star{font-size:24px;color:#3a3a44;cursor:pointer;transition:color .15s;line-height:1}',
    '.ofb-star.on{color:#E2C86D}',
    '#ofb-msg{width:100%;min-height:110px;background:rgba(0,0,0,.35);border:1px solid rgba(201,168,76,.25);border-radius:10px;color:#e8e6df;font-family:inherit;font-size:13px;padding:11px;resize:vertical;box-sizing:border-box}',
    '#ofb-row{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}',
    '.ofb-b{height:38px;padding:0 18px;border-radius:19px;font-family:inherit;font-size:11px;letter-spacing:2px;cursor:pointer;border:1px solid rgba(201,168,76,.3);background:none;color:#c8c5ba}',
    '.ofb-b.primary{background:rgba(201,168,76,.15);border-color:rgba(201,168,76,.6);color:#E2C86D}',
    '.ofb-b:disabled{opacity:.5;cursor:default}',
    '#ofb-note{font-size:12px;margin-top:10px;min-height:16px}',
    /* Part of the mobile bottom ladder (see omega-controls.js for the full
       stack): nav 0..66, ticker 66..94, controls dock 102..142, then this row
       at 150. bottom:78px cleared the nav bar but landed on the dock once that
       was lifted above the bar too. Left-anchored here, beside the
       right-anchored dedication widget, so the two never overlap. */
    '@media(max-width:760px){#ofb-btn{left:10px;bottom:150px}}'
  ].join('');
  var st = document.createElement('style'); st.id = 'ofb-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  var rating = 0, sb = null;

  function panel() {
    var ov = document.createElement('div'); ov.id = 'ofb-ov';
    ov.innerHTML =
      '<div id="ofb-card" role="dialog" aria-label="Feedback">' +
        '<h3>Share your feedback</h3>' +
        '<p class="sub">Tell the Order what you think. Optional rating below.</p>' +
        '<div id="ofb-stars"></div>' +
        '<textarea id="ofb-msg" placeholder="Your comment, idea, or issue..."></textarea>' +
        '<div id="ofb-note"></div>' +
        '<div id="ofb-row">' +
          '<button class="ofb-b" id="ofb-cancel">CANCEL</button>' +
          '<button class="ofb-b primary" id="ofb-send">SEND</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    var stars = ov.querySelector('#ofb-stars');
    for (var i = 1; i <= 5; i++) {
      (function (n) {
        var s = document.createElement('span'); s.className = 'ofb-star'; s.textContent = '\u2605';
        s.onclick = function () {
          rating = n;
          stars.querySelectorAll('.ofb-star').forEach(function (el, idx) {
            el.classList.toggle('on', idx < n);
          });
        };
        stars.appendChild(s);
      })(i);
    }
    ov.querySelector('#ofb-cancel').onclick = function () { ov.classList.remove('open'); };
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.classList.remove('open'); });
    ov.querySelector('#ofb-send').onclick = function () { send(ov); };
    return ov;
  }

  async function send(ov) {
    var msg = ov.querySelector('#ofb-msg').value.trim();
    var note = ov.querySelector('#ofb-note');
    if (!msg) { note.style.color = '#e0736b'; note.textContent = 'Please write a message first.'; return; }
    var btn = ov.querySelector('#ofb-send'); btn.disabled = true; note.style.color = '#8a8676'; note.textContent = 'Sending...';
    try {
      var r = await sb.rpc('submit_feedback', { p_message: msg, p_rating: rating || null, p_page: location.pathname });
      if (r.data && r.data.ok) {
        note.style.color = '#7ad17a'; note.textContent = 'Thank you. Your feedback was received.';
        ov.querySelector('#ofb-msg').value = ''; rating = 0;
        ov.querySelectorAll('.ofb-star').forEach(function (el) { el.classList.remove('on'); });
        setTimeout(function () { ov.classList.remove('open'); note.textContent = ''; btn.disabled = false; }, 1400);
      } else { note.style.color = '#e0736b'; note.textContent = (r.data && r.data.error) || 'Could not send.'; btn.disabled = false; }
    } catch (e) { note.style.color = '#e0736b'; note.textContent = 'Could not send.'; btn.disabled = false; }
  }

  function boot() {
    (window.OmegaSB?window.OmegaSB.get():import('/vendor/supabase-js.js')
      .then(function(m){return m.createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q');}))
      .then(function (_client) {
      sb = _client;
      sb.auth.getSession().then(function (r) {
        if (!(r && r.data && r.data.session)) return; // only for signed-in members
        var btn = document.createElement('button'); btn.id = 'ofb-btn'; btn.type = 'button'; btn.textContent = 'FEEDBACK';
        document.body.appendChild(btn);
        var ov = panel();
        btn.onclick = function () { ov.classList.add('open'); };
      }).catch(function () {});
    }).catch(function () {});
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
