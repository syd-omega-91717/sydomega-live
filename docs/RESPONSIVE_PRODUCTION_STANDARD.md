# Ω SYD OMEGA 91717 — Responsive Production Standard

**Status:** CANONICAL BUILD CONTRACT
**Scope:** Every public HTML page emitted by the production artifact
**Target viewports:** 375px mobile, 768px tablet/small laptop, 1280px laptop/desktop

## Source requirements

The source documents require responsive behavior at 375px, 768px and 1280px, readable UX, accessibility, visual hierarchy, performance, mobile navigation, and graceful loading/error behavior.

## Non-negotiable page contract

Every ordinary page must have:
1. a valid viewport declaration;
2. a title;
3. a canonical content root;
4. the shared background/runtime shell;
5. canonical navigation/runtime hooks;
6. no fixed desktop canvas that exceeds the viewport;
7. horizontal scrolling only inside intentionally scrollable surfaces such as tables or tab strips;
8. usable controls on narrow screens;
9. no mobile-only dependency on hover;
10. reduced-motion compatibility.

## Viewport contract

**1280px:** desktop shell may use its canonical sidebar while content remains fluid and readable.

**768px:** navigation and grids may compress/reflow; dense surfaces must collapse or scroll inside their own containers.

**375px:** content must stay within the viewport; mobile command navigation must remain reachable; touch controls must remain usable; fixed overlays must not cover primary actions; typography must remain legible without page-wide horizontal movement.

## Evidence rule

The static contract is necessary but not sufficient for production verification. A page becomes **PRODUCTION-VERIFIED responsive** only after representative browser/device runs confirm 375px, 768px and 1280px behavior, zero unintended horizontal overflow, working primary navigation/actions, usable forms/dialogs, safe fixed/sticky UI, and no relevant runtime errors.

Source existence alone never upgrades a page to PRODUCTION-VERIFIED.

## Canonical ownership

Do not create a second responsive/navigation framework. Existing ownership is `css/omega-system.css`, `nav.js`, `bg.js`, `omega-accessibility-audit.css`, `scripts/omega-production-surface-contract.py`, and `scripts/omega-responsive-surface-contract.py`.

## Completion states

- **IMPLEMENTED:** responsive mechanism exists.
- **TESTED:** automated contract passes.
- **RUNTIME-VERIFIED:** browser run confirms behavior.
- **PRODUCTION-VERIFIED:** live production browser run confirms target viewports.

Never label every page mobile-ready merely because a global media query exists.
