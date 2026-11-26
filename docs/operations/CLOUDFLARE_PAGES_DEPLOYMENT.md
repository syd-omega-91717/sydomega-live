# Cloudflare Pages production deployment

The canonical production host is Cloudflare Pages. The static build remains framework-free and is produced by `scripts/vercel-build.sh`; the same output is deployed with the pinned Wrangler CLI.

## Required GitHub Actions secrets

Set these under **Repository Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN`: scoped to the production Cloudflare account with Cloudflare Pages edit permission.
- `CLOUDFLARE_ACCOUNT_ID`: the account identifier for the same Cloudflare account.

Do not commit either value or paste either value into an issue, pull request, or chat.

## Deployment behavior

- A push to `main` runs `.github/workflows/cloudflare-pages.yml` and deploys the exact Git commit SHA.
- A manual workflow dispatch is also supported, but only from `main`.
- Missing credentials fail the workflow. The deployment must not report success when no deployment occurred.
- The workflow verifies the Pages deployment manifest and runs the production smoke client.
- `.github/workflows/cloudflare-production-verify.yml` separately verifies that `sydomega.com` and `www.sydomega.com` serve the exact main SHA, expected security headers, and core routes.

## First activation

After both secrets are set, run the Cloudflare Pages workflow once from `main` or merge a fully verified main-branch PR. Confirm the resulting deployment and release manifest before treating production as updated.
