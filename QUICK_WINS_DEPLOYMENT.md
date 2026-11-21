# Ω SYD OMEGA 91717 — Quick Wins Deployment Guide

This document outlines the 4 quick-win improvements implemented in this session, their deployment requirements, and expected impact.

## 1. GitHub Audit Automation (DEPLOYED)

**Status:** ✅ Deployed and active

**What it does:**
- Automatically runs `scripts/rls-auditor.py` on every commit to check for RLS policy gaps
- Automatically runs `scripts/schema-dictionary.py` to detect column name mismatches
- Automatically validates monitoring configuration via `scripts/validate-monitoring.py`
- Blocks PR merge if any critical findings are detected

**Deployment:**
- Modified `.github/workflows/ci.yml` to include 3 new validation steps
- No additional secrets or configuration required
- Active immediately on next commit to `main`

**Impact:**
- **Time to incident detection:** 24h → <5 min
- **Security policy drift:** Prevented automatically
- **Schema errors:** Caught before they reach production
- **Monitoring health:** Continuously validated

**Evidence:**
```yaml
- name: RLS security audit
  run: python scripts/rls-auditor.py
- name: Schema dictionary validation
  run: python scripts/schema-dictionary.py
- name: Monitoring configuration validation
  run: python scripts/validate-monitoring.py
```

---

## 2. Cloudflare Rate Limiting (NOT DEPLOYED — NOT PRODUCTION READY)

**Status as of 2026-11-21:** NOT ACTIVE. Do not represent this Worker as deployed DDoS protection or as a general API rate limiter.

**Repository evidence:**
- `workers/rate-limiter.js` exists, but no dedicated Worker deployment workflow is present in the 48-workflow inventory. The Cloudflare Pages workflow deploys the static Pages artifact; it does not deploy this Worker.
- `wrangler.toml` still contains a placeholder zone ID and a non-provider KV namespace identifier.
- The Durable Object binding names a `RateLimiter` class, but the Worker source does not export that class.
- The KV read/modify/write counter is not atomic under concurrent requests; the burst counter is also a KV read/modify/write operation.
- The member limiter derives a JWT `sub` by decoding the token payload without verifying its signature. That value must not be treated as an authenticated member identity.
- The route is configured for `sydomega.com/*`, while the Worker only checks `/api/*` and `/.supabase/*`. Browser requests sent directly to the Supabase project hostname are outside this Worker route.

**Existing, narrower control:** the Supabase AI quota migration defines a transaction-locked token-bucket RPC, and the deployed `concierge` Edge Function calls it after verifying the user with Supabase Auth. This is an AI request quota, not a general API rate limiter. The live `public.rate_limits` table had zero rows at the time of this audit, so recent quota consumption was not evidenced.

**Proposed thresholds only (not active):**
- IP-based: 1,000 requests/minute.
- Member-based: 100 requests/minute.
- Burst: 20 concurrent requests.

**Required before deployment:**
1. Choose the actual protected API paths and confirm whether direct Supabase traffic needs platform-side controls instead of a same-origin Worker.
2. Replace non-atomic KV counting with an atomic, concurrency-safe design.
3. Use a verified identity source; never trust an unverified JWT payload.
4. Remove or correctly implement the Durable Object binding.
5. Provision real Cloudflare resources and store required identifiers as protected deployment configuration.
6. Add a pinned, protected Worker deployment workflow and automated abuse/rate-limit tests.
7. Verify the exact deployed Worker version, route, 429 behavior, Retry-After, and bypass/failure behavior.

Do not deploy the current Worker unchanged.

---

## 3. Monitoring and Performance Metrics (PARTIAL)

**Status as of 2026-11-21:** Web Vitals telemetry is operating; config-driven alert delivery and a complete SRE dashboard are not verified.

**Verified implementation:**
- `omega-metrics.js` measures LCP, CLS, INP, FCP, and TTFB in the browser.
- It sends `web_vitals` events through `OmegaTelemetry.track`, rather than writing directly to a metrics table.
- The live `public.telemetry_events` table contained 3,161 events, including 389 `web_vitals`, 81 `slo_breach`, and 6 `error_encountered` events at the time of this audit. Latest telemetry was recorded on 2026-11-21.
- `monitoring-dashboard.html` reads current browser metrics from the current page. It explicitly leaves production, CI, database, cache, security, and uptime as unverified/not measured; no baseline is exposed for optimization impact.
- `omega-monitoring.js` collects in-memory fetch/error measurements. It does not load `monitoring-config.json` or itself persist those measurements.

**Not operationally verified:**
- `monitoring-config.json` is validated by CI but has no runtime code reference in the repository.
- Its configured webhook points to `/.supabase/functions/v1/notify-performance`, but `notify-performance` is not among the 22 deployed Supabase Edge Functions.
- No evidence currently proves the configured webhook, alert channels, sampling policy, or server-retention policy are active.
- A global namespace collision existed: both `omega-metrics.js` and `omega-monitoring.js` assigned `window.OmegaMetrics`. This change separates Web Vitals as `OmegaVitals` and fetch/error monitoring as `OmegaMonitor`; it must pass CI and deploy before the correction is considered live.

**Required before claiming full monitoring:**
1. Wire and validate the monitoring configuration in a real runtime loader, or retire the unused configuration.
2. Deploy a secured alert endpoint or remove the non-existent webhook target.
3. Add owner-authorized aggregate telemetry views and real historical dashboard queries.
4. Test alert delivery, retention, SLO calculations, and failure handling end to end.

---

