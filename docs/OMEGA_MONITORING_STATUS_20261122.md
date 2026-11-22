# Ω SYD OMEGA 91717 — Monitoring Runtime Status

**Audit date:** 2026-11-22  
**Repository baseline:** `84b4d48f84564afaef81f9d5740c8bbdbfaa7977`  
**Status:** Partial; web-vitals telemetry is persisted, but the full monitoring configuration is not runtime-wired.

## Verified operating behavior

- `omega-metrics.js` exposes `OmegaVitals` and retains `OmegaMetrics` as a backward-compatible alias.
- It measures LCP, CLS, INP, FCP and TTFB and submits `web_vitals` events through `OmegaTelemetry.track`.
- `omega-monitoring.js` exposes the separate `OmegaMonitor` namespace and measures fetch latency/errors in memory. It does not persist those observations to the database.
- The two scripts no longer overwrite each other's global namespace.
- `monitoring-config.json` is read by `scripts/validate-monitoring.py` for CI validation; repository search found no browser/runtime loader for this file.
- `monitoring-dashboard.html` is a current-page view, not a historical production SRE dashboard.

## Live Supabase telemetry evidence

Read-only query against `public.telemetry_events`:

| Event type | Rows | Latest recorded event |
|---|---:|---|
| `web_vitals` | 389 | 2026-11-21 17:36:03 UTC |
| `slo_breach` | 81 | 2026-11-21 10:33:05 UTC |
| `error_encountered` | 6 | 2026-11-18 15:28:16 UTC |

These counts demonstrate persisted telemetry records, not complete monitoring coverage, current uptime, alert delivery, or measured SLO compliance.

## Configuration safety corrections

The configuration now explicitly reflects what is not operational:

- Alert delivery: disabled; no webhook channel is configured.
- Scheduled reports: disabled; no recipient data is stored in the public configuration.
- General API rate limiting: disabled/not deployed. Proposed thresholds remain under `proposedPolicies` and are not enforcement.
- Sampling and server retention settings: marked not runtime-wired.
- Dashboard: marked current-page-only, not historical SRE reporting.
- Browser web-vitals telemetry remains active through the existing `OmegaTelemetry` path; this change does not disable it.

The former webhook target `/.supabase/functions/v1/notify-performance` is not a deployed Edge Function. The live Edge Function inventory contained 22 functions and no `notify-performance` function.

## Required before claiming complete monitoring

1. Decide whether to build a runtime loader for the configuration or retire it in favor of explicit code-owned settings.
2. Implement a secured, owner-authorized alert endpoint and test delivery, retries, failure handling and secret storage.
3. Add aggregate historical telemetry views with access controls and retention enforcement.
4. Turn the dashboard into a real historical SRE view with production, CI, database and uptime sources clearly separated.
5. Add end-to-end tests for alert delivery, SLO calculation, sampling, retention and incident workflows.
6. Do not enable general API rate limiting until the separate Worker design is corrected and deployed through an approved release path.

**Truth boundary:** browser Web Vitals and their persisted telemetry are real. In-memory fetch/error collection is not persisted. Alert delivery, scheduled reports, general API rate limiting, historical SRE reporting, and server retention are not currently verified as operational.
