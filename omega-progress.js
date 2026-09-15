/* ============================================================================
   SYD OMEGA 91717 -- PROGRESSION BRIDGE
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaProgress) return;

  var AXIS_NAME = { a: 'KNOWLEDGE', b: 'MASTERY', c: 'CONTRIBUTION' };
  var AXIS_COL  = { a: '#00E5FF', b: '#C9A84C', c: '#3fb27f' };

  function styles() {
    if (document.getElementById('omp-css')) return;
    var s = document.createElement('style');
    s.id = 'omp-css';
    s.textContent = [
      '.omp-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(14px);',
      'z-index:10000;display:flex;align-items:center;gap:10px;padding:12px 18px;',
      'border:1px solid rgba(201,168,76,.35);background:rgba(10,10,15,.94);',
      'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:3px;',
      'font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:1.2px;color:#e9e6dc;',
      'box-shadow:0 12px 32px rgba(0,0,0,.5);opacity:0;transition:opacity .28s,transform .28s;max-width:92vw}',
      '.omp-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}',
      '.omp-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}',
      '.omp-axis{font-weight:700}',
      '@media(max-width:760px){.omp-toast{bottom:78px;font-size:12px;padding:10px 14px}}'
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  }

  function toast(axis, title, delta) {
    try {
      styles();
      var el = document.createElement('div');
      el.className = 'omp-toast';
      var col = AXIS_COL[axis] || '#C9A84C';

      var dot = document.createElement('span');
      dot.className = 'omp-dot';
      dot.style.background = col;

      var body = document.createElement('span');
      var axisEl = document.createElement('span');
      axisEl.className = 'omp-axis';
      axisEl.style.color = col;
      axisEl.textContent = (AXIS_NAME[axis] || 'MATRIX') + ' +' + Number(delta).toFixed(2);
      body.appendChild(axisEl);

      if (title) {
        body.appendChild(document.createTextNode(' · '));
        var titleEl = document.createElement('span');
        titleEl.textContent = String(title);
        body.appendChild(titleEl);
      }

      el.appendChild(dot);
      el.appendChild(body);
      document.body.appendChild(el);
      requestAnimationFrame(function () { el.classList.add('on'); });
      setTimeout(function () {
        el.classList.remove('on');
        setTimeout(function () { el.remove(); }, 350);
      }, 3200);
    } catch (e) {}
  }

  function client() {
    if (window.OmegaSB) return window.OmegaSB.get();
    return import('/vendor/supabase-js.js').then(function (m) {
      return m.createClient("https://ydqhzvvoyufiiqvzcjns.supabase.co",
                            "sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q");
    });
  }

  function record(opts) {
    opts = opts || {};
    var axis = String(opts.axis || 'a').toLowerCase();
    if (['a', 'b', 'c'].indexOf(axis) === -1) axis = 'a';
    var weight = typeof opts.weight === 'number' ? opts.weight : 0.12;
    var silent = opts.silent === true;

    if (!opts.kind || !opts.task) {
      return Promise.resolve({ applied: false, error: 'kind and task required' });
    }

    return client().then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        if (!r || !r.data || !r.data.session) return { applied: false, error: 'signed out' };
        return sb.rpc('complete_task', {
          p_task_type: String(opts.kind),
          p_task_name: String(opts.task),
          p_axis_type: axis,
          p_description: opts.title || null,
          p_points: weight
        }).then(function (res) {
          if (res.error) throw res.error;
          var d = res.data || {};
          if (d.applied && !silent) toast(axis, opts.title, weight);
          return d;
        });
      });
    }).catch(function (e) {
      console.log('progress', e);
      return { applied: false, error: 'unavailable' };
    });
  }

  window.OmegaProgress = { record: record, AXIS_NAME: AXIS_NAME };
})();
