# Cloudflare Pages cutover: sydomega.com off the paused Vercel Hobby team

**Why Cloudflare Pages.** The Vercel team is paused for **Edge Requests** (dashboard,
2026-10-06). On Cloudflare Pages' free plan, static requests and bandwidth are **unlimited**,
and it allows 500 builds a month. Netlify Free was ruled out: it charges 2 credits per 10k
requests and 15 per production deploy against 300 credits a month, and pauses the site when
they run out. That is the same failure in another place. Sources: the Cloudflare Pages limits
page and Netlify's pricing page, read 2026-10-18.

**Fit, measured 2026-10-18.**
- 1,141 files against a limit of 20,000.
- No file over 20 MB, against a limit of 25 MiB per file.
- 22 `_headers` rules against a limit of 100.
- 18 `_redirects` lines.

**Parity, measured in Cloudflare's own runtime** (`wrangler pages dev` 4.151.1 serving
`public/`):
- CSP, HSTS, `X-Frame-Options` and `Permissions-Policy` on every response.
- Static assets: `max-age=3600, stale-while-revalidate`.
- `sw.js`: a single `no-cache`.
- `/x.html` → 308 → `/x`.
- All 301 redirects working.
- `noindex` on `/admin*`.
- 1,185 asset requests returned 200.

The build is unchanged: `scripts/vercel-build.sh` now also writes `public/_headers` and
`public/_redirects` from `vercel.json` (`scripts/portable-host-config.py`), so one file stays
the source of truth for both hosts.

**What changes off Vercel.** Vercel Web Analytics and Speed Insights stop: their
`/_vercel/*` scripts 404, harmlessly. Nothing else changes, because the backend is Supabase on
every host.

## Status (2026-10-18): done

sydomega.com and www are **Active** on the `sydomega` Pages project. The project is connected to this
repository and builds every push to `main` itself. Its settings must stay **build command
`bash scripts/vercel-build.sh`, output `public`**. With them empty, Cloudflare publishes the raw
repository root, which serves `/scripts/*` and drops every header and redirect (`FIXES_LOG.md`).
`cloudflare-pages.yml` is now a manual fallback. Rollback: Pages → Deployments → **Rollback** on any
earlier good deployment.

## Owner steps, in order (as run)

Each step has a check. Do not start the next step until the check passes.

1. **Give GitHub a deploy token. This is the only Cloudflare setup.** `.github/workflows/cloudflare-pages.yml`
   builds and deploys on every push to `main`, and creates the `sydomega` Pages project on its
   first run. To enable it:
   - Cloudflare → My Profile → API Tokens → Create Token → template **Edit Cloudflare Workers**.
     It includes *Cloudflare Pages: Edit*. Then copy the token.
   - Copy the account ID: dashboard → Workers & Pages, right column.
   - In GitHub → repo → Settings → Secrets and variables → Actions, add `CLOUDFLARE_API_TOKEN` and
     `CLOUDFLARE_ACCOUNT_ID`.
   - Then Actions → **Cloudflare Pages** → Run workflow.

   Until both secrets exist, the workflow skips with a notice and stays green. It uploads directly,
   so it does not use Cloudflare's 500 Git builds a month, and doc-only commits are skipped by
   `paths-ignore`.

   **Check:** the run ends `CLOUDFLARE_PAGES=PASS https://sydomega.pages.dev`. If that name was
   taken, the create step fails and says so; change `PROJECT` in the workflow.

2. **Verify on `<project>.pages.dev` before touching DNS.** Sign in and open dashboard, life and
   profile.

   **Check:** pages render signed in, and the response headers show
   `content-security-policy`.

3. **Add `sydomega.com` as a Cloudflare zone** (Free plan). Cloudflare imports the current
   records. Delete the imported Vercel `ALIAS`/wildcard records. Keep the three CAA records
   (`letsencrypt.org`, `pki.goog`, `sectigo.com`); Cloudflare's certificates need one of them.
   There are no MX records, so email is unaffected.

4. **Switch the nameservers.** At the domain's registrar (not Vercel, which shows
   `boughtAt: null`), replace `ns1/ns2.vercel-dns.com` with the two Cloudflare nameservers the
   zone shows.

   **Check:** the zone reads **Active**.

5. **Attach the domain.** In the Pages project → Custom domains, add `sydomega.com`, then
   `www.sydomega.com`.

   **Check:** both serve HTTPS with the current release. Compare the commit in
   `/.well-known/omega-release.json` with `origin/main`.

6. **Stop the Vercel side.** Remove the domains from the Vercel project. Leave the Vercel
   project itself in place until the Pages site has run a week.

**Rollback.** At the registrar, put `ns1/ns2.vercel-dns.com` back. Vercel still holds the
2026-10-06 deploy.
