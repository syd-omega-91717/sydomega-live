import { createClient } from '/vendor/supabase-js.js';

const SUPABASE_URL = 'https://ydqhzvvoyufiiqvzcjns.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q';

const sb = window.__omegaSb || (window.__omegaSb = createClient(SUPABASE_URL, SUPABASE_KEY));

const root = document.querySelector('[data-cosmos-native-state]');
if (!root) throw new Error('COSMOS native state mount missing');

const esc = (value) => String(value ?? '—').replace(/[&<>"']/g, (c) => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function render(state, payload = {}) {
  const labels = {
    LIVE: 'LIVE',
    EMPTY: 'EMPTY',
    UNAVAILABLE: 'UNAVAILABLE'
  };
  root.dataset.truth = state;
  root.innerHTML = `
    <div class="cosmos-native-head">
      <div>
        <div class="cosmos-native-kicker">CANONICAL MEMBER COSMOS STATE</div>
        <h2>YOUR COSMOS POSITION</h2>
      </div>
      <span class="cosmos-native-truth cosmos-native-${state.toLowerCase()}">${labels[state]}</span>
    </div>
    <div class="cosmos-native-grid">
      <div><span>IDENTITY</span><strong>${esc(payload.display_name || 'MEMBER')}</strong></div>
      <div><span>SIGN</span><strong>${esc(payload.sign)}</strong></div>
      <div><span>ELEMENT</span><strong>${esc(payload.element)}</strong></div>
      <div><span>AXIS A</span><strong>${esc(payload.axis_a)}</strong></div>
      <div><span>AXIS B</span><strong>${esc(payload.axis_b)}</strong></div>
      <div><span>AXIS C</span><strong>${esc(payload.axis_c)}</strong></div>
    </div>
    <p class="cosmos-native-note">${state === 'LIVE'
      ? 'Projected from the authenticated member profile. No synthetic cosmology state is created by this workspace.'
      : state === 'EMPTY'
        ? 'The authenticated profile exists, but no complete canonical Cosmos projection is available.'
        : 'Canonical Cosmos state could not be read in this session.'}</p>`;
}

render('UNAVAILABLE');

try {
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();
  if (sessionError || !sessionData?.session?.user?.id) {
    render('UNAVAILABLE');
  } else {
    const { data: profile, error } = await sb
      .from('profiles')
      .select('sign,axis_a,axis_b,axis_c,element,display_name')
      .eq('id', sessionData.session.user.id)
      .maybeSingle();

    if (error) {
      render('UNAVAILABLE');
    } else if (!profile) {
      render('EMPTY');
    } else {
      const hasCanonicalProjection = [profile.sign, profile.axis_a, profile.axis_b, profile.axis_c, profile.element]
        .every((value) => value !== null && value !== undefined && value !== '');
      render(hasCanonicalProjection ? 'LIVE' : 'EMPTY', profile);
    }
  }
} catch {
  render('UNAVAILABLE');
}
