### 14 more pages moved off a local HTML escaper; 32 modules deliberately left (2026-11-02)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**What.** The ratchet's remaining 46 files fell to 32. These 14 pages carried a local escaper the first codemod could not prove equivalent (indented, defined twice, or named `escOFF`, `escH`, `escHtml`, `escapeHTML`): `architecture council covenant dashboard domain-mastery expenses family graphify nutrition profile quest-progress seasonal-events skills wealth`. Each now loads `/omega-esc.js` before its first inline block and binds `var <name> = (window.OmegaEsc && OmegaEsc.esc) || (() => '')` at the top of the block that held the definition (a `var`, not a `const`, because `dashboard`, `family` and `profile` define it in two blocks). Local names are kept, so no call site changed.

**Behaviour change, deliberate.** The shared helper also escapes `'` (`escOFF`, `escH` did not) and renders `0` as `0` (`escH` used `String(s||'')` and rendered it empty). Both are stricter or more correct, none is looser.

**Verified.** Headless render of all 14 pages before and after: 0 errors in both, visible text length identical on all 14, `window.OmegaEsc` present on all 14. Ratchets: esc-copy 46 files to 32 (baseline lowered), XSS sink ratchet unchanged at 2,084 pieces in 178 files, inline-JS parse clean.

**Deliberately not done: the 32 `.js` modules.** `bg.js` injects them as dynamic scripts, which run in no guaranteed order, so a module that renders while loading could run before `OmegaEsc` exists and, because the alias fails closed, draw blank text. They need a load-order decision first (for example `omega-esc.js` injected first with `async=false` plus lazy lookup at call time, or a module-level wait for `window.OmegaEsc`). `bg.js` is the platform's single point of failure, so that change gets its own PR and its own render check.
