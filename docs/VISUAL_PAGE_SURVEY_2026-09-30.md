# Ω SYD OMEGA 91717 — Visual Page Survey
## 2026-09-30

### Scope

This survey covers the complete root HTML estate currently visible in sydomega-live.

Verified repository inventory:
- 223 root HTML pages in the current main tree.
- 72 pages were identified through repository search as using the legacy aside#omega-side + .page-shell visual shell.
- 34 pages were identified as using both .page-shell and a semantic <main> in the searchable page estate.
- The shared design system is responsible for the majority of visual behavior; shared-layer fixes are therefore preferred over page-by-page overrides.

### Source requirements

The project requirements explicitly call for responsive UX/UI, accessibility, design-system consistency, animation and performance discipline, visual hierarchy, scalability and maintainability, progressive information disclosure, and continuous improvement.

The design language defines the above-the-fold information budget as:
1. page title;
2. primary action or status;
3. one key metric or headline;
4. call to action.

Additional detail belongs progressively below the fold rather than competing with the primary task.

### Readability baseline

The repository already contains a type-scale gate with a 12px minimum interface floor. Its recorded estate measurement found:
- 2,423 font-size declarations across 172 pages' own style blocks;
- 972 declarations at <=8px;
- 909 declarations at 9–11px;
- 185 declarations at 12–13px;
- 357 declarations at 14px+.

The new visual survey adds measurements for small-font declarations, dense letter-spacing, fixed-width geometry, viewport-width geometry, nowrap pressure, card/section/tab density, visible-word volume, duplicate title surfaces, fixed-position declarations, and an information-focus score.

### Flexibility / responsive risk model

The survey flags, rather than blindly rewrites:
- fixed widths large enough to resist narrow screens;
- 100vw or viewport-sized geometry;
- excessive white-space:nowrap;
- unusually dense tabs;
- large card collections.

These are review signals, not automatic failures. Specialist pages such as analytics, admin, graph and media surfaces can legitimately be information-dense.

### Information-focus rule

A page should not become a second navigation system.

Shared chrome should provide orientation; page content should provide the job.

The survey treats these as cognitive-load risks:
- title repeated in topbar and primary heading;
- multiple competing hero surfaces;
- excessive global controls;
- excessive cards before the primary task;
- long explanatory copy before the action or data;
- repeated labels that do not add new information.

### Shared fixes applied in this cycle

#### 1. World-role membrane

omega-page-world.js is now quieter when the canonical identity hero exists:
- the full world-role kicker and verbose verb/outcome line are hidden;
- the page keeps the role plus useful action destinations;
- the membrane uses tighter spacing;
- pages without the canonical identity hero retain the full contextual membrane.

#### 2. Desktop topbar controls

Home/Back controls injected by bg.js are now mobile-only.

Reason:
- desktop already has the canonical sidebar/navigation;
- repeating Home + Back in the topbar consumes horizontal space and competes with the page title;
- mobile still needs explicit navigation controls where the sidebar becomes a bottom navigation pattern.

#### 3. Regression survey

scripts/visual-page-survey.py scans the complete root HTML estate and reports readability, flexibility, scalability and information-density findings without destroying legitimate specialist pages.

It is included in scripts/contract-suite.py so normal contract runs measure the page estate.

### Design decision

The target is not minimum information.

The target is: minimum information necessary to understand and operate the current page, with deeper information available progressively.

A dashboard, graph explorer, financial ledger and legal document therefore should not have identical density. They should share the same readability and responsive contracts while exposing different amounts of domain information.

### Remaining runtime verification

The source-level survey is now enforced in the repository. A full screenshot sweep at 375/390/768/1024/1280/1440 widths still requires the browser review harness/runtime environment.

Production browser verification also remains separate from source verification because the current Vercel check is rate-limited. No live-production visual state is declared verified from source inspection alone.

### Acceptance criteria for future visual changes

- One unmistakable primary page purpose.
- One clear primary title.
- Primary action/status visible without hunting.
- Body copy at readable scale.
- No unnecessary desktop duplicate navigation.
- No fixed geometry that prevents narrow layouts unless the component is intentionally scrollable.
- Tables/data grids may scroll horizontally rather than breaking the page.
- Cards wrap/reflow rather than forcing viewport overflow.
- Mobile controls remain usable at touch size.
- Decorative motion never obscures data or interaction.
- Reduced-motion remains respected.
- Dense specialist pages remain dense only where the domain requires it.
- No new global chrome unless it serves a platform-wide job that cannot be satisfied by existing navigation.