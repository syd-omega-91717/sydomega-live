#Requires -Version 5.1
<#
.SYNOPSIS
  Register (or re-register) the repository's self-hosted Windows runner.

.DESCRIPTION
  Downloads and verifies the pinned runner package, exchanges a GitHub PAT for a
  short-lived registration token, registers the runner, and starts it.

  ORDERING MATTERS HERE, and an earlier version got it wrong: it deleted
  .runner/.credentials on the same line that ran config.cmd, so a failed token
  request (a 401 from an expired or under-scoped PAT) destroyed a WORKING
  registration before anything could replace it. The operator was then left with
  a runner that could not simply be restarted. Local credentials are now removed
  only after a registration token is in hand.

.PARAMETER InstallService
  Install and start the runner as a Windows service instead of running it in the
  foreground. Requires an elevated session.

  Prefer this. Without it the runner lives only as long as this PowerShell
  window: closing it, logging out, or rebooting stops the runner, and queued
  jobs then sit until GitHub expires them after 24 hours. That is the observed
  failure mode -- the runner picked up no job between 2026-08-31 03:46 UTC and
  2026-09-03, while jobs queued and expired.

.PARAMETER Replace
  Pass --replace to config.cmd. Needed when a runner of the same name is still
  registered on GitHub; without it config.cmd refuses with "a runner exists with
  the same name".

.EXAMPLE
  # Durable: survives logout and reboot. Run PowerShell as Administrator.
  .\bootstrap-github-runner.ps1 -InstallService

.EXAMPLE
  # Re-registering a name GitHub still knows about.
  .\bootstrap-github-runner.ps1 -InstallService -Replace
