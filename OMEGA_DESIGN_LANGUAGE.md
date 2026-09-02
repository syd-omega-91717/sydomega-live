# Omega Design Language

**Phase C: Visual Unification Specification**

Last updated: 2026-09-02 | Foundation Version 1.0 | Ready for Implementation

---

## Core Principle

> Every page is a world. Every interaction is a breath. Every archetype moves with intention.

SYD OMEGA's visual language treats each of 184 pages as a distinct environment, unified by:
1. **Shared design tokens** (colors, typography, spacing, motion)
2. **Archetype-specific motion signatures** (how each page-type moves)
3. **Emblem-based navigation** (visual identity per page)
4. **Information disclosure layers** (progressive revelation of depth)
5. **Cursor-responsive environments** (screens that feel alive)

This ensures: **Visual consistency across 8 domains + 12 archetypes + 184 pages = one coherent world**

---

## Design Tokens (Already Implemented in `bg.js`)

### Color Palette

**Primary Neutrals:**
- `--void`: `#0a0e13` (primary background, near-black)
- `--void2`: `#111420` (secondary background, subtle elevation)
- `--ink`: `#e5eef5` (primary text, nearly white)
- `--muted`: `#8899aa` (secondary text, muted blue)

**Primary Accents:**
- `--gold`: `#d4a574` (primary action, wealth, royalty)
- `--solar`: `#f0d850` (bright highlight, energy)
- `--cyan`: `#00e5ff` (secondary action, technology, cool)

**Semantic Colors:**
- `--crim`: `#ff4444` (danger, error, critical)
- `--green`: `#44dd44` (success, active, positive)
- `--purple`: `#bb66dd` (mystical, AI, knowledge)

**Context Colors** (per domain):
- Command: `--gold`
- Identity: `--solar`
- Ascend: `--cyan`
- Cosmos: `--purple`
- Vault: `--crim`
- Order: `--green`
- Intel: `--muted`
- Beyond: `--void2`

### Typography

**Display Font:** Cinzel Decorative (var: `--D`)
- Use: Page titles, major headings, emblems
- Weight: 400 (regular), 700 (bold)
- Spacing: `letter-spacing: 0.05em` (headings)

**Body Font:** Rajdhani (var: `--R`)
- Use: Body text, descriptions, UI labels
- Weight: 400 (regular), 500 (medium)
- Line-height: `1.6` (readable)

**Mono Font:** Courier Prime (var: `--M`)
- Use: Code, technical labels, machine-readable text
- Weight: 400
- Letter-spacing: `0.02em`

### Spacing Scale

```
--sp0:  0px       (no space)
--sp1:  4px       (micro)
--sp2:  8px       (tight)
--sp3:  12px      (compact)
--sp4:  16px      (standard)
--sp5:  24px      (generous)
--sp6:  32px      (expanded)
--sp7:  48px      (spacious)
--sp8:  64px      (breathing room)
```

Use: `.card { padding: var(--sp4); margin-bottom: var(--sp5); }`

### Border Radius

```
--r0: 0px         (sharp corners, technical/vault pages)
--r1: 4px         (minimal rounding)
--r2: 8px         (standard, most components)
--r3: 16px        (generous, cards/panels)
--r4: 32px        (full pill shape)
```

### Shadows

```
--shadow-sm:      0 1px 2px rgba(0,0,0,0.4)
--shadow-md:      0 4px 12px rgba(0,0,0,0.5)
--shadow-lg:      0 12px 32px rgba(0,0,0,0.6)
--shadow-glow:    0 0 20px rgba(212,165,116,0.3)   /* gold */
--shadow-cyan:    0 0 20px rgba(0,229,255,0.3)     /* cyan */
```

---

## Motion Hierarchy

### Level 0: Static (Vault, Archive, Beacon-static)
No animation. Pure information. Used for:
- Sensitive data (credentials, legal docs)
- Historical information (archives, genealogy)
- Entry points (login, terms of service)

**CSS:** `animation: none; transition: none;`

### Level 1: Subtle (Observatory, Library, Council)
Micro-interactions only. Smooth transitions between states. Used for:
- Data dashboards (analytics, leaderboards)
- Reading environments (knowledge, media)
- Governance pages (approvals, settings)

