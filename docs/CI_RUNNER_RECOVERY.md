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

1. verifies access to the exact repository;
2. requests a fresh one-hour registration token through the GitHub API;
3. removes only incomplete local runner credentials;
4. registers the runner with `self-hosted,Windows,X64` labels;
5. refuses to start if `.runner` was not created;
6. optionally installs the runner as a Windows service with `-InstallService`.

Never paste a registration token, PAT, service credential, or other secret into the repository.

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
