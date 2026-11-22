### profile.html described closed identity-document intake as active, compliant and ready (2026-11-22)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Defect (read from source).** `kyc_intake_enabled` defaults to false (`20260927110344_kyc_intake_rpcs.sql:35`), `kycGate()` in `profile.html` disables the upload for that reason, and no licensed KYC/AML provider is connected,
so nothing is collected or verified. The Identity Verification block still said: `SUBMIT IDENTITY DOCUMENT . READY TO ACTIVATE`, "[*] READY TO ACTIVATE ... All intake flows, status tracking, and document management are active", every
document card carried a `READY TO ACTIVATE` badge, a click said "Your submission will be securely encrypted", the intro said "All documents are encrypted and handled under GDPR/CCPA compliance" (a legal-compliance claim nothing here proves)
and "This is a legal requirement -- not a platform choice", and the status text promised "Complete all required steps below to unlock economic features, token access" (tokens are dormant). The same sentences were in `T_EN` and all six packs.

**Fix.** Header is `SUBMIT IDENTITY DOCUMENT` (true in either flag state); the notice reads "NOT ACTIVE -- document intake is closed (`platform_settings.kyc_intake_enabled` is false) pending legal counsel sign-off. No licensed KYC/AML provider is connected,
so nothing is verified and no document is collected today."; cards say `NOT ACTIVE`; the click message says intake is closed; intro and status text say verification is not active and *planned* to precede economic features. Three keys
(`prof_passport_submit_header`, `prof_kyc_intro`, `prof_kyc_status_desc`) updated in `T_EN` and `ar/es/fr/hi/nl/zh.json`, translated with DeepL; ES/FR/NL renderings that implied intake had been open before ("se reanude", "réactivée", "weer beschikbaar") were changed to "when it opens".
The closed-intake logic itself is untouched.

**Evidence.** New `scripts/tests/test_kyc_intake_truth.py` (7 tests, contract-suite id `kyc-intake-truth`): 12 failures against the original files, 0 against the fix. `i18n-contract.py`: no violations. `check-inline-js.py`: OK.
**Not claimed.** Source copy only: the live value of `kyc_intake_enabled` was not read (Supabase connector refused this session). The `kyc.html` half of the old gap entry had already been fixed on `main`; the gap entry was stale.
