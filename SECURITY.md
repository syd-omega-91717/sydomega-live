# Security Policy — Ω SYD OMEGA 91717

## Repository visibility

This repository is public by design. Public visibility means source code, history, issues, and pull requests may be discoverable. This policy does **not** make public content private.

Sensitive implementation details must never be committed, including:

- Supabase service-role keys, JWT secrets, database passwords, and private tokens
- Vercel, Stripe, OAuth, AI-provider, or other provider secrets
- Personal data, production exports, private customer records, and private logs
- `.env` files and local credential stores

Use environment variables and provider-managed secret stores. Only publish browser-safe, explicitly public configuration.

## Required contribution controls

- Protect `main` with pull requests and required status checks in GitHub repository settings.
- Keep deployment credentials outside the repository and restrict them to the minimum required scope.
- Review generated files, build artifacts, logs, and migration data before every push.
- Use short-lived branches and delete merged branches.
- Do not bypass security checks to unblock a deployment.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private security advisory/reporting flow when enabled, or contact the repository owner through a private channel with reproduction steps, affected paths, impact, and a proposed mitigation.

## Verification boundary

A passing repository audit does not prove that the deployed application, GitHub settings, Vercel project, or Supabase configuration is secure. Those environments require separate, authenticated verification.
