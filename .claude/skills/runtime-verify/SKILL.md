---
name: runtime-verify
description: Verify a change to sydomega-live at runtime — render the real capability entrypoints in a headless browser with scripts/verify-runtime.js — and keep docs/capabilities/registry.json honest. Use after any change to bg.js, nav.js, an omega-*.js module, page markup, or a page's data layer, and whenever promoting a capability's status or updating its contract.
---

# RUNTIME VERIFY

## The two tools

1. **`node scripts/verify-runtime.js`** — renders every capability entrypoint
   (`account`, `profile`, `dashboard`, `feed`, `family`, `social`, `approvals`,
   `search`, `roadmap`, `ops`, `analytics`, `vault`, `settings`) in headless
   Chrome/Edge and asserts what `node --check` and `audit.py` cannot see:
   the page loads, the approval guard lifts with a valid stubbed session,
   nothing throws, no horizontal overflow, no duplicate id — plus an advisory
   a11y pass (missing `<main>`, sub-24px tap targets, unlabelled inputs).
   - `--pages a.html,b.html` to scope · `--all` for every page · `--json`
   - Zero repo deps: resolves `playwright-core` from `$OMEGA_SCRATCHPAD` or a
     global install and prints `SKIPPED` (exit 0) when neither it nor a system
     browser is present. Blocking step in `.github/workflows/capability-evidence.yml`,
     advisory in `scripts/ci-local.sh --all`.

### `SKIPPED` is usually a layout mismatch, not a missing browser

Two sessions in a row wrote this verifier off as unrunnable here and fell back
to an ad-hoc harness. Don't — this one asserts the §10 capability contracts; an
ad-hoc script does not. The browser IS installed, under different paths than the
bundled `playwright-core` revision expects.

Ask it what it wants rather than reading the error, which truncates the path:

```sh
node -e "console.log(require('\$OMEGA_SCRATCHPAD/node_modules/playwright-core').chromium.executablePath())"
```

Observed here: it wants `chromium-1234/chrome-linux64/chrome` and
`chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell`,
while `/opt/pw-browsers` ships `chromium-1194/chrome-linux/chrome` and a headless
binary named `headless_shell`. Three differences at once: revision, `linux` vs
`linux64`, and the binary name. Bridge all three with symlinks onto the installed
build (`/opt/pw-browsers` is writable):

```sh
for pair in "chromium-1234/chrome-linux64:chromium-1194/chrome-linux" \
            "chromium_headless_shell-1234/chrome-headless-shell-linux64:chromium_headless_shell-1194/chrome-linux"; do
  dst=/opt/pw-browsers/${pair%%:*}; src=/opt/pw-browsers/${pair##*:}
  mkdir -p "$dst"; for f in "$src"/*; do ln -sf "$f" "$dst/$(basename "$f")"; done
done
ln -sf /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
       /opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
OMEGA_SCRATCHPAD=<scratchpad> node scripts/verify-runtime.js
```

Confirm with `chromium.launch()` directly before blaming the verifier. The
revision number moves with `playwright-core`, so re-read it rather than copying
`1234` from here.
   - Reuses `.claude/skills/verify-in-browser/harness/sbstub.js` for the
     signed-in stub. All the `verify-in-browser` gotchas apply (esm.sh, the
     four overlays, blocked CDNs). Its `BENIGN` list suppresses the known
     sandbox-only throws (`applyStyles`, `L.map`, `THREE`, arxiv CORS) —
     extend it, don't fight them.

2. **`docs/capabilities/registry.json`** — 15 capabilities, each with a
   six-part `contract` (entrypoint · data_contract · authorization ·
   failure_path · static_evidence · live_verification). `scripts/capability-audit.py
   --check` enforces the shape (blocking in CI): all six keys present and
   non-placeholder; a `failure_path` starting `GAP`/`WEAK`/`MISSING` may not
   sit above `PARTIAL`; `verified: true` is rejected while `live_verification`
   reads `BLOCKED`.

## Workflow for a change

1. Make the change.
2. `node --check` every touched `.js`; `python3 scripts/check-inline-js.py`.
3. `OMEGA_SCRATCHPAD=<scratch> node scripts/verify-runtime.js --pages <the pages
   your change touches>` — before **and** after. A `FAIL` line is a real
   render bug; an `~ a11y` line is advisory and tracked as the `accessibility`
   capability, not gating.
4. If the change touched `bg.js` / `nav.js` / a platform-wide module, run
   `--all` and compare the failing-page count against the pre-change run.
5. `python3 scripts/audit.py` — no new CRITICAL.

## Workflow for a capability status change

Never raise a capability's `status` or `confidence`, or set `verified: true`,
without the evidence to back it:

- **Above `PARTIAL`** requires a real, named `failure_path` — not "GAP: …".
  If the page still silently swallows a write, it stays `PARTIAL` and the
  contract says exactly which call.
- **`live_verification`** is honest about provider access. After a
  `verify-runtime.js` pass, write `runtime-verified <date> via
  scripts/verify-runtime.js (headless render, stubbed session): …`. Keep
  `BLOCKED — no provider access` for anything that needs a live Supabase
  DB/auth or a live deploy — a browser render with a stubbed client proves
  the client is wired, nothing about production RLS/grants (`CLAUDE.md` §8.4:
  "do not let a green matrix stand in for a live check").
- **`verified: true`** requires a real production DB/deploy check on record,
  with a date. It is currently `false` for every capability.
- Regenerate nothing — `registry.json` is hand-edited; `capability-audit.py
  --check` and `scripts/release-gate.py` gate it. After editing, run both.

## When a runtime failure is real vs. sandbox noise

- **Real**: `page did not render`, `approval guard never lifted` on a page a
  member should see, `horizontal overflow`, `duplicate ids`, an uncaught
  `TypeError` in the page's own code (e.g. reading `window.OmegaSupabase?.sb`
  before it exists — `CLAUDE.md` §8.1 class 4; found and fixed on 6 pages by
  this harness). Fix it, re-verify, record it in `FIXES_LOG.md`.
- **Not real**: anything matching `BENIGN` — d3/Leaflet/three.js from blocked
  CDNs (`CLAUDE.md` §8.4), esm.sh, CSP violations for third-party scripts,
  public-API CORS (arxiv, wikipedia — a product limitation needing an Edge
  Function proxy, not a source fix). `owner-gated` pages (`approvals.html`)
  correctly keep `#app` hidden for the member stub — that is the gate working.

## Guardrails

- The harness is not a substitute for a live DB check. It stubs Supabase.
- Do not add a repo dependency to make it run — the scratchpad/skip pattern
  is deliberate (`vercel.json` disables install/build).
- Do not suppress a real failure by widening `BENIGN` — add the page to a
  tracked list or fix it.
- An advisory a11y finding is not a reason to block a merge, but it is a
  reason to update the `accessibility` capability contract.
