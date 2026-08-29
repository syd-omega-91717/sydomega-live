/* ============================================================================
   SYD OMEGA 91717 -- MATRIX CONTENT GATE (manifest section 5.1)
   Any element can be locked until the member's matrix position is high enough.
   Mark content with data-require, e.g.:
     <div data-require="a>=3">...</div>              needs Knowledge >= 3
     <div data-require="grade>=5">...</div>          needs Grade >= 5
     <a data-require="b>=4&c>=2">...</a>             needs Mastery>=4 AND Contribution>=2
     <section data-require="auth>=8">...</section>   needs Authority >= 8
   Keys: a,b,c (axes) | auth | grade | level | phase.  Operators: >= or >.
   Locked content is blurred with a gold seal showing the requirement; it
   unlocks automatically the moment the member qualifies. Owner sees all.
   Reads the matrix from the profile. Pure ASCII, reduced-motion safe.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaGate) return;
  window.__omegaGate = 1;
  var PHI = 1.6180339887, EU = 2.7182818285;
  var APEX = 27.8367;

  var css = [
    '.omg-lock{position:relative!important}',
    '.omg-lock>*{filter:blur(6px);pointer-events:none;user-select:none}',
    '.omg-seal{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(6,6,12,.55);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);border-radius:inherit;font-family:"Courier Prime",monospace;text-align:center;padding:10px}',
    '.omg-seal .ic{font-size:26px;color:#C9A84C}',
    '.omg-seal .rq{font-size:11px;letter-spacing:2px;color:#E2C86D}',
    '.omg-seal .hint{font-size:10px;letter-spacing:1px;color:#8a8676}'
  ].join('');
  var st = document.createElement('style'); st.id = 'omg-gate-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  var KEYLABEL = { a: 'KNOWLEDGE', b: 'MASTERY', c: 'CONTRIBUTION', auth: 'AUTHORITY', grade: 'GRADE', level: 'LEVEL', phase: 'PHASE' };

  function matrix(a, b, c) {
    var auth = Math.sqrt(Math.pow(a,3) + Math.pow(b,3) + Math.pow(c,3)) * PHI / EU;
    var g = Math.max(1, Math.min(12, Math.ceil(auth / APEX * 12)));
    var lo = (g - 1) / 12 * APEX, hi = g / 12 * APEX, w = Math.max(0, Math.min(1, (auth - lo) / (hi - lo)));
    var lv = Math.max(1, Math.min(12, Math.ceil(w * 12)));
    return { a: a, b: b, c: c, auth: auth, grade: g, level: lv, phase: g };
  }
  function meets(req, M, owner) {
    if (owner) return true;
    return req.split('&').every(function (cl) {
      var m = cl.trim().match(/^(a|b|c|auth|grade|level|phase)\s*(>=|>)\s*([\d.]+)$/i);
      if (!m) return true;
      var cur = M[m[1].toLowerCase()], val = parseFloat(m[3]);
      if (cur == null) return false;
      return m[2] === '>=' ? cur >= val : cur > val;
    });
  }
  function label(req) {
    return req.split('&').map(function (cl) {
      var m = cl.trim().match(/^(a|b|c|auth|grade|level|phase)\s*(>=|>)\s*([\d.]+)$/i);
      if (!m) return cl;
      return (KEYLABEL[m[1].toLowerCase()] || m[1]) + ' ' + m[2] + ' ' + m[3];
    }).join(' + ');
  }

  function lock(el, req) {
    if (el.querySelector(':scope > .omg-seal')) return;
    el.classList.add('omg-lock');
    var seal = document.createElement('div'); seal.className = 'omg-seal';
    seal.innerHTML = '<div class="ic">&#128274;</div><div class="rq">UNLOCKS AT ' + label(req) + '</div><div class="hint">advance the matrix to reveal</div>';
    el.appendChild(seal);
  }
  function unlock(el) {
    el.classList.remove('omg-lock');
    var s = el.querySelector(':scope > .omg-seal'); if (s) s.remove();
  }

  function applyAll(M, owner) {
    var list = document.querySelectorAll('[data-require]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i], req = el.getAttribute('data-require') || '';
      if (meets(req, M, owner)) unlock(el); else lock(el, req);
    }
  }

  function boot() {
    // default lock everything gated until we confirm the member qualifies
    var pre = { a: 0, b: 0, c: 0, auth: 0, grade: 0, level: 0, phase: 0 };
    applyAll(pre, false);
    (window.OmegaSB?window.OmegaSB.get():import('/vendor/supabase-js.js').then(function(m){return m.createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co', 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q');})).then(function (sb) {
      sb.auth.getSession().then(function (r) {
        var s = r && r.data && r.data.session; if (!s) return;
        sb.from('profiles').select('axis_a,axis_b,axis_c,is_owner').eq('id', s.user.id).maybeSingle().then(function (res) {
          var d = res && res.data; if (!d) return;
          var M = matrix(Number(d.axis_a || 0), Number(d.axis_b || 0), Number(d.axis_c || 0));
          applyAll(M, !!d.is_owner);
          window.OmegaGate = { matrix: M, refresh: function () { applyAll(M, !!d.is_owner); } };
          // catch content injected later
          try { new MutationObserver(function () { applyAll(M, !!d.is_owner); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
        }).catch(function () {});
      }).catch(function () {});
    }).catch(function () {});
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
