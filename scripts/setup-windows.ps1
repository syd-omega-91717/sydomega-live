<#
.SYNOPSIS
    One-command Windows setup for working on sydomega-live with Claude Code.

.DESCRIPTION
    Installs the Claude Code CLI, verifies this repo's committed MCP config, and
    hands you the one step a script cannot do for you: the browser login.

    WHY THIS EXISTS

    Four things trip people up on Windows, and this script handles the three
    that are automatable:

      1. `claude` is not recognized. The CLI is an npm global; without it every
         `claude ...` command fails with CommandNotFoundException.
      2. PATH does not refresh in an already-open PowerShell window, so `claude`
         stays "not recognized" straight after a successful install until the
         terminal is reopened. This script updates PATH in the current session
         so you can keep working in the same window.
      3. `claude mcp add --scope project ...` is unnecessary here, and running
         it from the wrong directory is actively unhelpful: --scope project
         writes .mcp.json into the CURRENT directory, so running it from
         C:\Users\HP leaves a stray config in your home folder while the repo's
         real one goes untouched. This repo already commits .mcp.json with the
         Supabase server configured, so there is nothing to add.

    The fourth is not automatable and is called out at the end: authorizing the
    Supabase MCP is an OAuth login in a browser. A script cannot click it.

    WHAT THIS DOES NOT DO

    It does not give the CLOUD Claude Code session (claude.ai/code) access to
    Supabase. That session's connectors live on your account, not on this PC --
    authorize those at claude.ai -> Settings -> Connectors. The two are
    independent; doing one does not do the other.

.EXAMPLE
    # From the repository root:
    powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1

.NOTES
    Read-only except for the npm global install. It does not modify the repo,
    your profile, or your persistent PATH.
#>

[CmdletBinding()]
param(
    # Report what is missing and exit without installing anything.
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'

function Write-Step($n, $text) { Write-Host "`n[$n] $text" -ForegroundColor Cyan }
function Write-Ok($text)       { Write-Host "    OK    $text" -ForegroundColor Green }
function Write-Warn2($text)    { Write-Host "    WARN  $text" -ForegroundColor Yellow }
function Write-Bad($text)      { Write-Host "    FAIL  $text" -ForegroundColor Red }

Write-Host "sydomega-live - Windows setup" -ForegroundColor White
Write-Host "=============================" -ForegroundColor White

# --- 1. Node ---------------------------------------------------------------
Write-Step 1 "Checking Node.js"
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Bad "Node.js not found."
    Write-Host "    Install the LTS build from https://nodejs.org/ , reopen"
    Write-Host "    PowerShell, then run this script again."
    exit 1
}
Write-Ok "node $(node --version)  ($($node.Source))"

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Bad "npm not found even though node is present - reinstall Node.js."
    exit 1
}
Write-Ok "npm  $(npm --version)"

# --- 2. Claude Code --------------------------------------------------------
Write-Step 2 "Checking Claude Code CLI"
$claude = Get-Command claude -ErrorAction SilentlyContinue
if ($claude) {
    Write-Ok "already installed: $(claude --version)"
}
elseif ($CheckOnly) {
    Write-Warn2 "not installed (re-run without -CheckOnly to install)"
}
else {
    Write-Host "    Installing @anthropic-ai/claude-code (global)..."
    npm install -g @anthropic-ai/claude-code
    if ($LASTEXITCODE -ne 0) {
        Write-Bad "npm install failed with exit code $LASTEXITCODE."
        Write-Host "    If this is a permissions error, try a new PowerShell"
        Write-Host "    window opened with 'Run as administrator'."
        exit 1
    }

    # PATH in THIS window is a snapshot taken when the window opened, so a
    # freshly installed global is invisible until the terminal is reopened.
    # Rebuilding it from the registry values avoids that restart.
    $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') +
                ';' +
                [System.Environment]::GetEnvironmentVariable('Path', 'User')

    $claude = Get-Command claude -ErrorAction SilentlyContinue
    if ($claude) {
        Write-Ok "installed: $(claude --version)"
    }
    else {
        Write-Warn2 "installed, but not on PATH in this window yet."
        Write-Host "    Close and reopen PowerShell, then run 'claude --version'."
    }
}

# --- 3. Repo + committed MCP config ---------------------------------------
Write-Step 3 "Checking this repository's MCP config"
$repoRoot = Split-Path -Parent $PSScriptRoot
$mcpPath  = Join-Path $repoRoot '.mcp.json'

if (-not (Test-Path $mcpPath)) {
    Write-Bad ".mcp.json not found at $mcpPath"
    Write-Host "    Are you running this from inside the sydomega-live clone?"
    exit 1
}

try {
    $mcp = Get-Content $mcpPath -Raw | ConvertFrom-Json
}
catch {
    Write-Bad ".mcp.json exists but does not parse as JSON: $($_.Exception.Message)"
    exit 1
}

$names = @($mcp.mcpServers.PSObject.Properties.Name)
if ($names -contains 'supabase') {
    Write-Ok "supabase server already configured - do NOT run 'claude mcp add'"
    Write-Host "    (configured servers: $($names -join ', '))"
}
else {
    Write-Warn2 "no 'supabase' entry in .mcp.json (found: $($names -join ', '))"
}

# --- 4. The part a script cannot do ---------------------------------------
Write-Step 4 "Remaining step - a browser login, which must be done by hand"
Write-Host ""
Write-Host "    For THIS machine:" -ForegroundColor White
Write-Host "      cd `"$repoRoot`""
Write-Host "      claude"
Write-Host "      # approve the project MCP server when prompted, then type:"
Write-Host "      /mcp        -> select 'supabase' -> Authenticate"
Write-Host ""
Write-Host "    For the CLOUD session (claude.ai/code):" -ForegroundColor White
Write-Host "      claude.ai -> Settings -> Connectors -> authorize Supabase"
Write-Host "      This is separate. Authorizing here does not authorize there,"
Write-Host "      and vice versa."
Write-Host ""
Write-Host "Setup checks complete." -ForegroundColor Green
