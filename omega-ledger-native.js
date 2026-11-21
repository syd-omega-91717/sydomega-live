import { createClient } from '/vendor/supabase-js.js';

const SUPABASE_URL = 'https://ydqhzvvoyufiiqvzcjns.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q';
const sb = window.__omegaSb || (window.__omegaSb = createClient(SUPABASE_URL, SUPABASE_KEY));
const PHI = 1.6180339887;
const EULER = 2.7182818285;
let assetRows = [];

const el = (id) => document.getElementById(id);

function showUnavailable() {
  const app = el('app');
  const panel = el('ledger-load-error');
  if (app) app.style.display = 'none';
  if (panel) panel.hidden = false;
}

function validAxes(profile) {
  const raw = [profile.axis_a, profile.axis_b, profile.axis_c];
  if (raw.some((value) => value === null || value === undefined || value === '')) return null;
  const axes = raw.map(Number);
  return axes.every((value) => Number.isFinite(value) && value >= 0 && value <= 9) ? axes : null;
}

function renderMatrix(profile) {
  const axes = validAxes(profile);
  const authValue = el('ov-auth');
  const nodeValue = el('ov-node');

  if (axes) {
    const auth = Math.sqrt(axes[0] ** 3 + axes[1] ** 3 + axes[2] ** 3) * PHI / EULER;
    authValue.textContent = auth.toFixed(3);
    authValue.dataset.truth = 'CALCULATED';
  } else {
    authValue.textContent = '—';
    authValue.dataset.truth = 'UNAVAILABLE';
  }

  const track = Number(profile.matrix_track);
  const phase = Number(profile.matrix_phase);
  const coordinateValid = Boolean(axes)
    && Number.isInteger(track) && track >= 1 && track <= 12
    && Number.isInteger(phase) && phase >= 1 && phase <= 12;

  if (!coordinateValid) {
    nodeValue.textContent = '—';
    nodeValue.dataset.truth = 'UNAVAILABLE';
    el('mx-track').textContent = '—';
    el('mx-phase').textContent = '—';
    el('mx-node').textContent = '—';
    return;
  }

  const axisA = Math.max(1, Math.min(9, Math.ceil(axes[0])));
  const axisB = Math.max(1, Math.min(9, Math.ceil(axes[1])));
  const axisC = Math.max(1, Math.min(9, Math.ceil(axes[2])));
  const node = ((track - 1) * 12 + (phase - 1)) * 729
    + (axisA - 1) * 81 + (axisB - 1) * 9 + axisC;

  nodeValue.textContent = node.toLocaleString();
  nodeValue.dataset.truth = 'CALCULATED';
  el('mx-track').textContent = String(track);
  el('mx-phase').textContent = String(phase);
  el('mx-node').textContent = node.toLocaleString() + ' / 104,976';
}

function renderAssets(rows) {
  const body = el('ledger-body');
  const count = el('entry-count');
  const all = assetRows;
  if (!body) return;

  if (count) count.textContent = all.length ? rows.length + ' OF ' + all.length + ' RECORDS' : '0 ENTRIES';
  body.replaceChildren();

  if (!rows.length) {
    const empty = document.createElement('div');
    empty.className = 'tbl-row';
    empty.style.cssText = 'display:block;text-align:center;padding:20px;color:var(--muted);font-family:var(--M);font-size:12px';
    empty.textContent = all.length
      ? 'NO USER-RECORDED ASSETS MATCH THIS SEARCH'
      : 'NO USER-RECORDED ASSETS. NO OWNERSHIP OR VALUATION IS INFERRED.';
    empty.setAttribute('role', 'status');
    body.appendChild(empty);
    return;
  }

  rows.forEach((asset) => {
    const row = document.createElement('div');
    row.className = 'tbl-row';
    row.style.gridTemplateColumns = '110px 1.5fr 1fr 100px 180px';

    const record = document.createElement('span');
    record.className = 'asset-id';
    record.textContent = String(asset.id || '').slice(0, 8).toUpperCase() || '—';

    const name = document.createElement('span');
    name.style.fontSize = '12px';
    name.style.color = 'var(--ink)';
    name.textContent = String(asset.name || 'UNNAMED USER RECORD');

    const type = document.createElement('span');
    type.style.cssText = 'font-family:var(--M);font-size:12px;color:var(--muted)';
    type.textContent = [asset.asset_type || 'UNSPECIFIED', asset.track_name || ''].filter(Boolean).join(' · ');

    const quantity = document.createElement('span');
    quantity.textContent = asset.quantity === null || asset.quantity === undefined ? '—' : String(asset.quantity);

    const evidence = document.createElement('span');
    evidence.className = 'status-pill pending';
    evidence.textContent = 'USER-RECORDED · NOT VERIFIED';

    row.append(record, name, type, quantity, evidence);
    body.appendChild(row);
  });
}

function renderAssetsUnavailable() {
  const body = el('ledger-body');
  if (el('entry-count')) el('entry-count').textContent = 'UNAVAILABLE';
  if (el('ov-assets')) el('ov-assets').textContent = '—';
  if (body) {
    body.textContent = 'ASSET RECORDS UNAVAILABLE · THE SOURCE COULD NOT BE VERIFIED.';
    body.setAttribute('role', 'status');
  }
}

window.setTab = function setTab(name) {
  document.querySelectorAll('.tab-btn').forEach((button, index) => {
    button.classList.toggle('active', ['overview', 'registry', 'matrix', 'science'][index] === name);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === 'tab-' + name);
  });
};

async function loadAssets(userId) {
  const result = await sb.from('user_assets')
    .select('id,name,quantity,asset_type,track_name')
    .eq('user_id', userId);

  if (result.error || !Array.isArray(result.data)) {
    renderAssetsUnavailable();
    return;
  }

  assetRows = result.data;
  el('ov-assets').textContent = String(assetRows.length);
  renderAssets(assetRows);
}

async function boot() {
  const authResult = await sb.auth.getSession();
  if (authResult.error) throw authResult.error;
  const session = authResult.data && authResult.data.session;
  if (!session) {
    window.location.href = '/account.html';
    return;
  }

  const profileResult = await sb.from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();
  if (profileResult.error) throw profileResult.error;
  const profile = profileResult.data;
  if (!profile) throw new Error('PROFILE_RECORD_UNAVAILABLE');

  if (!profile.is_owner && !profile.access_approved) {
    window.location.href = '/pending.html';
    return;
  }

  el('app').style.display = 'flex';
  if (window.__omegaPopulate) window.__omegaPopulate(profile, session.user);
  renderMatrix(profile);
  await loadAssets(session.user.id);

  const search = el('ledger-search');
  if (search) {
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      renderAssets(query
        ? assetRows.filter((asset) => [
          asset.id, asset.name, asset.asset_type, asset.track_name
        ].join(' ').toLowerCase().includes(query))
        : assetRows);
    });
  }
}

boot().catch((error) => {
  console.warn('Ledger profile unavailable:', error);
  showUnavailable();
});