**CSS:** `transition: all 300ms ease-out;` (color, opacity, position)
**Behaviors:**
- Hover: 10% brightness change
- Focus: 2px outline in `--cyan`
- Active: icon color change + 2px scale

### Level 2: Responsive (Bazaar, Exchange, Beacon-guided)
State-aware animations. Feedback on user action. Used for:
- Social feeds (live activity, notifications)
- Commerce (cart updates, price animations)
- Onboarding (step highlights, progress)

**CSS:** `transition: all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94);`
**Behaviors:**
- Hover: Scale 1.02 + glow shadow
- Click: Scale 0.98 + color shift
- Loading: Spinning icon or pulse animation
- Notification: Slide-in from edge + dismiss animation

### Level 3: Interactive (Studio, Forge, Arena-moderate)
Full interactivity. Live feedback. Smooth state transitions. Used for:
- Editors (real-time preview, live validation)
- Builders (component placement, live feedback)
- Games (turn-based, score updates)

**CSS:** `transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);` (bouncy)
**Behaviors:**
- Hover: Scale 1.05 + box-shadow glow + color animation
- Drag: `cursor: grabbing` + visual feedback trail
- Drop: Snap-to-grid animation + success particle
- Invalid: Shake animation (3× left-right) + red glow

### Level 4: Dynamic (Cinema, Gaming, Studio-advanced)
Continuous motion. Engaging animations. Used for:
- Video experiences (cinematic fades, parallax)
- Interactive games (sprite animation, physics)
- Creation studios (real-time canvas animation)

**CSS:** `transition: all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);` (snappy)
**Behaviors:**
- Scroll parallax: Background moves at 0.5× scroll speed
- Hover effects: Shine/shimmer animation across element
- Particle systems: Confetti on success, sparks on interaction
- Canvas: 60fps requestAnimationFrame for live rendering

### Level 5: Immersive (Gaming-advanced, Arena-extreme, Beyond)
Full world simulation. 3D-like depth. Continuous engagement. Used for:
- Gaming environments (full screen, continuous action)
- Interactive simulations (city builders, ecosystems)
- Immersive storytelling (cinematic, interactive narratives)

**CSS:** 3D transforms, WebGL, requestAnimationFrame every frame
**Behaviors:**
- Camera movement: Follow cursor for 3D parallax
- Lighting: Dynamic shadows and glow based on interaction
- Physics: Gravity, inertia, collision detection
- Audio: Sound effects synchronized with motion

---

## Emblem System

Every page gets a unique SVG emblem (64×64px) placed in:
1. **Navigation sidebar** (next to page name)
2. **Page header** (large, subtle background)
3. **Share card** (when page is linked)
4. **Breadcrumb trail** (if multi-level navigation)

### Emblem Design Rules

- **Single color** (inherit from domain color `--gold`, `--cyan`, etc.)
- **Geometric & meaningful** (symbol matches page purpose)
- **Works at 16px–256px** (scalable, no fine detail)
- **Accessible** (high contrast, readable at 16px)
- **Distinctive** (no two emblems similar at glance)

### Emblem Catalog (by domain)

**COMMAND Domain:**
- ⚔️ Sentinel (sword crossed with shield)
- ⚖️ Governance (scales)
- 📋 Compliance (ledger)
- 👑 Sovereignty (crown)
- ⚙️ Operations (gear)
- 🔒 Security (lock)
- ⚙️ Settings (dial/knob)
- 🔧 Maintenance (wrench)

**IDENTITY Domain:**
- 🪞 Profile (mirror)
- 👁️ Identity (eye)
- ⚔️ Character (sword)
- ✨ Sigil (star/rune)
- 📜 Heritage (scroll)
- 🌳 Family (tree)
- 🏛️ Pantheon (temple)

**ASCEND Domain:**
- 📚 Academy (book)
- 📝 Exam (scroll)
- 🔥 Evolution (phoenix)
- 📊 Levels (graph)
- 🎯 Targets (bullseye)
- ⚔️ Missions (quest flag)
- 🏆 Achievements (trophy)
- ⭐ Honors (star)

