### Platform navigator is labelled a concept catalogue, not Available (2026-11-05)

**Why.** `omega-platform-navigator.html` (reachable from the folded section of `nav.js`) presented "The Complete Product Ecosystem — 36 Capabilities Across 12 Domains" and marked every one of its 36 products `Available`. A repo-wide search for the product names (Omen Guard, Cipher Vault, Sentinel Watch, Yield Stream, Haven Protocol, Dominion OS) finds them only in this page, so nothing backs the label. The copy also promised "Military-grade encryption", "Zero-knowledge backup", "SOC 2 compliance" and "24/7 security monitoring". This is §8.1 class 9 (a claim rendered as fact), and a compliance certification is the kind of claim that carries legal weight.

**Fix.** All 36 statuses read `Concept`. The subtitle reads "A Concept Catalogue — 36 Planned Capabilities Across 12 Domains" and the intro says no item is verified as live and points to the navigation. The unbacked claims are gone ("Encryption", "Backup", "Compliance reporting", "Security monitoring with anomaly detection"). The page lost 17 words. `scripts/tests/test_platform_navigator_honest.py` pins all of it.

**Verified.** Every replacement asserted its exact count (36, 1, 1, 1, 1, 1, 1, 1). Headless render passes `verify-runtime.js`. contract-suite and unit tests pass.

**Not done / not verified.** I did not decide whether the page should exist: deleting it, or backing individual products with real pages, is the owner's call. The name `Concept` is a label I chose; some of the 36 may map to real features under other names, and this was not traced product by product. `privacy.html` and `academy.html` also contain "SOC 2" and were left alone (not checked beyond the match).

**Measurement note (trimming).** Page word totals overstate tabbed pages: `profile.html` is 1,939 words but its busiest tab, Portfolio, is 500 and Security 479. After PR #1164 only about 971 words are exact on-page repeats across all 236 pages, so the cheap reductions are used up and further cuts mean editing unique prose.
