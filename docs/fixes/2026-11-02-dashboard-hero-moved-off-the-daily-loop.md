### Dashboard: the 220px signet hero no longer sits above the Daily Three (2026-11-02)

**Why.** The dashboard opens on TODAY, but a 222px decorative 3D signet (`data-omega-sculpture="signet"`) sat between the mission bar and the Daily Three. Measured in headless Chromium with the harness stub, 1440x900: the Daily Three began at y=509 (module picker 56, workspace nav 61, mission bar 44, hero 222, status strip 32 above it); at 390x844 it began lower still.

**Fix.** The hero moved to the top of the OVERVIEW panel (`dashboard.html`), beside the other platform-level visuals. Nothing was removed; the module picker, workspace nav, mission bar and status strip are platform-wide or unchanged and were not touched.

**Verified.** Same harness, same viewports: the Daily Three now starts at y=255 (1440x900) and y=329 (390x844). A control run of the unmodified page painted the hero (8,092 lit pixels, status `visible:true`). After the move the hero is `visible:false` while the panel is closed or below the fold, which is the IntersectionObserver working as designed (a first reading of "0 lit pixels" was that, not a bug), and once scrolled into view on OVERVIEW it paints 7,995 to 8,447 lit pixels with frames running. `test_dashboard_tabs.py` gained two tests that fail on the old page (2 failures) and pass on the new one (14 tests).

**Not done / not verified.** The module picker and workspace nav (117px together) are injected on every page and were left alone; changing them is a platform-wide decision. Stubbed data only; no real-network or production check. "PMI 87" in the mission bar and an Overview KPI is still a hard-coded number awaiting the owner's decision.