#>
[CmdletBinding()]
param(
  [string]$RepositoryUrl = 'https://github.com/syd-omega-91717/sydomega-live',
  [string]$RunnerName    = 'SYD-OMEGA-WIN',
  [string]$RunnerVersion = '2.336.0',
  [string]$RunnerSha256  = 'd59123a43003e357b0805b5d0f611d0bd2f65ab67d51bd070dd4e7a0f685c162',
  [switch]$InstallService,
  [switch]$Replace
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RunnerRoot = 'C:\actions-runner'
$Zip        = Join-Path $RunnerRoot "actions-runner-win-x64-$RunnerVersion.zip"
$Config     = Join-Path $RunnerRoot 'config.cmd'
$Run        = Join-Path $RunnerRoot 'run.cmd'
$Api        = 'https://api.github.com/repos/syd-omega-91717/sydomega-live/actions/runners/registration-token'
$Download   = "https://github.com/actions/runner/releases/download/v$RunnerVersion/actions-runner-win-x64-$RunnerVersion.zip"

if (-not (Test-Path $RunnerRoot)) { New-Item -ItemType Directory -Path $RunnerRoot | Out-Null }
Set-Location $RunnerRoot

# ---------------------------------------------------------------- package
if (-not (Test-Path $Zip)) { Invoke-WebRequest -Uri $Download -OutFile $Zip }
$Hash = (Get-FileHash $Zip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($Hash -ne $RunnerSha256.ToLowerInvariant()) {
  throw "Runner SHA256 mismatch. Expected $RunnerSha256, got $Hash."
}
if (-not (Test-Path $Config) -or -not (Test-Path $Run)) {
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::ExtractToDirectory($Zip, $RunnerRoot)
}
if (-not (Test-Path $Config) -or -not (Test-Path $Run)) {
  throw 'Runner package is incomplete.'
}

# ---------------------------------------------------------------- elevation
# Checked BEFORE the PAT prompt: discovering the session is not elevated after
# the operator has typed a token, and after credentials are gone, is the worst
# possible moment.
if ($InstallService) {
  $Identity  = [Security.Principal.WindowsIdentity]::GetCurrent()
  $Principal = New-Object Security.Principal.WindowsPrincipal($Identity)
  if (-not $Principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw '-InstallService needs an elevated session. Re-open PowerShell with "Run as administrator".'
  }
}

# ---------------------------------------------------------------- token
$PatSecure = Read-Host 'Enter GitHub PAT with repository administration permission' -AsSecureString
$Ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($PatSecure)
try { $Pat = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Ptr) }
if ([string]::IsNullOrWhiteSpace($Pat)) { throw 'GitHub PAT is required.' }

$Headers = @{
  Authorization          = "Bearer $Pat"
  Accept                 = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
  'User-Agent'           = 'syd-omega-runner-bootstrap'
}

try {
  $RegistrationToken = (Invoke-RestMethod -Method Post -Uri $Api -Headers $Headers).token
}
catch {
  # A bare 401 sends people looking in the wrong place. Name the three real
  # causes, and say plainly that nothing was changed.
  $Status = $null
  try { $Status = [int]$_.Exception.Response.StatusCode } catch { }
  $Pat = $null; $Headers = $null
  if ($Status -eq 401 -or $Status -eq 403 -or $Status -eq 404) {
    throw @"
GitHub refused the PAT (HTTP $Status). Nothing on this machine was changed.

The registration-token endpoint needs repository ADMIN rights:
  * fine-grained PAT -> Repository permissions -> Administration: Read and write,
    and the token must list syd-omega-91717/sydomega-live under Repository access
  * classic PAT      -> repo scope

Also check: the token has not expired, it was pasted whole, and (for a
fine-grained token on an organisation) that an admin approved it.
A 404 here usually means the token is valid but cannot see this private
repository, not that the URL is wrong.
"@
  }
  throw
}
if ([string]::IsNullOrWhiteSpace($RegistrationToken)) {
  throw 'GitHub returned no runner registration token.'
}

# ---------------------------------------------------------------- register
# Only now is it safe to drop existing credentials: a replacement token exists.
Remove-Item '.\.runner', '.\.credentials', '.\.credentials_rsaparams' -Force -ErrorAction SilentlyContinue

$ConfigArgs = @(
  '--unattended',
  '--url', $RepositoryUrl,
  '--token', $RegistrationToken,
  '--name', $RunnerName,
  '--labels', 'self-hosted,Windows,X64,syd-omega',
  '--work', '_work'
)
if ($Replace) { $ConfigArgs += '--replace' }
# --runasservice is what makes config.cmd perform the service step. Without it
# the step never runs, svc.cmd is never generated, and any later `svc.cmd
# install` fails with CommandNotFoundException -- which is exactly what an
# earlier version of this script did to an operator.
if ($InstallService) { $ConfigArgs += '--runasservice' }

& $Config @ConfigArgs
if ($LASTEXITCODE -ne 0) {
  $Pat = $null; $RegistrationToken = $null; $Headers = $null
  throw "Runner registration failed with exit code $LASTEXITCODE. If the message mentions a runner with the same name, re-run with -Replace."
}
if (-not (Test-Path '.\.runner') -or -not (Test-Path '.\.credentials')) {
  throw 'Runner registration did not create local credentials; refusing to start.'
}

$Pat = $null; $RegistrationToken = $null; $Headers = $null

# ---------------------------------------------------------------- start
if ($InstallService) {
  # config.cmd --runasservice has already installed AND started the service, so
  # there is nothing further to call here. svc.cmd exists only as a by-product of
  # that step, which is why it must not be a prerequisite for it: a previous
  # version tested for svc.cmd first and could never pass.
  $svcObj = Get-Service -Name 'actions.runner.*' -ErrorAction SilentlyContinue
  if (-not $svcObj) {
    throw @"
config.cmd reported success but no 'actions.runner.*' service exists.

The service step is the part that needs elevation. If the transcript above
contains "Needs Administrator privileges for configuring runner as windows
service", registration succeeded and only the service was skipped -- re-run this
script from an elevated PowerShell.
"@
  }
  foreach ($sv in $svcObj) {
    if ($sv.Status -ne 'Running') { Start-Service -Name $sv.Name }
  }
  Get-Service -Name 'actions.runner.*' | Format-Table -AutoSize Name, Status
  Write-Host 'REGISTERED as a Windows service. It now survives logout and reboot.' -ForegroundColor Green
  exit 0
}

Write-Host 'REGISTERED: starting runner in the FOREGROUND. Expect: Listening for Jobs' -ForegroundColor Green
Write-Host 'This window must stay open -- closing it stops the runner. Re-run with -InstallService for a durable install.' -ForegroundColor Yellow
& $Run
exit $LASTEXITCODE
