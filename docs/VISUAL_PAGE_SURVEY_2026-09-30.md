# Ω SYD OMEGA 91717 — Visual Page Survey
## 2026-09-30

### Survey scope
The visual audit covers the root HTML page estate of sydomega-live and shared runtime layers that inject navigation, world-role chrome, alerts, and responsive behavior.

### Four dimensions
1. Readability — type size, tracking, line pressure, title clarity and touch-target usability.
2. Flexibility — narrow-screen behavior, fixed dimensions, viewport geometry, wrapping and horizontal-overflow risk.
3. Scalability — repeated cards, sections, tabs and global chrome as page complexity grows.
4. Information focus — whether the page contains what the user needs for its job, without duplicated navigation, identity or explanatory material.

### Page information rule
Every page should answer: Where am I? What is this page for? What is the primary thing I can see or do here? What supporting information is necessary to complete that job?

Anything that does not help answer or execute those questions belongs below the primary content, behind progressive disclosure, or in shared navigation.

This does not mean every page must be sparse. A ledger, graph, admin console, media library or analytics surface can legitimately be information-dense when that density serves its domain job.

### Shared corrections
- World Role membrane: when a canonical .oid-hero exists, keep the role and useful actions while hiding repeated kicker and long verb/action/outcome copy.
- Desktop Home/Back topbar controls: mobile-only because desktop already has persistent navigation.
- World Role membrane mount: insert into main, .main, .page-shell, #app or [role=main] before falling back to body.
- Vault/page-shell: treat the Vault failure as a shared runtime boundary defect, not a page-specific cosmetic defect.

### Survey measurements
scripts/visual-page-survey.py scans every root HTML file and records:
- title and level-1 heading;
- visible word volume;
- card/tile/panel density;
- section-heading density;
- tab density;
- button/link/form/image counts;
- declarations below the 12px readability floor;
- dense letter-spacing;
- fixed-width declarations;
- viewport-width geometry;
- nowrap pressure;
- fixed-position declarations;
- duplicate topbar/title identity;
- information-focus score.

The survey is diagnostic rather than destructive. It identifies candidates for review without deleting legitimate specialist information.

### Review thresholds
| Signal | Review trigger |
|---|---:|
| Font declarations below 12px | any |
| Letter spacing >= 3px | any |
| Fixed width >= 320px | any |
| Nowrap declarations | 8+ |
| Card-like surfaces | 50+ |
| Section headings | 12+ |
| Tabs | 12+ |
| Visible body words | 2,200+ |
| Duplicate topbar/title identity | any |

These are review signals, not universal failures. Specialist pages may remain above a threshold when their domain requires the density and the layout remains readable/responsive.

### Scalability principles
- Prefer shared components over page-specific CSS duplication.
- Prefer wrapping/reflow over hard-coded widths.
- Let tables/data grids scroll inside their own container.
- Keep global chrome stable.
- Keep page identity singular.
- Keep primary actions visually dominant.
- Use progressive disclosure for secondary detail.
- Preserve reduced-motion behavior.
- Do not use decorative animation to carry essential information.
- Do not solve shared defects with dozens of page-specific patches.

### Acceptance criteria
A visual page is structurally healthy when:
- its purpose is immediately identifiable;
- one primary title is visually dominant;
- primary action/status is easy to locate;
- text remains readable without zooming;
- controls wrap or reflow at narrow widths;
- no unintended body-level flex child steals page width;
- dense specialist content is contained in its own region;
- decorative chrome does not compete with data;
- mobile controls remain touch-usable;
- repeated identity/navigation is removed;
- secondary information is progressively disclosed;
- no major content exists solely because another shared component injected it.

### Runtime boundary
Source analysis establishes code structure and contract coverage; it cannot by itself prove rendered output at every viewport. A complete rendered survey should capture each page at 375, 390, 768, 1024, 1280 and 1440px.

Production deployment status must be verified from the actual Vercel deployment rather than inferred from repository state.
