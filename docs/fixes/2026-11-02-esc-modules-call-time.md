### Last 32 escaper copies gone: modules look the shared helper up at call time; bg.js bootstraps it (2026-11-02)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**What.** The esc-copy ratchet is at **0** local escapers (it was 102 definitions in ~100 files on 2026-11-02 morning, 46 files before this change). The remaining 32 root modules (`approvals.js`, `omega-*-native.js`, `omega-menu.js`, `omega-notify.js`, `omega-search.js`, `platform-kernel-runtime.js` and the rest) now route through the shared `window.OmegaEsc`.

**The trap that shaped the design.** A page can bind the helper once (`const esc = (window.OmegaEsc && OmegaEsc.esc) || (() => '')`) because it loads `/omega-esc.js` with a plain tag first. A module cannot: it may run before the helper, and a load-time binding locks in the blank fail-closed fallback for the life of the page. So every module keeps its own function name and its hoisting and looks the helper up at **call time**: `function esc(v) { return window.OmegaEsc ? OmegaEsc.esc(v) : ''; }`. Five modules (`omega-achieve-native`, `omega-media-native`, `omega-invest-native`, `omega-govern-native`, `omega-cosmos-native`) render a missing value as an em dash; their wrappers keep `v == null ? '—' : ...`, so the UI is unchanged.

**Why bg.js now defines the helper.** Measured with a trap on `window.OmegaEsc` over 33 pages: with only an injected `<script src="/omega-esc.js">`, five modules read the helper before it existed on a normal, undelayed load (modules that a page loads with its own tag run during parsing, before `bg.js` can inject anything), and with the helper delayed 3 s, 13 modules did, including `omega-menu.js` (3,404 reads). Injected scripts run in no fixed order, so no injection can fix that. `bg.js` therefore carries a **verbatim bootstrap copy** of the `omega-esc.js` IIFE, inline and synchronous, right after the fetch recorder and before the first injection. It is the one allowed duplicate (`ALLOWED = {"bg.js": 1}` in `esc-copy-ratchet.py`); `scripts/tests/test_omega_esc.py::BootstrapParity` executes both and fails on any difference in source or behaviour. Four pages whose own module tag can precede `bg.js` also load the file first: `achieve.html`, `cosmos.html`, `invest.html`, `media.html`.

**Scanner.** `xss-sink-ratchet.py` now trusts a short (<= 120 characters) function whose body calls `OmegaEsc.esc/num` and builds no markup literal; a longer render function that escapes one field is still not an escaper. Baseline unchanged at 2,084 pieces in 178 files. `esc-copy-ratchet.py` no longer reads the next 300 characters past a function's end (it counted a short wrapper `esc()` because `glyphText()` below it escapes, the same neighbour bug as FIXES_LOG 211); it stops at the next named function.

**Verified.** Headless render, 33 pages (every page that loads one of the modules plus a general sample), 0 errors. Trap with the helper undelayed and delayed 3 s: no module reads `OmegaEsc` before it exists (the only reader is `bg.js`'s own `if (window.OmegaEsc)` guard). Text compared with an unmodified `main`: identical on every stable line across 3 normal runs plus a delayed run; the only differences are `command.html`'s `AWAITING SIGNAL`/`OPERATIONAL` (from `omega-realtime.js`, not touched) and `social.html`'s `100`, and **unmodified `main` flips both by itself** (6 runs: `OPERATIONAL` once, `100` missing in 5). Not verified: the 160-odd pages outside those 33, and a real slow network.

**Not done.** `glyphText()` in `omega-emblems.js` is a different sanitiser (keeps well-formed character references) and stays. `escapeAttr()` in `omega-page-world.js` strips characters and is not an HTML escaper.
