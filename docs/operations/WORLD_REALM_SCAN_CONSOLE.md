# World Realm Scan Console

## Purpose
Adds an operator-facing control lens to the existing World page. It reuses the canonical 18-module registry and route verifier in `omega-world-engine.js`; it does not introduce a second registry or health-check engine.

## Behavior
- Displays the existing registry's reachable, unavailable and checking route counts.
- Displays the timestamp attached by the route verifier.
- Allows a member to manually re-run the existing route reachability check.
- Allows selection of a realm to inspect its registered purpose, role, current route status and existing destination.
- Keeps the current 3D Genesis planet and the existing module directory intact.
- Uses page-scoped CSS and JavaScript; it does not modify shared `omega-*.js` modules, navigation taxonomy, auth, database or RLS.

## Truth boundary
The route verifier accepts HTTP 2xx, 401 and 403 as route reachability. That is not proof of successful authentication, data access, authorization for a particular member, or all page actions. The console explicitly states this limitation and reports route state only.

## Accessibility and performance
- Keyboard-operable native select, link and button controls.
- Live scan status announced through `aria-live`.
- Responsive layout and minimum 12px interface text.
- Continuous sweep effect is disabled for `prefers-reduced-motion: reduce`.
- No extra WebGL renderer, polling loop without a bound, database request, or persistent browser state is added.

## Verification
Static contract tests are in `scripts/tests/test_world_realm_scan_console.py`. Browser rendering, real-device layout, and production URL checks remain required release evidence.
