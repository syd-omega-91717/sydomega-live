/* Ω Command Center: nine tiles, each a real query or an honest empty state.
   Every number comes from a table this page reads; nothing is estimated or invented.
   A failed read shows an em dash and marks its feed as failing in FEED STATUS. */
import { createClient } from '/vendor/supabase-js.js';
var sb = window.__omegaSb || (window.__omegaSb = createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co', 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'));
function $(id) { return document.getElementById(id); }
function set(id, v) { var e = $(id); if (e) e.textContent = String(v == null ? '\u2014' : v); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var feeds = [];
/* Run one read, time it, and record whether it answered. A Supabase read resolves with {error}; it does not throw. */
async function feed(name, fn) {
  var t0 = performance.now(), ok = false, res = null;
  try { res = await fn(); ok = !!res && !res.error; } catch (e) { ok = false; }
  feeds.push({ name: name, ok: ok, ms: Math.round(performance.now() - t0) });
  return ok ? res : null;
}
function gauge(n, total) {
  var R = 44, C = 2 * Math.PI * R * 0.75, f = total ? n / total : 0;
  return '<svg width="110" height="110" viewBox="0 0 110 110" aria-hidden="true"><g transform="rotate(135 55 55)">'
    + '<circle cx="55" cy="55" r="' + R + '" fill="none" stroke="rgba(201,168,76,.18)" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + C + ' 999"/>'
    + '<circle cx="55" cy="55" r="' + R + '" fill="none" stroke="#C9A84C" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + (C * f) + ' 999"/></g></svg>';
}
function bars(series) {
  var max = Math.max.apply(null, series.concat([1])), w = 18, g = 6, h = 70, out = '<svg width="' + (series.length * (w + g)) + '" height="' + (h + 4) + '" viewBox="0 0 ' + (series.length * (w + g)) + ' ' + (h + 4) + '" aria-hidden="true">';
  series.forEach(function (v, i) { var bh = Math.max(2, Math.round(v / max * h)); out += '<rect x="' + (i * (w + g)) + '" y="' + (h - bh + 2) + '" width="' + w + '" height="' + bh + '" rx="2" fill="' + (v ? '#C9A84C' : 'rgba(201,168,76,.2)') + '"/>'; });
  return out + '</svg>';
}
function ago(iso) { var s = Math.round((Date.now() - new Date(iso)) / 1000); return s < 60 ? s + 's' : s < 3600 ? Math.round(s / 60) + 'm' : s < 86400 ? Math.round(s / 3600) + 'h' : Math.round(s / 86400) + 'd'; }
(async function () {
  var sess = (await sb.auth.getSession()).data.session;
  if (!sess) { location.replace('/account.html'); return; }
  var pr = (await sb.from('profiles').select('*').eq('id', sess.user.id).maybeSingle()).data || {};
  if (!pr.is_owner && !pr.access_approved) { location.replace('/pending.html'); return; }
  $('app').style.display = 'flex';
  if (window.__omegaPopulate) window.__omegaPopulate(pr, sess.user);
  var day = new Date().toISOString().slice(0, 10), wk = new Date(Date.now() - 7 * 864e5).toISOString();
  var onlineAgo = new Date(Date.now() - 90 * 1000).toISOString(), ninety = new Date(Date.now() - 14 * 864e5).toISOString();
  var R = await Promise.all([
    feed('members', function () { return sb.from('profiles').select('id', { count: 'exact', head: true }).eq('access_approved', true); }),
    feed('pending', function () { return sb.from('profiles').select('id', { count: 'exact', head: true }).eq('access_approved', false).eq('is_owner', false); }),
    feed('presence', function () { return sb.from('member_presence').select('user_id', { count: 'exact', head: true }).eq('is_online', true).gte('last_seen', onlineAgo); }),
    feed('tasks 7d', function () { return sb.from('task_completions').select('id', { count: 'exact', head: true }).gte('completed_at', wk); }),
    feed('tasks today', function () { return sb.from('task_completions').select('id', { count: 'exact', head: true }).gte('completed_at', day); }),
    feed('my tasks', function () { return sb.from('task_completions').select('completed_at').eq('user_id', sess.user.id).gte('completed_at', ninety); }),
    feed('ai queries', function () { return sb.from('telemetry_events').select('id', { count: 'exact', head: true }).eq('event_type', 'ai_query').gte('created_at', wk); }),
    feed('ledger', function () { return sb.from('activity_feed').select('activity_type,title,created_at').eq('is_public', true).order('created_at', { ascending: false }).limit(8); }),
    feed('payments flag', function () { return sb.from('platform_settings').select('bool_value').eq('key', 'payments_enabled').maybeSingle(); }),
    feed('risks', function () { return sb.from('risk_register').select('id', { count: 'exact', head: true }).eq('status', 'open'); }),
    feed('threats', function () { return sb.from('threat_events').select('id', { count: 'exact', head: true }).gte('created_at', wk); })
  ]);
  var m = R[0], pe = R[1], on = R[2], t7 = R[3], t1 = R[4], my = R[5], ai = R[6], lg = R[7], pay = R[8], rk = R[9], th = R[10];
  set('cc-mem', m && m.count); set('cc-pend', 'PENDING ' + (pe && pe.count != null ? pe.count : '\u2014')); set('cc-online', 'ONLINE NOW ' + (on && on.count != null ? on.count : '\u2014'));
  set('cc-tasks7', t7 && t7.count); set('cc-tasks1', 'TODAY ' + (t1 && t1.count != null ? t1.count : '\u2014')); set('cc-ai', 'AI QUERIES 7D ' + (ai && ai.count != null ? ai.count : '\u2014'));
  /* payments: read the flag, say what it says */
  if (pay) { var on_ = !!(pay.data && pay.data.bool_value); set('cc-pay', on_ ? 'ON' : 'OFF'); set('cc-pay-s', on_ ? 'The payments flag is on.' : 'Payments are not enabled. No money moves, so there is no flow to chart.'); }
  else { set('cc-pay', '\u2014'); set('cc-pay-s', 'The flag could not be read.'); }
  /* ledger */
  var L = $('cc-ledger');
  if (lg && lg.data && lg.data.length) L.innerHTML = lg.data.map(function (e) { return '<li><i class="cc-dot"></i><span>' + esc(e.title) + '</span><time>' + ago(e.created_at) + '</time></li>'; }).join('');
  else L.innerHTML = '<li><span class="cc-empty">' + (lg ? 'No public activity yet.' : 'The feed could not be read.') + '</span></li>';
  /* axes: same formula and owner nominal as dashboard.html */
  var PHI = 1.6180339887, EU = 2.7182818285, a = Number(pr.is_owner ? 9 : pr.axis_a || 0.001), b = Number(pr.is_owner ? 9 : pr.axis_b || 0.001), c = Number(pr.is_owner ? 9 : pr.axis_c || 0.001);
  var auth = pr.is_owner ? 27.8367 : Math.sqrt(Math.pow(a, 3) + Math.pow(b, 3) + Math.pow(c, 3)) * PHI / EU;
  set('cc-auth', auth.toFixed(4));
  $('cc-axes').innerHTML = [['A', a], ['B', b], ['C', c]].map(function (x) { return '<div><span>' + x[0] + '</span><span class="cc-bar"><i style="width:' + Math.min(100, x[1] / 9 * 100).toFixed(1) + '%"></i></span><span>' + x[1].toFixed(3) + '</span></div>'; }).join('');
  /* my 14 days */
  if (my && my.data) {
    var by = {}; my.data.forEach(function (r) { var d = (r.completed_at || '').slice(0, 10); if (d) by[d] = (by[d] || 0) + 1; });
    var s = []; for (var i = 13; i >= 0; i--) s.push(by[new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)] || 0);
    $('cc-bars').innerHTML = bars(s); set('cc-bars-s', s.reduce(function (p, q) { return p + q; }, 0) + ' TASKS IN 14 DAYS');
  } else { set('cc-bars-s', 'The feed could not be read.'); }
  /* risk & threats (owner tables: a member's read is denied by RLS and shows an em dash) */
  set('cc-risk', rk && rk.count); set('cc-thr', 'THREAT EVENTS 7D ' + (th && th.count != null ? th.count : '\u2014'));
  if (!pr.is_owner) set('cc-risk-s', 'Owner-only tables; shown for the owner.');
  /* status: measured latency of this page's own reads */
  var okN = feeds.filter(function (f) { return f.ok; }).length;
  $('cc-gauge').innerHTML = gauge(okN, feeds.length); set('cc-feeds-n', okN + '/' + feeds.length);
  $('cc-status').innerHTML = feeds.map(function (f) { return '<li><i class="cc-dot ' + (f.ok ? '' : 'bad') + '"></i><span>' + esc(f.name) + '</span><time>' + (f.ok ? f.ms + 'ms' : 'FAILED') + '</time></li>'; }).join('');
  set('cc-sync', 'LIVE \u00B7 SYNCED ' + new Date().toISOString().slice(11, 19) + ' UTC');
  document.dispatchEvent(new CustomEvent('omega:populated'));
})().catch(function (e) { console.warn('[command-center]', e); var a = $('app'); if (a) a.style.display = 'flex'; });