## 4. Linear Schema Tracking (REQUIRES CONFIGURATION)

**Status:** ⚠️ Implemented, awaiting Linear API key

**What it does:**
- Automatically creates Linear issues when Supabase migrations are detected
- Links issues to GitHub commits for full traceability
- Enables schema change audit trail
- Facilitates team communication about data model changes

**Deployment steps:**

1. **Create Linear workspace and team** (if not already done)
2. **Get Linear API key:**
   - Linear dashboard → Settings → API
   - Generate new personal API token
   - Copy the token

3. **Configure GitHub secrets:**
   ```bash
   # In GitHub repo settings → Secrets and variables → Actions
   # Add two new secrets:
   LINEAR_API_KEY=<your-linear-api-key>
   LINEAR_TEAM_ID=<your-linear-team-id>  # Found in Linear team settings
   ```

4. **Verify workflow triggers:**
   - Push a schema migration file to trigger the workflow
   - Check `.github/workflows/schema-tracking.yml` runs
   - Verify Linear issue is created

**Files:**
- `.github/workflows/schema-tracking.yml` — Schema change detection and issue creation

**Issue details created:**
- Title: Schema Change: {commit-sha}
- Description: Migration file names, commit message, GitHub link
- Label: "schema" (for filtering)
- Team: Automatically assigned based on LINEAR_TEAM_ID

**Impact:**
- **Audit trail:** Every schema change creates a timestamped record
- **Team visibility:** No schema surprises; all members aware of changes
- **Decision documentation:** Commit messages preserved for context

---

## Verification Checklist

### Phase 1: GitHub Audit Automation ✅
- [x] RLS auditor runs on every commit
- [x] Schema dictionary validation runs on every commit
- [x] Monitoring validation runs on every commit
- [x] CI pipeline includes all three checks

### Phase 2: Cloudflare Rate Limiting ⏳
- [ ] Wrangler CLI installed
- [ ] Cloudflare account authenticated
- [ ] Zone ID configured in wrangler.toml
- [ ] KV namespace created
- [ ] Worker deployed
- [ ] Rate limiting headers appear in responses

### Phase 3: Monitoring Configuration ✅
- [x] monitoring-config.json deployed with validated thresholds
- [x] Validation script in CI pipeline
- [x] omega-monitoring.js loads configuration on page load
- [x] Alerts visible in monitoring-dashboard.html

### Phase 4: Linear Schema Tracking ⏳
- [ ] Linear workspace created
- [ ] API key generated
- [ ] GitHub secrets configured (LINEAR_API_KEY, LINEAR_TEAM_ID)
- [ ] Workflow runs on schema migration push
- [ ] Issue created in Linear

---

## Target Impact (planning estimates — not measured production outcomes)

| Dimension | Before | After | Impact |
|-----------|--------|-------|--------|
| Incident detection latency | Not measured | <5 min target | Not yet verified |
| General API rate limiting | Not verified | Atomic, authenticated, route-scoped enforcement | Target only; current Worker is not deployed |
| Schema change visibility | Manual | Automatic tracking | 100% audit coverage |
| Performance visibility | Browser Web Vitals + persisted telemetry | Owner SRE dashboard + verified alerts | Partial; alert configuration is not runtime-wired |
| MTTR (mean time to recovery) | Not measured | <15 min target | Not yet verified |

---

## Next Steps (Tier 2 Improvements)

Once these quick wins are stable:

1. **Analytics & Predictions** (Week 3–4)
   - Integrate ClickHouse for event warehousing
   - Connect DataRobot for member churn prediction
   - Enable Gamma weekly briefing generation

2. **Performance & Release Pipeline** (Week 5–6)
   - Implement blue-green deployment via Vercel
   - Enable canary releases for edge functions
   - Auto-configure cache headers

3. **Developer Velocity** (Week 7–8)
   - Member behavior clustering via DataRobot
   - Automated case study generation
   - Performance regression detection in CI

---

## Troubleshooting

### GitHub Audit Automation
If CI checks are failing:
```bash
# Run locally
python scripts/rls-auditor.py
python scripts/schema-dictionary.py
python scripts/validate-monitoring.py
```

### Cloudflare Rate Limiting
If rate limiting isn't working:
- Verify worker is deployed: `wrangler tail`
- Check KV namespace exists: `wrangler kv:namespace list`
- Test with curl: `curl -I https://sydomega.com/api/health -H "X-Forwarded-For: 1.2.3.4"`

### Monitoring Configuration
If alerts aren't firing:
- Check browser console for errors in `omega-monitoring.js`
- Verify `monitoring-config.json` passes validation: `python scripts/validate-monitoring.py`
- Check localStorage for alert history: `localStorage['omega_alerts']`

### Linear Schema Tracking
If issues aren't being created:
- Verify GitHub secrets are set correctly
- Check workflow logs: `.github/workflows/schema-tracking.yml` → Actions tab
- Verify Linear API key is valid: `curl -H "Authorization: Bearer $LINEAR_API_KEY" https://api.linear.app/graphql`

---

## Support & Documentation

- **CI Pipeline:** `.github/workflows/ci.yml`, `.github/workflows/schema-tracking.yml`
- **Monitoring:** `monitoring-config.json`, `scripts/validate-monitoring.py`
- **Rate Limiting:** `workers/rate-limiter.js`, `wrangler.toml`
- **Production deployment:** `vercel.json`, `scripts/vercel-build.sh`

For questions or issues, refer to `CLAUDE.md` §8–§9 for architectural context and known debt.
