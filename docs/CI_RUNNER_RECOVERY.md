# CI runner recovery — SYD OMEGA 91717

## Why the repository uses the self-hosted lane

The production gates require real execution evidence: a non-zero runner ID, executed steps, and a retrievable log. The GitHub-hosted lane was observed returning `runner_id: 0` with `steps: []`, so the repository does not treat that state as success.

The four verification workflows therefore use the repository's Windows x64 self-hosted runner labels:

```yaml
runs-on: [self-hosted, Windows, X64]
```

The runner is intentionally repository-scoped and the repository is private.

## One-time Windows registration

Run PowerShell as the Windows user that owns `C:\actions-runner`:

```powershell
Set-Location C:\actions-runner
& (Join-Path (git rev-parse --show-toplevel) 'scripts\bootstrap-github-runner.ps1')
```

If the repository is not checked out locally, copy `scripts/bootstrap-github-runner.ps1` from the repository into `C:\actions-runner` and run it there.

The script prompts for a GitHub PAT without displaying it. The PAT must have repository access sufficient to create a self-hosted runner registration token. For a private repository, GitHub documents repository `repo` scope for classic PATs; fine-grained tokens require repository Administration: write for the registration-token endpoint.

The script then:

1. downloads the pinned runner package and verifies its SHA256;
2. checks for elevation **before** prompting, when `-InstallService` was passed;
3. requests a fresh one-hour registration token through the GitHub API;
4. removes local runner credentials — **only after** a registration token is in hand;
5. registers the runner with `self-hosted,Windows,X64,syd-omega` labels;
6. refuses to start if `.runner` and `.credentials` were not created;
7. installs and starts a Windows service with `-InstallService`, otherwise runs
   in the foreground and says so.

**Use `-InstallService`.** Without it the runner lives only as long as the
PowerShell window: closing it, logging out, or rebooting stops it, and queued
jobs then sit until GitHub expires them after 24 hours. That is the observed
failure mode — the runner picked up no job between 2026-08-31 03:46 UTC and
2026-09-03 while jobs queued and expired.

```powershell
# Run PowerShell as Administrator
& (Join-Path (git rev-parse --show-toplevel) 'scripts\bootstrap-github-runner.ps1') -InstallService
```

Add `-Replace` when a runner of the same name is still registered on GitHub;
without it `config.cmd` refuses with *"a runner exists with the same name"*.

Never paste a registration token, PAT, service credential, or other secret into the repository.

## Two corrections to this document

Both of the following were stated here and were **not true of the script**. They
are recorded rather than quietly deleted, because both cost real recovery time.

**`-InstallService` did not exist.** Item 6 above previously promised it;
`grep -c InstallService scripts/bootstrap-github-runner.ps1` returned **0**. An
operator following this document ran `.\svc.cmd install` and got
`CommandNotFoundException` — correctly, since **`svc.cmd` does not ship in the
download; `config.cmd` generates it**, and registration had not completed. The
parameter now exists and does what the document says.

**"removes only incomplete local runner credentials" was false**, and this is the
one that did damage. The removal was unconditional *and* shared a line with
`config.cmd`:

```powershell
Remove-Item '.\.runner','.\.credentials','.\.credentials_rsaparams' -Force -ErrorAction SilentlyContinue; & $Config ...
```

Those are two statements. When the token request failed with a 401, the
`Remove-Item` had already run, so a **working** registration was destroyed before
anything could replace it — turning a bad-PAT annoyance into an unregistered
runner. The removal now happens only after a registration token has been
obtained, and a 401/403/404 aborts with the message *"Nothing on this machine was
changed."*

## When the PAT is rejected (HTTP 401)

The registration-token endpoint needs repository **admin** rights, which is more
than read/write:

| token type | what it needs |
|---|---|
| fine-grained | Repository permissions → **Administration: Read and write**, and `syd-omega-91717/sydomega-live` listed under Repository access |
| classic | **`repo`** scope |

Also check the token has not expired and was pasted whole. A **404** on this
endpoint usually means the token is valid but cannot see this private repository
— not that the URL is wrong.

Nothing on the machine is modified when the token is refused, so the fix is
simply to re-run with a corrected token.

## Manual fallback

If the bootstrap script is unavailable, GitHub's repository runner page is:

`Settings → Actions → Runners → New self-hosted runner`

Use the exact repository URL:

`https://github.com/syd-omega-91717/sydomega-live`

Generate the token immediately before running `config.cmd`; registration tokens expire after one hour.

## Acceptance test

After registration, GitHub must show the runner as **Idle** or **Active**. A real workflow job must then report:

- non-zero `runner_id`;
- runner name populated;
- one or more executed steps;
- a retrievable job log;
- `RUNNER_NAME`, `RUNNER_OS`, and `RUNNER_ARCH` printed by the diagnostics step.

Only after those conditions are present may code-level failures be evaluated.

## Workflows protected by this lane

- `CI`
- `Production Contract`
- `Capability Evidence`
- `Workflow Contract`
- `Runner Probe`

All contain explicit runner diagnostics and execution markers. The repository's `scripts/workflow-contract.py` also validates the structural contract and does not fabricate runtime evidence.
