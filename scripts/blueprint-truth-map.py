#!/usr/bin/env python3
"""
Classify every point of the owner's 999-point blueprint against this repo, and
write the result into docs/OMEGA_999_CONCEPT_REGISTRY.json as `ledger_status` +
`evidence` (read by scripts/idea-ledger.py).

WHY THIS EXISTS

The blueprint's own closing "audit" declares 999/999 points active, and its
verification code proves it with `def is_mapped(point): return True`. That is
the exact failure this repo's gates exist to stop: a status asserted by the
thing being measured. Here every point gets one of the ledger's statuses, and
each status names its reason:

  SHIPPED / PARTIAL  a real version exists; evidence names the file.
  PROPOSED           buildable on this stack, within the law, with members'
                     consent; not built yet. The build queue.
  NEEDS_DECISION     buildable only with the owner's call and, for money,
                     securities / money-transmission / licensing counsel.
                     Tokens ship dormant (platform_settings.tokens_enabled).
  RND_OR_LORE        needs technology that does not exist, or is a narrative
                     milestone with no engineering content.
  REJECTED           will not be built: evades law, tax, sanctions or courts;
                     manipulates markets or members; attacks third parties;
                     surveils or scores people without consent; makes medical
                     claims; or removes human review of the system itself.

The 8 points whose numbers occur twice in the source (100-104, 112, 113, 133)
were silently dropped by the 2026-10-04 extraction, which keyed on the number;
they are restored here as entries with an `id`. The 14 appendix "Node NNN"
items were never extracted at all; they are added with ids N089..N999.

  python3 scripts/blueprint-truth-map.py           # write the registry
  python3 scripts/blueprint-truth-map.py --check   # exit 1 if any point lacks a
                                                   # status or the file differs

Re-run after changing a decision below; then python3 scripts/idea-ledger.py.
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY = os.path.join(ROOT, 'docs', 'OMEGA_999_CONCEPT_REGISTRY.json')
REGISTER = os.path.join(ROOT, 'docs', 'OMEGA_999_POINT_SOURCE_REGISTER.json')

WHY = {
    'impossible': 'needs technology that does not exist (orbital/lunar/Mars infrastructure, DNA, neural or '
                  'photonic interfaces, molecular manufacturing, life extension)',
    'lore': 'narrative milestone or "lock" with no engineering content',
    'evade': 'designed to evade law, tax, sanctions, courts or regulators: will not be built',
    'market': 'market manipulation, front-running, cornering or predation on third parties: will not be built',
    'manipulate': 'manipulates, surveils or covertly profiles members without informed consent: will not be built',
    'discriminate': 'decides credit, access or worth by astrology, biology or "loyalty": discriminatory, will not be built',
    'attack': 'offensive action against third parties\' systems or devices: illegal, will not be built',
    'health': 'medical monitoring, diagnosis or treatment claims on special-category data: will not be built',
    'autonomy': 'removes human review of the system or its owner\'s decisions; conflicts with CLAUDE.md §10 and with '
                'the blueprint\'s own point 5 (owner control): will not be built',
    'punish': 'punitive confiscation, lockout or demotion of members without due process: will not be built',
    'mislead': 'presents a model output, rank or certificate as certain truth or a legal deed: misleads members '
               '(CLAUDE.md §8.1 class 9)',
    'eugenics': 'selection of people by "biological superiority": will not be built',
    'unlicensed': 'unlicensed lending, insurance or stablecoin issuance: will not be built as framed',
    'money': 'money: needs the owner\'s decision and securities / money-transmission counsel; tokens ship dormant '
             '(platform_settings.tokens_enabled=false, supabase/omega_tokens.sql)',
    'family': 'family/minor data: needs the owner\'s decision and a privacy review (family.html holds the real roles)',
    'succession': 'succession is a legal instrument plus a second owner account; only 1 owner account exists live '
                  '(GAP_ANALYSIS.md S)',
}

# (status, reason-key or literal evidence) per point. A literal evidence string
# is used when it does not match a WHY key.
R, L, D, P, Q, S = 'REJECTED', 'RND_OR_LORE', 'NEEDS_DECISION', 'PARTIAL', 'PROPOSED', 'SHIPPED'


def many(status, why, *points):
    return {p: (status, why) for p in points}


class _OnceMap(dict):
    """A point decided twice means one decision is silently lost; refuse it."""
    def update(self, other):
        for k, v in other.items():
            if k in self:
                raise SystemExit('point %s classified twice (%s, then %s)' % (k, self[k][0], v[0]))
            self[k] = v


MAP = _OnceMap()
MAP.update(many(L, 'impossible', 2, 7, 9, 14, 33, 65, 72, 82, 83, 85, 96, 105, 106, 111, 116, 117, 118, 120, 125,
                145, 150, 189, 212, 215, 220, 255, 265, 267, 268, 270, 323, 350, 356, 367, 368, 370, 378, 380, 385,
                389, 395, 403, 450, 478, 482, 485, 495, 505, 545, 556, 560, 567, 568, 569, 578, 580, 595, 601, 602,
                603, 605, 612, 615, 620, 623, 628, 640, 645, 678, 689, 701, 702, 703, 705, 712, 715, 720, 723, 728,
                734, 735, 748, 755, 760, 801, 834, 835, 836, 840, 845, 848, 850, 856, 867, 868, 871, 875, 878, 880,
                885, 889, 905, 912, 920, 934, 936, 940, 945, 948, 950, 978, 980, 985, 534, 535))
MAP.update(many(L, 'lore', 25, 26, 27, 28, 29, 74, 75, 93, 94, 97, 98, 99, 200, 233, 300, 333, 400, 433, 466, 500,
                533, 566, 589, 600, 633, 656, 666, 670, 682, 700, 733, 736, 766, 770, 785, 800, 820, 866, 900, 933,
                956, 966, 967, 975, 989, 995, 999, 588))
MAP.update(many(R, 'evade', 8, 71, 87, 103, 115, 123, 434, 435, 436, 440, 448, 460, 536, 540, 636))
MAP.update(many(R, 'market', 67, 68, 69, 70, 100, 102, 104, 124, 126, 178, 185, 202, 203, 302, 334, 335, 336, 340,
                348, 570, 740, 133))
MAP.update(many(R, 'manipulate', 64, 167, 169, 170, 180, 345, 355, 360, 369, 388, 515, 548, 550, 555, 585, 667, 669,
                680, 685, 767, 768, 778, 780, 782, 789, 802, 812, 823, 833, 860, 901, 902, 903, 915, 923, 928, 960))
MAP.update(many(R, 'discriminate', 40, 112))
MAP.update(many(R, 'attack', 467, 468, 469, 470, 489))
MAP.update(many(R, 'health', 155, 401, 402, 405, 412, 415, 420, 422, 423, 428))
MAP.update(many(R, 'autonomy', 91, 635, 935))
MAP.update(many(R, 'punish', 45, 95, 445, 456, 660))
MAP.update(many(R, 'mislead', 22, 59, 80, 88, 295, 795))
MAP.update(many(R, 'eugenics', 895))
MAP.update(many(R, 'unlicensed', 113, 114))
MAP.update({315: (R, 'multi-level commission on a recruit\'s trades for 99 years: a pyramid structure, will not be built'),
            502: (R, 'claims ownership of members\' own creative work: will not be built'),
            305: (D, 'money')})
MAP.update(many(D, 'money', 34, 35, 36, 37, 38, 39, 41, 42, 46, 48, 51, 52, 60, 61, 76, 90, 101, 201, 204, 223, 228,
                244, 266, 289, 299, 301, 303, 304, 312, 318, 320, 328, 523, 650, 805))
MAP.update(many(D, 'family', 15, 55, 455, 528))
MAP.update(many(D, 'succession', 73, 652, 969))
MAP.update({
    166: (D, 'provenance marks on exported share cards are buildable; covert per-member tracing is surveillance — owner call'),
    66: (D, 'visible provenance on exports is buildable; a steganographic layer tracing members is surveillance — owner call'),
})
MAP.update({
    12: (P, 'family.html holds family roles and members; no "priority" engine'),
    16: (P, 'matrix.html renders the 9x9x9 = 729-node matrix from profiles.axis_a/b/c (matrix.html:266, :536)'),
    234: (P, 'matrix.html: three axes (Knowledge, Mastery, Contribution) to depth 9 = 729 nodes (matrix.html:389)'),
    235: (P, 'matrix.html axis A (Knowledge); numeracy curriculum not built'),
    236: (P, 'matrix.html axis B (Mastery); agent-delegation lessons not built'),
    237: (P, 'matrix.html axis C (Contribution); birth-sync harmonisation is lore'),
    19: (P, 'omega-copilot.js + supabase/functions/concierge turn a goal into a plan; nothing executes purchases'),
    77: (P, 'copilot plans the path (school, cost, steps); it does not enrol or pay — and must not without consent'),
    278: (P, 'copilot answers intent with a plan; agents do not transact'),
    280: (P, 'copilot drafts roadmaps; no "100% guarantee" will be claimed (CLAUDE.md §8.1 class 9)'),
    501: (P, 'the copilot is the delegation surface; judgments stay advisory'),
    21: (P, 'honors.html awards bronze/silver/gold tier badges (honors.html:13, :58); badges unlock no commissions'),
    260: (P, 'honors.html bronze/silver/gold tiers; mapping tiers to the 9 stages is PROPOSED (N238)'),
    89: (P, 'profiles.membership_tier carries the member\'s tier across pages (OmegaCanon.tierUnlocks)'),
    23: (P, 'academy.html records exams as task_completions (academy.html:913)'),
    130: (P, 'courses.html / academy.html teach for free inside the platform; no "loyal workforce" goal'),
    24: (P, 'the element system is canon (omega-canon.js); it themes the UI, it does not "balance logic"'),
    30: (P, 'imagery is procedural SVG/canvas generated from code (image-pipeline skill), so the code is the source'),
    32: (P, 'palette tokens live once in css/omega-system.css + theme.js (CLAUDE.md §4); no per-pixel history'),
    44: (P, 'forge.html runs FORGE TRIALS; bounties and arena fees are money -> owner decision'),
    47: (P, 'security is RLS on every table, CSP, secret and service-role scans (CLAUDE.md §5, §7); no IP blacklists or orbital nodes'),
    49: (P, 'chronicle.html is the member timeline; docs/IDEA_LEDGER.md is the idea archive'),
    50: (P, 'academy.html / courses.html / flashcard.html are the Tutor surfaces'),
    53: (P, 'horoscope.html renders sign profiles; "lucky windows" are entertainment, not advice'),
    54: (P, 'the web-trend-scout skill researches competitors into grounded proposals; no mirroring or sniping'),
    56: (P, 'contract suite (41 gates) + the weekly idea routine propose changes as draft PRs; nothing self-applies'),
    57: (P, 'omega-onboard.js runs onboarding; honors.html issues badges'),
    58: (P, 'dashboard.html owner panels (FinOps, approvals) are the command view; agents are personas (CLAUDE.md §6)'),
    63: (P, 'i18n.js + 6 packs incl. i18n/ar.json at 100% of T_EN (scripts/i18n-contract.py)'),
    81: (P, 'i18n packs translate the UI; tone-preserving translation of the owner\'s writing is not built'),
    78: (P, 'omega-backdrop.js tints every page to the member\'s element (CLAUDE.md §4); no emotional inference'),
    79: (P, 'ascension.html shows stage progression; no psychological "nudging"'),
    86: (P, 'dashboard.html owner FinOps summary (FEATURE_IDEAS 12); no member-movement heatmap'),
    695: (P, 'dashboard.html owner panels; no mood maps of people'),
    92: (P, 'CI and ci-local.sh block a release on any failing gate; public functions are not paused at runtime'),
    968: (P, 'contract suite + weekly idea routine re-audit every week'),
    245: (S, 'decisions.html EXPECTED VALUE framework: weight = benefit x probability per option, highest named (renderEVResult); verified in Chromium 2026-10-12'),
    250: (S, 'flashcard.html implements SM-2 spaced repetition: reviews scheduled at the forgetting curve (flashcard.html:125, :202)'),
    256: (P, 'academy.html / credentials.html show certificates; private.omega_issue_certificate is callable (20261012091641) but no page calls it'),
    269: (P, 'the copilot keeps per-member memory (ai_memory, read by omega-life-surface.js); no "permanent context of why"'),
    285: (P, 'command.html TODAY joins 9 modules into one daily view (FEATURE_IDEAS 38)'),
    366: (P, 'owner actions require aal2 MFA (approvals.js step-up, settings.html#two-factor); passkeys not built'),
    503: (P, 'the honesty-label system marks what is real vs illustrative on every page (FEATURE_IDEAS 13)'),
    634: (P, 'rollback = git revert + Vercel redeploy + forward migration; database point-in-time restore needs Supabase Pro (owner)'),
    750: (P, 'chronicle.html keeps the member\'s personal timeline'),
    756: (P, 'every member already gets a sigil generated from a hash (profile.html, FEATURE_IDEAS 10); a "star coordinate" is the same idea'),
    803: (P, 'command.html TODAY shows what is due across modules (FEATURE_IDEAS 38); no predictive "time loans"'),
    815: (P, 'focus.html and time.html run deep-work / pomodoro sessions'),
    6: (P, 'scripts/brand-glyph-check.py fails CI on U+1F531 (inside its U+1F300-1F64F range) in any shipped file; member input is not policed'),
})
MAP.update({  # mapped by hand 2026-10-12 (first ledger batch), kept verbatim
    1: (P, 'code-level ownership is profiles.is_owner + is_platform_owner() (CLAUDE.md §1); legal title is outside code'),
    3: (D, 'money: tokens ship dormant, platform_settings.tokens_enabled=false (supabase/omega_tokens.sql); stake overclaims were removed (GAP_ANALYSIS.md 4.17-4.19)'),
    4: (D, 'money: no exchange exists; same dormant token flag as point 3'),
    5: (P, 'the autonomous pipeline never merges to main and never flips a flag (CLAUDE.md §10); the weekly idea routine opens draft PRs only'),
    10: (P, 'web-trend-scout skill + weekly idea routine produce proposals; no 10-per-competitor-release rule'),
    11: (P, '41-gate contract suite + CI audits run on every change; not an idle-cycle agent'),
    13: (D, 'billing: a $0 family exception touches Stripe (supabase/functions/checkout); owner and legal call'),
    17: (P, "horoscope.html renders 12 sign profiles from the member's sign; no natal-chart mapping"),
    20: (P, 'private.omega_issue_certificate callable since migration 20261012091641, but no page calls it (grep 2026-10-12)'),
})
MAP.update({
    18: (Q, 'opt-in interests on the profile that pick metaphors and examples; never covert text analysis'),
    31: (Q, 'a gate that rejects generic asset names (image1, IMG_1234) under assets/'),
    43: (Q, 'play-money crash simulator on historical series (1929, 2008, 2020): teaching, never real trades'),
    745: (Q, 'same simulator: compare the member\'s plan against 1929 / 2008 / 2020 side by side'),
    62: (Q, 'log questions the copilot could not answer (opt-in, no content kept beyond review) so the owner can fill gaps'),
    283: (Q, 'same unanswered-question log, reviewed weekly; HIGH-RISK pipeline (new table)'),
    84: (Q, 'offline queue: actions taken offline replay on reconnect through sw.js, each write checked for .error'),
    168: (Q, 'member-chosen information density (simple / dense) in settings; never covert adaptation'),
    195: (Q, 'opt-in study circles grouped by stage'),
    248: (Q, 'timed decision drills in the Dojo with play money'),
    512: (Q, '"productive struggle" exercises in academy.html that need reasoning, not lookup'),
    520: (Q, 'cross-subject links between academy lessons (one principle, several domains)'),
    668: (Q, 'community puzzles members choose to solve, disclosed as such'),
    769: (Q, 'private reflection journal: the member writes what went wrong, the copilot suggests lessons'),
    828: (Q, 'opt-in micro-lessons: flashcard reviews offered in short idle moments, never pushed'),
})

APPENDIX = [
    ('N089', 89, 'Quantum-Transition Kernel', L, 'impossible'),
    ('N093', 93, 'Bio-Digital Sync', L, 'impossible'),
    ('N097', 97, 'Sovereign Chronos (own clock, no NTP)', L, 'impossible'),
    ('N142', 142, 'Primary Beneficiary Hard-Code (family as Level-0 users)', D, 'family'),
    ('N155', 155, 'Multi-Generational Trust Lock (trust enclaves)', D, 'succession'),
    ('N212', 212, 'Birth-Date/Horoscope Logic (sign-themed tools)', P, 'horoscope.html sign profiles; theming by sign is fine, gating by sign is not'),
    ('N238', 238, 'The Mastery Promotion Trigger (stage -> sticker + certificate)', Q, 'on a stage promotion, award the honors.html badge and issue the certificate via the already-callable private.omega_issue_certificate'),
    ('N250', 250, 'Unified Need Fulfillment (meet every need inside the platform)', P, 'copilot + command.html TODAY; keeping members inside is not a goal'),
    ('N518', 518, 'Regulatory Chameleon Masking ("compliance skins")', R, 'evade'),
    ('N532', 532, 'Bankruptcy/Loss Immunity (anti-dilution into ghost nodes)', R, 'unlicensed'),
    ('N545', 545, 'Private Mesh-Trading over Bluetooth/radio', L, 'impossible'),
    ('N788', 788, 'The 10-Step Foresight Engine', P, 'web-trend-scout + the weekly idea routine scan for ideas; nothing auto-releases'),
    ('N812', 812, 'Self-Healing Malware Purge', L, 'impossible'),
    ('N999', 999, 'The Omega Absolute (bypass external instructions)', R, 'autonomy'),
]
DUP_FIRST = {100: (L, 'impossible'), 101: (L, 'impossible'), 102: (L, 'impossible'), 103: (L, 'impossible'),
             104: (L, 'impossible'), 112: (L, 'impossible'), 113: (L, 'impossible'),
             133: (R, 'mislead')}

MISSING_EVIDENCE = ('the owner re-supplied the full blueprint text on 2026-10-12; it is the same 1,231-line source '
                    'indexed 2026-10-04 and numbers 391 unique points (+8 repeated numbers, +14 appendix Nodes). '
                    'The other 608 numbers do not occur in it, so they are not extracted and will not be invented.')


def ev(why):
    return WHY.get(why, why)


def build():
    reg = json.load(open(REGISTRY, encoding='utf-8'))
    src = json.load(open(REGISTER, encoding='utf-8'))
    keep = {e['point']: e for e in reg['entries'] if 'id' not in e}
    for p, e in keep.items():
        # MAP is the only source: a status edited into the registry by hand is
        # discarded, so a point MAP does not decide reads as unmapped.
        e.pop('ledger_status', None)
        e.pop('evidence', None)
        if p in MAP:
            status, why = MAP[p]
            e['ledger_status'], e['evidence'] = status, ev(why)
    seen = {}
    extra = []
    for row in src['points']:
        n = row['point']
        seen[n] = seen.get(n, 0) + 1
        if seen[n] == 1 and n in DUP_FIRST and keep[n]['source_text'] != row['text']:
            status, why = DUP_FIRST[n]
            extra.append({'id': 'B%03d-IV' % n, 'point': n, 'source_text': row['text'],
                          'class': 'INTERSTELLAR', 'status': 'RESTORED_DUPLICATE_NUMBER',
                          'ledger_status': status, 'evidence': ev(why)})
    for iid, n, title, status, why in APPENDIX:
        extra.append({'id': iid, 'point': n, 'source_text': title, 'class': 'APPENDIX_NODE',
                      'status': 'APPENDIX_NODE', 'ledger_status': status, 'evidence': ev(why)})
    entries = [keep[p] for p in sorted(keep)] + extra
    reg['entries'] = entries
    reg['missing_points_status'] = 'DECIDED'
    reg['missing_points_evidence'] = MISSING_EVIDENCE
    unmapped = [e['point'] for e in entries if not e.get('ledger_status')]
    return reg, unmapped


def main(argv):
    reg, unmapped = build()
    text = json.dumps(reg, indent=2, ensure_ascii=False) + '\n'
    if unmapped:
        print('ERROR unmapped points:', unmapped)
    if '--check' in argv:
        same = open(REGISTRY, encoding='utf-8').read() == text
        if not same:
            print('ERROR docs/OMEGA_999_CONCEPT_REGISTRY.json differs: run python3 scripts/blueprint-truth-map.py')
        print('BLUEPRINT TRUTH MAP: %s — %d entries' % ('PASS' if same and not unmapped else 'FAIL', len(reg['entries'])))
        return 0 if same and not unmapped else 1
    if unmapped:
        return 1
    with open(REGISTRY, 'w', encoding='utf-8') as fh:
        fh.write(text)
    print('wrote docs/OMEGA_999_CONCEPT_REGISTRY.json — %d entries' % len(reg['entries']))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