**COSMOS Domain:**
- 📈 Analytics (chart)
- 👁️ Intelligence (eye)
- 🌊 Feed (wave)
- 🔭 Observatory (telescope)
- ⭐ Horoscope (stars)
- 🔮 Prediction (crystal ball)
- 🎴 Oracle (tarot card)
- 🌐 Matrix (grid)

**VAULT Domain:**
- 🏺 Vault (chest/urn)
- 💰 Wealth (gold)
- 👛 Wallet (purse)
- 💎 Treasury (jewel)
- 💸 Revenue (coins)
- 📊 Investment (graph)
- 📄 Expenses (receipt)
- 📋 Budget (ledger)

**ORDER Domain:**
- ⚙️ Automation (gears)
- 🔀 Workflow (flow)
- 📦 Queue (package)
- 📂 Projects (folder)
- 🎨 Studio (canvas)
- 🔨 Forge (anvil)
- 🚀 Publishing (rocket)
- 📖 Codex (code)

**INTEL Domain:**
- 🎬 Media (film reel)
- 🎥 Cinema (camera)
- 🎞️ Trailers (film strip)
- 📖 Reading (open book)
- 📚 Publications (stack of books)
- 📝 Notes (notepad)
- 📔 Journal (journal)
- ❤️ Mood (heart)
- 🏥 Health (medical cross)
- 💪 Workout (dumbbell)
- 🤖 Copilot (bot)

**BEYOND Domain:**
- 🎮 Gaming (game controller)
- ❓ Grill-me (question mark)
- 🏛️ Hall (columns)
- 🏆 Leaderboard (podium)
- 🏰 City (castle)
- 🌍 Realm (globe)
- 🪞 Mirror (mirror)
- 🔐 Cipher (lock/key)

---

## Component Design

### Cards

```css
.card {
  background: var(--void2);
  border: 1px solid rgba(212,165,116,0.2);        /* gold tint */
  border-radius: var(--r3);
  padding: var(--sp4);
  transition: all 300ms ease-out;
  position: relative;
  
  /* Ω-GVP: Glass shimmer + cursor-reactive light */
  &:hover {
    border-color: rgba(212,165,116,0.5);
    box-shadow: 
      0 0 20px rgba(212,165,116,0.2),
      0 0 40px rgba(0,229,255,0.1);
    
    /* Radial light follows cursor */
    background-image: radial-gradient(
      300px at var(--mx, 50%) var(--my, 50%),
      rgba(212,165,116,0.1),
      transparent
    );
  }
}
```

### Buttons

**Primary (Action):**
```css
.btn-primary {
  background: var(--gold);
  color: var(--void);
  border: none;
  border-radius: var(--r2);
  padding: var(--sp2) var(--sp4);
  font-family: var(--R);
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease-out;
  
  &:hover { transform: scale(1.02); box-shadow: var(--shadow-glow); }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
```

**Secondary (Alternate):**
```css
.btn-secondary {
  background: transparent;
  color: var(--cyan);
  border: 1px solid var(--cyan);
  border-radius: var(--r2);
  padding: var(--sp2) var(--sp4);
  
  &:hover {
    background: rgba(0,229,255,0.1);
    box-shadow: var(--shadow-cyan);
  }
}
```

### Input Fields

```css
.inp {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(212,165,116,0.3);
  border-radius: var(--r2);
  padding: var(--sp2) var(--sp3);
  color: var(--ink);
  font-family: var(--R);
  transition: all 200ms ease-out;
  
  &:focus {
    outline: none;
    border-color: var(--cyan);
    box-shadow: 0 0 12px rgba(0,229,255,0.3);
    background: rgba(255,255,255,0.08);
  }
  
  &::placeholder { color: var(--muted); }
}
```

### Navigation (Sidebar)

