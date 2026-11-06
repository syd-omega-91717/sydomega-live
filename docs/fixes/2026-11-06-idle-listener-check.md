### Voice and music load immediately again; the other idle modules checked (2026-11-06)

**Why.** `2026-11-06-second-idle-batch.md` left four idle modules (from PR #1169/#1170) marked unverified: they listen for `omega:populated` or `omega:user-loaded`, which fire before an idle load (up to 2.5 s after `load`) arrives. Each was read:

| module | what it waits for | late arrival | decision |
|---|---|---|---|
| `omega-voice.js` | injects the voice button only on `omega:populated` (`omega-voice.js:156`) | button never injected | **immediate** |
| `omega-music.js` | injects the topbar toggle and sets its tint only on `omega:user-loaded` (`omega-music.js:235,243`); only `chronicle.html` fires that event | toggle never injected | **immediate** |
| `omega-lattice-3d.js` | wires clicks at once when the document is already loaded, and again on `omega:populated` (`:154-157`) | handled | stays idle |
| `omega-cinematic.js` | count-ups re-run on every `omega:populated`; the late-arrival case is documented in the file | handled | stays idle |

`omega-voice-responsive`, `omega-voice-sync` and `omega-motion-v3` listen for copilot stream and `omega:feedback` events, which only happen on a user action long after load, so they stay idle.

**Fix.** The `omega-voice` and `omega-music` injection lines in `bg.js` call `__omegaAppend` again. Idle batch is now 11 modules. `scripts/tests/test_module_load_audit.py` replaces `UNVERIFIED_IDLE` with `KNOWN_SAFE_IDLE`, which carries the reason each exception was accepted.

**Verified.** `node --check bg.js`; unit tests 1141 OK; `audit.py` 0 critical; `module-contract.py` PASSED; `omega-registry.py --check` OK; `verify-runtime.js` PASS (13 pages). Render, 5 s after load, signed-in stub, committed `bg.js` (before) vs this change (after): `#omega-voice-btn` present on `dashboard` and `chronicle` **false then true** (before: both pages false; after: both true). `window.OmegaVoice` was defined in both runs, so the module loaded; only its button was lost.

**Not verified.** The music toggle was absent before and after in the harness (`[data-music-toggle]` false on both pages), so its fix rests on reading the code, not on a render; the stub may not fire `omega:user-loaded`. `verify-runtime.js --all` was not run.
