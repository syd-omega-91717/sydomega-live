# Independent production HTTP evidence

`scripts/production-http-evidence.py` is a read-only synthetic probe for the public
production origins. It checks the live HTTP surface independently of build contracts
and the hosting provider's deployment UI.

## Run

Probe both custom domains and compare them with the expected main commit:

```sh
python3 scripts/production-http-evidence.py --expected-sha "$(git rev-parse origin/main)"
```

Emit a machine-readable report:

```sh
python3 scripts/production-http-evidence.py --expected-sha "$(git rev-parse origin/main)" --json
```

Probe a Pages preview or another authorized HTTPS origin explicitly:

```sh
python3 scripts/production-http-evidence.py --base-url https://sydomega.pages.dev --expected-sha "$(git rev-parse origin/main)"
```

## Evidence produced

For each supplied origin, the probe checks:
- HTTPS origin and redirect transport;
- root reachability and HTML content type;
- CSP, HSTS, X-Content-Type-Options, X-Frame-Options, and Referrer-Policy;
- release manifest HTTP status, JSON content type, and non-cacheable response;
- release manifest schema, project identity, and 40-character commit SHA;
- optional exact expected commit, plus cross-origin commit parity when multiple origins are supplied.

Exit code `0` means every check passed; `1` means one or more runtime checks failed;
invalid command-line arguments are rejected by argparse. The report intentionally does
not claim that authenticated routes, Supabase authorization, payment flows, or every
browser-side dependency are healthy. Those require separate authenticated and integration
tests.

## Safety and limits

- GET requests only; no deployment, write, database, payment, or authentication action.
- No tokens, cookies, authorization headers, or personal data are required.
- The probe is evidence for the moment it ran, not a permanent uptime guarantee.
- Run after deployments and periodically. Compare the expected SHA with the intended
  release commit, not a guessed or stale deployment identifier.