**Icon size:** 24px (normal) → 32px (hover)
**Transition:** 200ms ease-out
**Colors:** `--muted` (default) → domain color (hover)

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--sp3);
  padding: var(--sp3);
  margin: var(--sp2) 0;
  border-left: 3px solid transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 200ms ease-out;
  
  svg { width: 24px; height: 24px; transition: all 200ms ease-out; }
  
  &:hover {
    color: var(--gold);
    background: rgba(212,165,116,0.1);
    svg { width: 32px; height: 32px; }
  }
  
  &.active {
    color: var(--gold);
    border-left-color: var(--gold);
    background: rgba(212,165,116,0.15);
  }
}
```

---

## Information Disclosure Layers

Each page follows **progressive disclosure**: reveal information in stages.

### Immediate (Above the fold, < 1 second)
What the member sees first when they arrive:
- Page title (emblem + name)
- Primary action or status
- One key metric or headline
- Call-to-action

**Example (Leaderboard):**
```html
<h1>⭐ Leaderboard</h1>
<div class="kpi">
  <div class="kpi-label">Your Rank</div>
  <div class="kpi-value">#42</div>
</div>
<button class="btn-primary">View Rankings</button>
```

### Exploration (Main content area, 1–30 seconds)
What they interact with to understand details:
- Filtered/sorted lists
- Search/filter controls
- Secondary metrics
- Related content suggestions
- Drill-down affordances

**Example (Leaderboard):**
```html
<div class="filters">
  <select><option>This Week</option></select>
  <select><option>All Members</option></select>
</div>
<table class="tbl-leaderboard">
  <tr class="tbl-row">
    <td>#1</td>
    <td>Member Name</td>
    <td>1,250 pts</td>
  </tr>
  <!-- More rows -->
</table>
```

### Deep (Below the fold, 30+ seconds)
For those who want complete details:
- Raw data exports
- Full history
- Advanced filters
- API documentation
- Change logs

**Example (Leaderboard):**
```html
<details>
  <summary>📥 Export Full History</summary>
  <a href="export.csv">Download CSV</a>
</details>
<details>
  <summary>📖 Methodology</summary>
  <p>Rankings calculated daily at 00:00 UTC...</p>
</details>
```

---

## Responsive Behavior

### Breakpoints

```css
/* Mobile first */
@media (min-width: 480px)  { /* large phone */ }
@media (min-width: 700px)  { /* tablet */ }
@media (min-width: 900px)  { /* desktop */ }
@media (min-width: 1200px) { /* wide desktop */ }
```

### Adaptive Patterns

**Navigation:** Sidebar (desktop) → bottom sheet (mobile)
**Cards:** 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
**Motion:** All motion levels work at all screen sizes

---

## Accessibility

- **Color contrast:** All text meets WCAG AAA (7:1 on dark backgrounds)
- **Focus indicators:** 2px `--cyan` outline visible on all interactive elements
- **Motion:** Respects `prefers-reduced-motion` (no animations if disabled)
- **Touch targets:** Minimum 44×44px on mobile
- **Labels:** All inputs have associated `<label>` or `aria-label`

---

## Implementation Roadmap

### Phase C.1: Foundations (Complete)
- [x] Design tokens in `bg.js`
- [x] Motion hierarchy defined
- [x] Component specifications written

### Phase C.2: Emblem System (Ready)
- [ ] SVG emblem set created (64×64px, all 184 pages)
- [ ] Emblem catalog verified
- [ ] Sidebar updated to show emblems
- [ ] Test rendering at 16px, 32px, 64px, 256px

### Phase C.3: Component Implementation
- [ ] `.card` with Ω-GVP effects applied across all pages
- [ ] `.btn-primary`, `.btn-secondary` standardized
- [ ] `.inp` fields updated with glass theme
- [ ] `.nav-item` emblem integration

### Phase C.4: Page Archetype Application
- [ ] Each page tagged with `data-archetype=""`
- [ ] Motion levels applied per archetype
- [ ] Responsive behavior verified per archetype
- [ ] Cross-archetype visual consistency checked

### Phase C.5: Validation & Refinement
- [ ] Runtime verification (`verify-in-browser` skill)
- [ ] Mobile testing (48×48 touch targets, viewport)
- [ ] Accessibility audit (color contrast, focus, motion)
- [ ] Performance (no jank on Levels 3–5 motion)

---

## Version History

- **v1.0** (2026-09-02): Initial specification, foundation design language
- **v1.1** (TBD): Emblem system integrated, component implementation complete
- **v2.0** (TBD): Full page archetype application, Phase D visual transformation
