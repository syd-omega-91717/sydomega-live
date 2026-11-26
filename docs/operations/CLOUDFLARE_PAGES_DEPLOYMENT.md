# Cloudflare Pages production deployment

Cloudflare Pages' connected Git integration is the canonical production deployment path for `main`. The site remains a framework-free static estate; the repository's pinned build script is used for the optional manual fallback.

## Automatic production release

- A push to `main` is deployed by the connected Cloudflare Pages Git integration.
- `.github/workflows/cloudflare-production-verify.yml` waits up to ten minutes for both `sydomega.com` and `www.sydomega.com` to serve the exact main commit.
- The verifier checks the production manifest, CSP and HSTS headers, core routes, and the complete same-origin reference smoke suite.
- The verification workflow can also be manually dispatched from `main`.

## Manual Wrangler fallback

The `.github/workflows/cloudflare-pages.yml` workflow is manual-only and refuses non-main refs. It requires these GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN`: scoped to the production Cloudflare account with Cloudflare Pages edit permission.
- `CLOUDFLARE_ACCOUNT_ID`: the account identifier for that same Cloudflare account.

Set them under **Repository Settings → Secrets and variables → Actions**. The workflow fails if either is missing; it never reports a skipped deployment as success.

Do not commit either value or paste either value into an issue, pull request, or chat.
