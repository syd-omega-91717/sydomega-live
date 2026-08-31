[CmdletBinding()]
param(
    [string]$Repository = 'syd-omega-91717/sydomega-live',
    [string]$RunnerDirectory = 'C:\actions-runner',
    [string]$RunnerName = 'SYD-OMEGA-WIN',
    [string]$Labels = 'self-hosted,Windows,X64',
    [switch]$InstallService
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Fail([string]$Message) {
    Write-Error $Message
    exit 1
}

Write-Host 'SYD OMEGA 91717 - GitHub self-hosted runner bootstrap'
Write-Host "Repository: $Repository"
Write-Host "Runner directory: $RunnerDirectory"

if (-not (Test-Path -LiteralPath $RunnerDirectory)) {
    New-Item -ItemType Directory -Path $RunnerDirectory | Out-Null
}
Set-Location -LiteralPath $RunnerDirectory

foreach ($required in @('config.cmd','run.cmd')) {
    if (-not (Test-Path -LiteralPath (Join-Path $RunnerDirectory $required))) {
        Fail "Runner package is incomplete: missing $required in $RunnerDirectory. Download the GitHub Actions Windows x64 runner package into this directory first."
    }
}

$patSecure = Read-Host 'Enter a GitHub PAT with repository Administration: write permission (input is hidden)' -AsSecureString
$patPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($patSecure)
try {
    $pat = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($patPtr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($patPtr)
}

if ([string]::IsNullOrWhiteSpace($pat)) {
    Fail 'No PAT supplied.'
}

$headers = @{
    Accept = 'application/vnd.github+json'
    Authorization = "Bearer $pat"
    'X-GitHub-Api-Version' = '2026-03-10'
    'User-Agent' = 'SYD-OMEGA-91717-runner-bootstrap'
}

$repoApi = "https://api.github.com/repos/$Repository"
$registrationApi = "$repoApi/actions/runners/registration-token"

try {
    $repoInfo = Invoke-RestMethod -Method Get -Uri $repoApi -Headers $headers
}
catch {
    Fail "GitHub repository authentication/access failed. The PAT must be valid and have access to $Repository. HTTP/API detail: $($_.Exception.Message)"
}

if ($repoInfo.full_name -ne $Repository) {
    Fail "GitHub resolved a different repository: $($repoInfo.full_name)"
}

try {
    $registration = Invoke-RestMethod -Method Post -Uri $registrationApi -Headers $headers
}
catch {
    Fail "GitHub refused runner registration-token creation. For a private repository the PAT must have repository Administration: write permission (or a classic PAT with repo scope). A 404 here means the token/account cannot access this runner-registration endpoint; do not retry with a stale registration token. API detail: $($_.Exception.Message)"
}

if ([string]::IsNullOrWhiteSpace($registration.token)) {
    Fail 'GitHub returned no runner registration token.'
}

Write-Host 'GitHub access verified and a fresh registration token was obtained.'
Write-Host 'Removing incomplete local runner credentials only; runner binaries are preserved.'

foreach ($file in @('.runner','.credentials','.credentials_rsaparams','.service')) {
    $path = Join-Path $RunnerDirectory $file
    if (Test-Path -LiteralPath $path) {
        Remove-Item -LiteralPath $path -Force -Recurse
    }
}

$configArgs = @(
    '--unattended',
    '--replace',
    '--url', "https://github.com/$Repository",
    '--token', $registration.token,
    '--name', $RunnerName,
    '--labels', $Labels,
    '--work', '_work'
)

Write-Host 'Registering runner. The registration token is never printed.'
& (Join-Path $RunnerDirectory 'config.cmd') @configArgs
if ($LASTEXITCODE -ne 0) {
    Fail "config.cmd failed with exit code $LASTEXITCODE. If the API token was freshly generated and the repository access check succeeded, inspect the runner diagnostic log under $RunnerDirectory\_diag."
}

if (-not (Test-Path -LiteralPath (Join-Path $RunnerDirectory '.runner'))) {
    Fail 'Registration command returned success but .runner was not created. Refusing to start an unregistered runner.'
}

Write-Host 'Runner registration succeeded.'
Write-Host "Expected labels: $Labels"
Write-Host ''
Write-Host 'Next: start the listener with:'
Write-Host "  Set-Location '$RunnerDirectory'"
Write-Host '  .\run.cmd'
Write-Host ''
Write-Host 'Keep that window running until GitHub shows the runner as Idle/online.'

if ($InstallService) {
    Write-Host 'Installing the runner service...'
    & (Join-Path $RunnerDirectory 'svc.cmd') install
    if ($LASTEXITCODE -ne 0) {
        Fail "svc.cmd install failed with exit code $LASTEXITCODE"
    }
    & (Join-Path $RunnerDirectory 'svc.cmd') start
    if ($LASTEXITCODE -ne 0) {
        Fail "svc.cmd start failed with exit code $LASTEXITCODE"
    }
    Write-Host 'Runner service installed and started.'
}

Write-Host 'BOOTSTRAP COMPLETE'
