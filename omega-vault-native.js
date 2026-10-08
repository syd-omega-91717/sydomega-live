/* Ω SYD OMEGA 91717 — VAULT native state projection
 * Read-only projection. No balance creation, no token minting, no financial mutation.
 * Truth states: LIVE / CALCULATED / PLANNED / EMPTY / UNAVAILABLE.
 */
import { createClient } from '/vendor/supabase-js.js';

const SUPABASE_URL = 'https://ydqhzvvoyufiiqvzcjns.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q';

const sb = window.__omegaSb || (window.__omegaSb = createClient(SUPABASE_URL, SUPABASE_KEY));

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function state(label, detail, kind) {
  return '<div class="vault-native-state vault-native-' + kind.toLowerCase() + '">' +
    '<span class="vault-native-dot" aria-hidden="true"></span>' +
    '<span><strong>' + escapeHtml(label) + '</strong><small>' + escapeHtml(detail) + '</small></span>' +
    '</div>';
}

function render(target, model) {
  target.innerHTML =
    '<div class="vault-native-head">' +
      '<div><div class="vault-native-kicker">CANONICAL VAULT PROJECTION</div>' +
      '<h2>SOVEREIGN FINANCIAL STATE</h2></div>' +
      '<div class="vault-native-legend">READ-ONLY · PROVENANCE-FIRST</div>' +
    '</div>' +
    '<div class="vault-native-grid">' +
      state('ACCESS', model.access, model.accessKind) +
      state('PROFILE', model.profile, model.profileKind) +
      state('EARNINGS', model.earnings, model.earningsKind) +
      state('NFT RECORD', model.nfts, model.nftsKind) +
      state('TOKEN LEDGER', 'No governed token ledger is active; no balance is claimed.', 'PLANNED') +
      state('SOVEREIGN RESERVE', 'Reserve figures remain design/planning data; no authoritative financial balance is exposed here.', 'PLANNED') +
    '</div>' +
    '<div class="vault-native-boundary">' +
      '<strong>TRUTH BOUNDARY</strong>' +
      '<span>AUTHORITY is calculated from the established profile axes. Reserve, token, dividend and wealth claims are not promoted to LIVE without a governed canonical ledger.</span>' +
    '</div>';
}

async function load() {
  const target = document.querySelector('[data-vault-native-state]');
  if (!target) return;

  try {
    const sessionResult = await sb.auth.getSession();
    const session = sessionResult && sessionResult.data && sessionResult.data.session;
    if (!session) {
      render(target, {
        access: 'Authentication required.', accessKind: 'UNAVAILABLE',
        profile: 'No authenticated member profile available.', profileKind: 'UNAVAILABLE',
        earnings: 'No member earnings projection available.', earningsKind: 'UNAVAILABLE',
        nfts: 'No member NFT projection available.', nftsKind: 'UNAVAILABLE'
      });
      return;
    }

    const profileResult = await sb.from('profiles')
      .select('id,display_name,is_owner,access_approved,is_trial,trial_expires_at,axis_a,axis_b,axis_c')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileResult.error) {
      render(target, {
        access: 'Access state could not be verified.', accessKind: 'UNAVAILABLE',
        profile: 'Canonical profile query failed.', profileKind: 'UNAVAILABLE',
        earnings: 'Member earnings query not attempted.', earningsKind: 'UNAVAILABLE',
        nfts: 'Member NFT query not attempted.', nftsKind: 'UNAVAILABLE'
      });
      return;
    }

    const profile = profileResult.data;
    const accessApproved = !!(profile && (profile.is_owner || profile.access_approved));
    const accessKind = accessApproved ? 'LIVE' : 'EMPTY';
    const profileComplete = !!(profile && [profile.axis_a, profile.axis_b, profile.axis_c].every(v => v !== null && v !== undefined));
    const profileKind = profileComplete ? 'LIVE' : (profile ? 'EMPTY' : 'UNAVAILABLE');

    let earningsKind = 'UNAVAILABLE';
    let earningsText = 'Member task-completion data is unavailable.';
    const tasks = await sb.from('task_completions')
      .select('id,points_earned,completed_at')
      .eq('user_id', session.user.id)
      .limit(200);

    if (!tasks.error) {
      earningsKind = tasks.data && tasks.data.length ? 'LIVE' : 'EMPTY';
      earningsText = tasks.data && tasks.data.length
        ? tasks.data.length + ' authenticated task-completion records observed.'
        : 'No authenticated task-completion records observed.';
    }

    let nftsKind = 'UNAVAILABLE';
    let nftsText = 'Member NFT data is unavailable.';
    const nfts = await sb.from('user_assets')
      .select('id,asset_type,created_at')
      .eq('user_id', session.user.id)
      .eq('asset_type', 'nft')
      .limit(200);

    if (!nfts.error) {
      nftsKind = nfts.data && nfts.data.length ? 'LIVE' : 'EMPTY';
      nftsText = nfts.data && nfts.data.length
        ? nfts.data.length + ' authenticated NFT asset records observed.'
        : 'No authenticated NFT asset records observed.';
    }

    render(target, {
      access: accessApproved ? 'Authenticated member access is verified.' : 'Authenticated profile exists, but approved access is not present.',
      accessKind,
      profile: profileComplete ? 'Canonical profile axes A/B/C are present.' : 'Canonical profile exists but its authority axes are incomplete.',
      profileKind,
      earnings: earningsText,
      earningsKind,
      nfts: nftsText,
      nftsKind
    });
  } catch (error) {
    console.warn('vault native state unavailable:', error);
    render(target, {
      access: 'Vault state is unavailable.', accessKind: 'UNAVAILABLE',
      profile: 'Canonical profile state is unavailable.', profileKind: 'UNAVAILABLE',
      earnings: 'Member earnings state is unavailable.', earningsKind: 'UNAVAILABLE',
      nfts: 'Member NFT state is unavailable.', nftsKind: 'UNAVAILABLE'
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', load);
} else {
  load();
}
