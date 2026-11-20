# Remove last page-level service-worker registration (dashboard.html)

Date: 2026-11-20

`dashboard.html` was the sole allowlisted exception in `test_service_worker_registration.py`, justified by an
"in-flight design/readability-profile-dashboard-20261119 branch". `origin` has no such branch and its work
(0d9256d, ffd972f) merged 2026-11-19, so the exception protected nothing.

- Removed the inline `navigator.serviceWorker.register('/sw.js')` script from `dashboard.html`; `bg.js` injects
  `omega-sw-register.js` on every page, which is the single owner.
- Test now asserts no page registers the worker itself (`LEGACY_ALLOWLIST = {}`).

Evidence: `test_service_worker_registration` 3/3, `audit.py` 0 critical / 8 warnings, `check-inline-js.py` clean,
`csp-inline-ratchet.py` PASS.
Not verified: live service-worker install on the deployed dashboard (Playwright blocks workers here).
