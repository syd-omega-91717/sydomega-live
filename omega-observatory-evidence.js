/* Ω SYD OMEGA 91717 — Observatory Evidence Console
 * Reads the repository's canonical production evidence gate.
 * This is a repository-declared readiness view, NOT live provider telemetry.
 * No database writes, provider calls, or inferred health states are performed.
 */
(function () {
  'use strict';

  var ROOT_ID = 'omega-evidence-console';
  var SOURCE = '/config/omega-production-10-10-evidence-gate.json';
  var NS = 'http://www.w3.org/2000/svg';
  var STATUS = {
    PASS: { label: 'PASS', color: '#43D19E' },
    PARTIAL: { label: 'PARTIAL', color: '#00D9F5' },
    PENDING: { label: 'PENDING', color: '#E8C766' },
    BLOCKED: { label: 'BLOCKED', color: '#E05B65' },
    REVIEW_REQUIRED: { label: 'REVIEW REQUIRED', color: '#B99BFF' },
    UNVERIFIED: { label: 'UNVERIFIED', color: '#9296A3' }
  };

  function el(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value != null) node.textContent = String(value);
    return node;
  }

  function svgNode(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  function normaliseDomain(domain) {
    var id = String(domain && domain.id || 'unknown');
    var status = String(domain && domain.status || 'UNVERIFIED').toUpperCase();
    var title = id.replace(/_/g, ' ');
    if (id === 'vercel_production') {
      return {
        id: id,
        title: 'Cloudflare production proof',
        status: 'REVIEW_REQUIRED',
        note: 'The source gate is Vercel-specific, while the current repository declares Cloudflare Pages as production. Reconcile the gate with the actual provider before treating this as a deployment verdict.',
        evidence: Array.isArray(domain.evidence_required) ? domain.evidence_required : []
      };
    }
    if (!STATUS[status]) status = 'UNVERIFIED';
    return {
      id: id,
      title: title,
      status: status,
      note: '',
      evidence: Array.isArray(domain && domain.evidence_required) ? domain.evidence_required : []
    };
  }

  function makeOrbit(items, summary) {
    var svg = svgNode('svg', {
      viewBox: '0 0 360 300',
      role: 'img',
      'aria-labelledby': 'omega-orbit-title omega-orbit-desc',
      class: 'oec-orbit'
    });
    var title = svgNode('title', { id: 'omega-orbit-title' });
    title.textContent = 'Production evidence constellation';
    var desc = svgNode('desc', { id: 'omega-orbit-desc' });
    desc.textContent = 'A visual map of repository-declared production evidence states. It is not live provider telemetry.';
    svg.appendChild(title);
    svg.appendChild(desc);

    [54, 91, 126].forEach(function (radius, index) {
      svg.appendChild(svgNode('circle', {
        cx: 180, cy: 144, r: radius, fill: 'none',
        stroke: index === 2 ? 'rgba(201,168,76,.28)' : 'rgba(0,217,245,.14)',
        'stroke-width': index === 2 ? 1.2 : 1,
        'stroke-dasharray': index === 1 ? '3 7' : 'none'
      }));
    });

    var count = Math.max(items.length, 1);
    items.forEach(function (item, index) {
      var angle = (-Math.PI / 2) + (Math.PI * 2 * index / count);
      var x = 180 + Math.cos(angle) * 126;
      var y = 144 + Math.sin(angle) * 92;
      var state = STATUS[item.status] || STATUS.UNVERIFIED;
      svg.appendChild(svgNode('line', {
        x1: 180, y1: 144, x2: x, y2: y,
        stroke: state.color, 'stroke-opacity': '.42', 'stroke-width': 1
      }));
      svg.appendChild(svgNode('circle', {
        cx: x, cy: y, r: 10, fill: '#090B12',
        stroke: state.color, 'stroke-width': 2
      }));
      svg.appendChild(svgNode('circle', {
        cx: x, cy: y, r: 3.4, fill: state.color
      }));
    });

    svg.appendChild(svgNode('circle', {
      cx: 180, cy: 144, r: 37, fill: 'rgba(201,168,76,.08)',
      stroke: 'rgba(201,168,76,.72)', 'stroke-width': 1.4
    }));
    var omega = svgNode('text', {
      x: 180, y: 151, 'text-anchor': 'middle',
      fill: '#E8C766', 'font-family': 'Cinzel,serif', 'font-size': 28
    });
    omega.textContent = 'Ω';
    svg.appendChild(omega);

    var caption = svgNode('text', {
      x: 180, y: 202, 'text-anchor': 'middle',
      fill: '#A9AFBC', 'font-family': 'Courier Prime,monospace',
      'font-size': 9, 'letter-spacing': 2
    });
    caption.textContent = items.length + ' CONTROL DOMAINS';
    svg.appendChild(caption);

    var total = svgNode('text', {
      x: 180, y: 220, 'text-anchor': 'middle',
      fill: '#E8C766', 'font-family': 'Cinzel,serif', 'font-size': 10
    });
    total.textContent = summary.PASS + ' PASS DECLARED';
    svg.appendChild(total);
    return svg;
  }

  function render(host, data) {
    var domains = Array.isArray(data.domains) ? data.domains.map(normaliseDomain) : [];
    if (!domains.length) throw new Error('Evidence gate contains no domains.');

    var counts = { PASS: 0, PARTIAL: 0, PENDING: 0, BLOCKED: 0, REVIEW_REQUIRED: 0, UNVERIFIED: 0 };
    domains.forEach(function (item) { counts[item.status] = (counts[item.status] || 0) + 1; });

    var section = el('section', 'oec');
    section.setAttribute('aria-labelledby', 'oec-title');

    var head = el('div', 'oec-head');
    var eyebrow = el('div', 'oec-eyebrow', 'Ω / PRODUCTION ASSURANCE / EVIDENCE MAP');
    var title = el('h2', 'oec-title', 'THE PRODUCTION EVIDENCE GATE');
    title.id = 'oec-title';
    var subtitle = el('p', 'oec-subtitle',
      'A source-backed view of the controls required before production readiness can be claimed.');
    head.appendChild(eyebrow);
    head.appendChild(title);
    head.appendChild(subtitle);

    var notice = el('div', 'oec-truth');
    notice.appendChild(el('span', 'oec-truth-mark', 'SOURCE DECLARATION'));
    notice.appendChild(el('span', 'oec-truth-copy',
      'Repository configuration only · Not a live Supabase, Cloudflare, Stripe or monitoring check · Snapshot timestamp is not encoded in the source file.'));
    section.appendChild(head);
    section.appendChild(notice);

    var overview = el('div', 'oec-overview');
    var visual = el('div', 'oec-visual');
    visual.appendChild(el('div', 'oec-panel-label', 'CONTROL CONSTELLATION'));
    visual.appendChild(makeOrbit(domains, counts));
    var legend = el('div', 'oec-legend');
    ['PASS', 'PARTIAL', 'PENDING', 'BLOCKED', 'REVIEW_REQUIRED'].forEach(function (key) {
      var item = el('span', 'oec-legend-item');
      var dot = el('i', 'oec-dot');
      dot.style.setProperty('--oec-state', STATUS[key].color);
      item.appendChild(dot);
      item.appendChild(el('span', '', key === 'REVIEW_REQUIRED' ? 'REVIEW' : key));
      legend.appendChild(item);
    });
    visual.appendChild(legend);

    var stats = el('div', 'oec-stats');
    [
      ['PASS', 'SOURCE PASS'],
      ['PARTIAL', 'PARTIAL'],
      ['PENDING', 'PENDING'],
      ['BLOCKED', 'BLOCKED'],
      ['REVIEW_REQUIRED', 'REVIEW']
    ].forEach(function (pair) {
      var card = el('div', 'oec-stat');
      card.style.setProperty('--oec-state', STATUS[pair[0]].color);
      card.appendChild(el('strong', 'oec-stat-value', counts[pair[0]] || 0));
      card.appendChild(el('span', 'oec-stat-label', pair[1]));
      stats.appendChild(card);
    });
    overview.appendChild(visual);
    overview.appendChild(stats);
    section.appendChild(overview);

    var listHead = el('div', 'oec-list-head');
    listHead.appendChild(el('h3', '', 'CONTROL DOMAINS'));
    listHead.appendChild(el('span', '', domains.length + ' DECLARED CONTROLS'));
    section.appendChild(listHead);

    var grid = el('div', 'oec-grid');
    domains.forEach(function (item, index) {
      var state = STATUS[item.status] || STATUS.UNVERIFIED;
      var card = el('details', 'oec-domain');
      card.style.setProperty('--oec-state', state.color);
      var summary = el('summary', 'oec-domain-summary');
      var indexNode = el('span', 'oec-index', String(index + 1).padStart(2, '0'));
      var name = el('span', 'oec-domain-name', item.title);
      var badge = el('span', 'oec-status', state.label);
      summary.appendChild(indexNode);
      summary.appendChild(name);
      summary.appendChild(badge);
      card.appendChild(summary);

      if (item.note) card.appendChild(el('p', 'oec-domain-note', item.note));
      var evidence = el('ul', 'oec-evidence');
      if (item.evidence.length) {
        item.evidence.forEach(function (requirement) {
          evidence.appendChild(el('li', '', requirement.replace(/_/g, ' ')));
        });
      } else {
        evidence.appendChild(el('li', '', 'No evidence requirements declared in this source.'));
      }
      card.appendChild(evidence);
      grid.appendChild(card);
    });
    section.appendChild(grid);

    var footer = el('div', 'oec-footer');
    var source = el('span', 'oec-source', 'SOURCE: ' + SOURCE);
    var links = el('div', 'oec-links');
    var ownerLink = el('a', 'oec-link', 'OPEN OWNER DECK');
    ownerLink.href = '/control-plane.html';
    var governLink = el('a', 'oec-link oec-link-secondary', 'OPEN GOVERN WORKSPACE');
    governLink.href = '/govern.html';
    links.appendChild(ownerLink);
    links.appendChild(governLink);
    footer.appendChild(source);
    footer.appendChild(links);
    section.appendChild(footer);

    host.replaceChildren(section);
  }

  function mount() {
    var host = document.getElementById(ROOT_ID);
    if (!host || host.getAttribute('data-oec-mounted') === 'true') return;
    host.setAttribute('data-oec-mounted', 'true');

    var style = el('style');
    style.id = 'omega-observatory-evidence-style';
    style.textContent = [
      '.oec{--oec-line:rgba(201,168,76,.18);--oec-muted:#A9AFBC;margin:24px 0 8px;padding:clamp(16px,2.8vw,30px);border:1px solid var(--oec-line);border-radius:18px;background:radial-gradient(ellipse at 10% 0%,rgba(0,217,245,.09),transparent 38%),radial-gradient(ellipse at 100% 15%,rgba(201,168,76,.11),transparent 35%),linear-gradient(145deg,rgba(14,16,26,.96),rgba(4,5,10,.96));box-shadow:0 22px 70px rgba(0,0,0,.24);color:#E8E4D8}',
      '.oec-head{max-width:780px}.oec-eyebrow,.oec-panel-label,.oec-list-head>span,.oec-stat-label,.oec-source{font:12px/1.5 "Courier Prime",monospace;letter-spacing:1.8px;color:var(--oec-muted)}',
      '.oec-eyebrow{color:#00D9F5}.oec-title{margin:8px 0;font:600 clamp(20px,3vw,30px)/1.2 "Cinzel",serif;letter-spacing:.04em;color:#F0D992}.oec-subtitle{margin:0;color:#B9C0CC;font:16px/1.55 "Rajdhani",sans-serif;max-width:700px}',
      '.oec-truth{display:flex;gap:12px;align-items:flex-start;margin:20px 0;padding:12px 14px;border:1px solid rgba(0,217,245,.25);border-radius:10px;background:rgba(0,217,245,.045)}.oec-truth-mark{flex:0 0 auto;color:#00D9F5;font:12px "Courier Prime",monospace;letter-spacing:1.2px}.oec-truth-copy{color:#B9C0CC;font:14px/1.5 "Rajdhani",sans-serif}',
      '.oec-overview{display:grid;grid-template-columns:minmax(220px,.85fr) minmax(0,1.15fr);gap:16px;align-items:stretch}.oec-visual,.oec-stat{border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.018)}.oec-visual{padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0}.oec-panel-label{align-self:flex-start}.oec-orbit{display:block;width:min(100%,340px);height:auto;max-height:300px;overflow:visible}',
      '.oec-legend{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}.oec-legend-item{display:inline-flex;align-items:center;gap:6px;color:#A9AFBC;font:12px "Courier Prime",monospace}.oec-dot{width:7px;height:7px;border-radius:50%;background:var(--oec-state);box-shadow:0 0 10px color-mix(in srgb,var(--oec-state) 45%,transparent)}',
      '.oec-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.oec-stat{padding:16px;display:flex;flex-direction:column;justify-content:center;min-height:96px;border-top:2px solid var(--oec-state)}.oec-stat-value{font:600 clamp(26px,4vw,38px)/1 "Cinzel",serif;color:var(--oec-state)}.oec-stat-label{margin-top:8px}',
      '.oec-list-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:28px 0 12px}.oec-list-head h3{margin:0;color:#E8C766;font:13px "Courier Prime",monospace;letter-spacing:2px}.oec-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.oec-domain{min-width:0;border:1px solid rgba(255,255,255,.085);border-left:2px solid var(--oec-state);border-radius:10px;background:rgba(255,255,255,.022);overflow:hidden}.oec-domain[open]{background:rgba(255,255,255,.035)}.oec-domain-summary{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:9px;align-items:center;min-height:58px;padding:10px 12px;cursor:pointer;list-style:none}.oec-domain-summary::-webkit-details-marker{display:none}.oec-domain-summary:focus-visible,.oec-link:focus-visible{outline:2px solid #00D9F5;outline-offset:3px}.oec-index{color:#78808D;font:12px "Courier Prime",monospace}.oec-domain-name{color:#E8E4D8;font:600 14px/1.35 "Rajdhani",sans-serif;text-transform:capitalize;overflow-wrap:anywhere}.oec-status{padding:5px 7px;border:1px solid color-mix(in srgb,var(--oec-state) 45%,transparent);border-radius:999px;color:var(--oec-state);font:12px "Courier Prime",monospace;letter-spacing:.7px;white-space:nowrap}.oec-domain-note{margin:0 12px 10px;padding:10px;border-radius:8px;background:rgba(185,155,255,.07);color:#D0C8E5;font:13px/1.5 "Rajdhani",sans-serif}.oec-evidence{margin:0 12px 14px;padding-left:22px;color:#B9C0CC;font:13px/1.6 "Rajdhani",sans-serif}.oec-evidence li::marker{color:var(--oec-state)}',
      '.oec-footer{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,.08)}.oec-source{font-size:12px;letter-spacing:.5px;overflow-wrap:anywhere}.oec-links{display:flex;gap:8px;flex-wrap:wrap}.oec-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 13px;border:1px solid rgba(201,168,76,.5);border-radius:8px;color:#E8C766;text-decoration:none;font:12px "Courier Prime",monospace;letter-spacing:.6px}.oec-link-secondary{border-color:rgba(0,217,245,.35);color:#00D9F5}.oec-link:hover{background:rgba(201,168,76,.08)}',
      '.oec-error{padding:16px;border:1px solid rgba(224,91,101,.35);border-radius:10px;color:#E7A3A8;font:14px/1.5 "Rajdhani",sans-serif}',
      '@media(max-width:720px){.oec-overview{grid-template-columns:1fr}.oec-visual{display:grid;grid-template-columns:minmax(0,1fr);justify-items:center}.oec-orbit{max-width:290px}.oec-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.oec-grid{grid-template-columns:1fr}.oec-domain-summary{grid-template-columns:26px minmax(0,1fr) auto}.oec-title{font-size:22px}}',
      '@media(max-width:420px){.oec{padding:14px}.oec-truth{display:block}.oec-truth-copy{display:block;margin-top:6px}.oec-domain-summary{grid-template-columns:22px minmax(0,1fr)}.oec-status{grid-column:2;justify-self:start}.oec-stat{min-height:82px;padding:12px}.oec-link{width:100%}.oec-links{width:100%}}',
      '@media(prefers-reduced-motion:reduce){.oec *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}'
    ].join('');
    document.head.appendChild(style);

    fetch(SOURCE, { cache: 'no-store', credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Evidence source returned HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) { render(host, data); })
      .catch(function (error) {
        var message = el('div', 'oec-error',
          'The evidence source could not be loaded. No readiness state has been inferred. ' +
          String(error && error.message || 'Source unavailable'));
        host.replaceChildren(message);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();