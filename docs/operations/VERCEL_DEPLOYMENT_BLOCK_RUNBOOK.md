# Vercel Deployment Block — SYD OMEGA 91717 Runbook

**Status:** remediation guide; the Vercel account restriction is not cleared by repository changes.
**Project:** `sydomega-live`
**Production domain:** `https://sydomega.com`
**Repository:** `syd-omega-91717/sydomega-live`

## 1. Separate the three failure classes

Do not treat every red Vercel check as a build failure.

1. **Account/deployment creation block** — previously observed deployment creation error: HTTP 402 `resource_creation_blocked`, with the Vercel account/team reporting a fair-use or resource-creation restriction. This is enforced by Vercel outside the application repository. A code change, clean build, cache clear, or repeated deploy request cannot remove an account-level restriction.
2. **Integration authorization failure** — the connected Vercel integration also returned HTTP 403 `forbidden` for team scope `syd-omega-91717s-projects`, with an explicit instruction that this scope must be re-authorized or accessed with a token that has permission. This blocks reliable inspection through that integration; it is distinct from the 402 deployment restriction.
3. **Repository/CI failure** — JavaScript syntax, static contract, or GitHub check failures must be repaired in GitHub before a new release. They do not explain or resolve a Vercel account-level 402.

Record each issue separately with timestamp, exact error code/message, request/deployment ID, project, and affected team scope. Never record access tokens or secret values.

## 2. Owner actions required in Vercel

Perform these steps as an authorized owner/member of the team that owns the existing production project:

1. Open the [Vercel account/deployment blocked guide](https://vercel.com/kb/guide/why-is-my-account-deployment-blocked) and the [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines).
2. In the Vercel dashboard, select the team/account that owns the existing `sydomega-live` project. Review account notifications, usage/billing, spend limits, plan status, and any policy/compliance notice. Do not assume a plan upgrade is the answer until the dashboard identifies the actual cause.
3. If the dashboard identifies exhausted usage or budget, resolve that specific issue through the account's supported billing/plan controls. If it identifies a policy review or account pause, follow the displayed review/appeal/support process instead of repeatedly creating deployments.
4. Re-authorize the Vercel integration for the exact team scope `syd-omega-91717s-projects`, or use an authorized token whose team access includes the existing project. Verify team membership and project access before retrying read-only inspection. Do not paste tokens into chat, commits, issues, or logs.
5. Confirm that the existing project remains linked to the intended GitHub repository and production branch. Avoid creating a duplicate project, moving the domain, or changing ownership merely to evade a restriction; those actions can create domain, environment-variable, integration, and billing risks.
6. After the dashboard shows the restriction is cleared and integration access works, trigger **one** controlled deployment from the intended production commit. Inspect its deployment state and build logs before promoting or changing aliases.

## 3. Preserve the current architecture

SYD OMEGA is a framework-free static-site estate with a no-build Vercel configuration. Do not introduce a framework, bundler, monorepo rewrite, or build step as a supposed fix for `resource_creation_blocked`. Static hosting may reduce build work, but it cannot override account-level creation restrictions.

Before retrying deployment:

- Ensure the target commit is on the intended production branch and required GitHub checks pass.
- Check `vercel.json` for unintended route/header/rewrite growth; Vercel documents a 2,048-route-per-deployment limit.
- Check source upload/file limits only if the failure is specifically a CLI upload or build failure. The documented limits page states 100 MB source upload for Hobby CLI deployments and a 15,000 source-file limit for CLI deployments.
- Do not create repeated deployments while blocked; that adds noise and may consume rate-limited resources without changing the outcome.

## 4. Release verification checklist

- [ ] Vercel dashboard identifies no unresolved account/deployment pause or resource restriction.
- [ ] Vercel integration can read the correct team and existing `sydomega-live` project.
- [ ] Production branch commit matches the intended GitHub SHA.
- [ ] Required GitHub CI/security/contract checks are green.
- [ ] One controlled deployment reaches `READY`.
- [ ] Production alias/domain points to that deployment.
- [ ] Smoke-test `https://sydomega.com/` and representative critical routes.
- [ ] Check browser console/network errors and verify Supabase-backed flows without exposing secrets.
- [ ] Record deployment URL, commit SHA, checks, smoke-test results, and remaining limitations.

## 5. Escalation packet if the block remains

Send Vercel Support the exact account/team and project identifiers, UTC timestamp, HTTP status and error code (`resource_creation_blocked`), full non-secret error text, request ID if available, latest deployment URL/ID, and a concise statement of what was already checked. Ask whether the block is due to usage/budget, plan limits, account pause, or policy review, and what specific action is required to restore deployment creation. Do not send credentials or secret environment values.

## 6. Current known state

- A previous deployment attempt was reported as blocked with HTTP 402 `resource_creation_blocked`.
- The Vercel connector's current team lookup returned HTTP 403 because its selected team scope `syd-omega-91717s-projects` is not authorized for that request. Re-authentication or a correctly scoped authorized token is required for connector-based inspection.
- Neither condition is fixable by changing application JavaScript alone.
- This runbook documents the safe recovery path; it does **not** claim that the Vercel restriction has been lifted or that a new production deployment succeeded.
