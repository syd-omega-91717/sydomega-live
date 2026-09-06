# SYD OMEGA 91717 — Project Improvement Roadmap

**Status**: Enhanced with automated quality gates (Sep 2026)
**Maintainer**: Claude AI / SYD Team

## Overview

This roadmap documents the continuous improvement strategy for the Ω SYD OMEGA 91717 platform using free and open-source tools. The project maintains zero-build-step architecture while implementing enterprise-grade quality controls.

## Completed (Sep 2026)

### ✅ Core Infrastructure
- 23 blocking CI gates (all passing)
- Vercel static deployment pipeline
- Supabase backend with RLS
- Design system (4 layers: tokens, GVP, HORIZON, CINEMATIC)

### ✅ Recent Fixes
- Resolved Node.js parser limitation (47KB CSS extraction)
- Fixed all Vercel build failures
- Restored CSS class definitions for contract compliance
- Fixed CI script help contract
- Regenerated skill registry

## Phase 1: Enhanced Monitoring (Current - Q4 2026)

### Performance & Reliability
- **Lighthouse CI** - Automated performance audits
  - Target: 80+ performance, 90+ accessibility, 90+ best practices
  - Runs weekly + on push to main
  - Reports: Temporary public storage (GitHub Actions artifact)

- **Pa11y Accessibility Testing** - WCAG2AA compliance
  - Tests: Index, dashboard, profile, account pages
  - Runners: Axe + HTML CodeSniffer
  - Target: Zero critical/serious issues

- **Security Scanning**
  - Dependabot: Dependency vulnerability alerts
  - GitHub Secret Scanning: Credential detection
  - npm audit: Weekly vulnerability checks

### Implementation Status
```
✓ Lighthouse CI workflow added (.github/workflows/lighthouse-audit.yml)
✓ Pa11y configuration (.pa11yci.json)
✓ Lighthouse CI config (lighthouse-ci-config.json)
```

## Phase 2: Documentation & Design System (Q1 2027)

### Deliverables
- **Storybook** - Component library documentation
  - Showcase: All shared CSS classes
  - Documentation: Design tokens, usage patterns
  - Interactive: Live preview of each component state

- **API Documentation** - Supabase backend
  - Auto-generated: RPC function signatures
  - Manual: Authorization patterns, RLS policies
  - Examples: Common client queries

- **Architecture Guide** - Platform evolution
  - Diagrams: Component relationships
  - Decisions: Why zero-build-step
  - Scalability: Future roadmap

### Figma Integration
- Component snapshots from design system
- Design tokens documentation
- Brand guidelines snapshot

## Phase 3: Automated Testing (Q2 2027)

### Unit & Integration Testing
- **Playwright** - E2E browser automation
  - Golden path: Authentication → dashboard → data entry
  - Edge cases: Permission denials, rate limiting
  - Accessibility: Keyboard navigation, screen reader

- **Visual Regression** - Percy or similar
  - Detect unintended UI changes
  - Screenshot comparison across browsers
  - Integration with GitHub PRs

### Test Coverage Goals
- Page load: ✓ 100% (all 189 pages)
- Auth flow: ✓ Sign-in, reset, approval
- Data operations: ✓ CRUD patterns
- Error states: ✓ Invalid input, network failures

## Phase 4: Monitoring & Analytics (Q3 2027)

### Error Tracking
- **Sentry** - Real-time error monitoring
  - Source maps: Minified JS debugging
  - Releases: Track errors per version
  - Alerts: Critical error notifications

### Performance Analytics
- **Fathom Analytics** - Privacy-focused
  - Page views, user flow
  - Device types, geography (anonymized)
  - Conversion tracking (if needed)

### Uptime Monitoring
- **UptimeRobot** - 5-minute checks
  - Dashboard: Real-time status
  - Alerts: Email/webhook on downtime
  - History: Monthly/yearly uptime reports

## Phase 5: Infrastructure Scaling (Q4 2027+)

### Advanced Options
- **Supabase Scaling**
  - Database: pg_stat_statements analysis
  - Storage: Asset CDN optimization
  - Functions: Log aggregation & monitoring

- **Vercel Optimization**
  - Build cache: Reduced build times
  - Edge Functions: Sub-100ms responses
  - Analytics: Core Web Vitals tracking

- **Global Deployment**
  - Multi-region: Reduced latency
  - Failover: Automatic backup regions
  - DDoS Protection: Vercel Security

## Free Platforms Used

### Code Quality
| Platform | Tier | Purpose |
|----------|------|---------|
| GitHub | Free | CI/CD, security, branch protection |
| Lighthouse CI | Free | Performance, accessibility, SEO |
| Pa11y | Free (OSS) | WCAG2AA compliance testing |
| Snyk | Free tier | Dependency vulnerability scanning |

### Monitoring
| Platform | Tier | Purpose |
|----------|------|---------|
| Sentry | Free tier (500 events/month) | Error tracking |
| UptimeRobot | Free tier | Uptime monitoring |
| Fathom Analytics | Paid, minimal | Privacy analytics |

### Documentation
| Platform | Tier | Purpose |
|----------|------|---------|
| Storybook | Free (self-hosted) | Component library |
| GitHub Pages | Free | Static docs hosting |
| Docusaurus | Free (self-hosted) | Architecture docs |

### Design
| Platform | Tier | Purpose |
|----------|------|---------|
| Figma | Free tier | Design system docs |
| Penpot | Free (self-hosted) | Design prototyping |

## Success Metrics

### Performance
- Lighthouse scores: 80+ performance, 90+ accessibility
- First Contentful Paint: <1.5s
- Core Web Vitals: All green

### Reliability
- Uptime: 99.9%+ (Vercel + Supabase)
- Error rate: <0.1% of sessions
- Build failure rate: <1% of deploys

### Accessibility
- Pa11y: Zero critical/serious issues
- WCAG2AA: 100% compliance
- Keyboard navigation: Fully functional

### Code Quality
- Test coverage: 80%+ (new code)
- Dependency vulnerabilities: Zero critical
- Code review: Every PR reviewed

## How to Contribute

### Adding a Feature
1. Create feature branch from `main`
2. Run local CI: `bash ./scripts/ci-local.sh`
3. All 23 gates must pass
4. Create PR with detailed description
5. Await code review + lighthouse audit
6. Merge after approval

### Running Quality Checks Locally

```bash
# Full CI pipeline
bash ./scripts/ci-local.sh

# Performance audit (requires setup)
npm install -g lighthouse
lighthouse https://sydomega.com --chrome-flags="--headless --no-sandbox"

# Accessibility audit (requires setup)
npm install -g pa11y-ci
pa11y-ci --config=.pa11yci.json

# Security scan
npm audit --audit-level=moderate

# Syntax check
node --check bg.js
node --check omega-*.js
```

## Related Documentation

- **CLAUDE.md** - Project structure & constraints
- **FIXES_LOG.md** - Bug history & prevention patterns
- **GAP_ANALYSIS.md** - Known debt & open work
- **OMEGA_SKILL_REGISTRY.md** - Skills & agents census
- **REPOSITORY_AUDIT.md** - Schema & integrity checks

---

**Last Updated**: 2026-09-06
**Generated by**: Claude AI
**Next Review**: 2026-10-06
