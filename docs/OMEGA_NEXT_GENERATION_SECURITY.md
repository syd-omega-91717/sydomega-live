# Ω SYD OMEGA 91717 — Next-Generation Engineering Security Layer

This layer extends the existing deterministic contracts without replacing the current
static HTML + Supabase + Vercel architecture.

## Added verification layers

- CodeQL — semantic SAST for JavaScript/TypeScript and GitHub Actions.
- OpenSSF Scorecard — repository and software-supply-chain posture.
- Renovate — controlled GitHub Actions freshness and digest pinning.
- Existing OMEGA controls remain authoritative; no new scanner may weaken or bypass them.

## Security evidence chain

source contracts → CodeQL → secret/SCA/misconfiguration controls → Scorecard
→ browser/runtime verification → Supabase security verification → production smoke
→ deployment evidence

A successful scanner run is evidence for its own scope only; it is not a blanket security claim.

## Live observations

- 130 application functions were inspected.
- 28 are SECURITY DEFINER.
- Privileged functions are concentrated in the private schema.
- public.submit_exam_attempt is now SECURITY INVOKER.
- Privileged grading is isolated in private.submit_exam_attempt_impl.
- Anonymous execution is revoked for both exam functions.
- Supabase Security Advisor has one remaining warning: leaked-password protection is disabled.
  This requires the Supabase Auth configuration surface and is not silently marked fixed.

## Performance observation

platform_owners has a primary-key index on user_id. Its high sequential-scan counter is not
evidence of a missing index because the table contains only two rows and PostgreSQL can
legitimately choose a sequential scan. No redundant index was added without query-plan evidence.

## Next evidence targets

1. Enable leaked-password protection in Supabase Auth settings.
2. Run CodeQL and Scorecard on main.
3. Make browser journey coverage a blocking release evidence layer.
4. Establish an OWASP ASVS 5.0 control-to-evidence matrix.
5. Add staging-only k6 performance baselines.
6. Add dependency/SBOM evidence where dependency surface exists.
7. Add release provenance/signing when distributable artifacts justify it.
