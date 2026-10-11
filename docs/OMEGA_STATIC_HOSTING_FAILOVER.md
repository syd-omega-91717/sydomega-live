# Ω SYD OMEGA 91717 — Static Hosting Failover

## Purpose

Vercel remains the preferred deployment provider. This workflow provides a second
static delivery path for the framework-free web estate when Vercel is unavailable,
paused, rate-limited, or otherwise blocked.

The failover path deliberately reuses `scripts/vercel-build.sh`. It therefore
publishes the same generated `public/` artifact rather than maintaining a
second application implementation.

## Provider boundary

This does **not** bypass Vercel's Hobby fair-use enforcement.

Current Vercel notification:

> Deployments Paused — Your team exceeded the Hobby fair use limits. Upgrade to Pro to resume service.

The repository cannot legitimately remove that provider restriction. The
failover reduces operational dependence on it.

## Activation

A repository administrator must enable GitHub Pages with **GitHub Actions** as
the Pages source. The workflow then publishes `public/` from `main`.

The artifact contains `CNAME` for `sydomega.com`. DNS must be intentionally
moved to GitHub Pages before using the failover as the production origin.
Do not change DNS merely because the workflow exists.

## Safety rules

- Vercel configuration remains unchanged.
- Supabase remains the application backend.
- No credentials are stored in the workflow.
- No client-side authorization is introduced.
- The existing static build validation remains the artifact gate.
- Vercel production freshness evidence remains required when Vercel is restored.
- A GitHub Pages deployment is not evidence that Vercel production is current.
- DNS cutover is an explicit operator action.

## Recovery sequence

1. Enable GitHub Pages for the repository using GitHub Actions.
2. Allow the workflow to publish and verify the Pages URL.
3. Verify representative public routes and Supabase connectivity.
4. Verify the custom-domain certificate after DNS is intentionally changed.
5. If Vercel is restored, deploy current `main` there and re-verify production
   freshness before moving DNS back.
6. Keep the failover workflow in place as a disaster-recovery path.

## Architecture

`main → canonical static build → public/ → GitHub Pages`

The same source remains compatible with:

`main → canonical static build → public/ → Vercel`

This is provider redundancy, not an architectural rewrite.
