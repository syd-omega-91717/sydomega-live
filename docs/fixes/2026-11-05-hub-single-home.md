### Each duplicated hub module now has one home (2026-11-05)

**Why.** 16 module chips appeared in two hubs at once (counted from `config/omega-single-page-workspaces.json`): `wallet`, `subscriptions`, `payments`, `ledger` in Vault and Invest; `identity`, `passport`, `character`, `credentials`, `membership` in Profile and Archive; `heritage`, `bloodline` in Order and Archive; `gaming` in Arena and Achieve. A member saw the same capability under two doors.

**Fix.** Removed the second chip: Invest keeps its 8 own modules (Vault owns the four money ones); Archive keeps `kyc`, `charter`, `sigil` (Profile owns identity, Order owns heritage/bloodline); Achieve drops `gaming` (Arena owns it). Changed in `omega-single-page-workspaces.js` (the list that is loaded) and in the JSON that documents it. No page file, route, nav.js entry or data source changed; every `/x.html` URL still opens. `levels`, `phases`, `ascension`, `domain-mastery` stay in two hubs by the 2026-10-19 owner decision.

**Verified.** No link anywhere targets `<hub>.html#module=<key>` (grep over html/js/json: 0 hits), so no deep link loses its chip. `node --check` clean; 1133 unit tests pass; `omega-registry.py --check` OK.

**Not done / not verified.** Full-site `verify-runtime.js --all` was started on this branch; its result is not recorded here. A single-page `--pages <hub>` run shows a 1.06:1 contrast failure on a `PRE "nf"` element on every page, identically on unmodified main, so it is not caused by this change; its source is not identified. Chip removal was not checked by clicking in a render.
