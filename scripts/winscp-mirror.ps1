<#
.SYNOPSIS
  Mirror the BUILT site (public/) to a secondary SFTP/FTP host with WinSCP.

.DESCRIPTION
  Production is Cloudflare Pages, fed by Git (CLAUDE.md 8.2). This script is NOT
  a deploy path for it: it exists for a backup/staging mirror. It uploads
  public/ only (the build output, so scripts/, supabase/, mobile/ and other
  excluded material can never be sent), and it never touches the repo root.

  Safe by default: runs as a PREVIEW (no changes) unless -Apply is given, and
  never deletes remote files unless -Delete is also given.

  Credentials are read from the environment, never from a file in the repo:
    WINSCP_HOST         host name
    WINSCP_USER         user name
    WINSCP_PASS         password        (or WINSCP_KEY = path to a .ppk key)
    WINSCP_FINGERPRINT  host key, e.g. "ssh-ed25519 255 SHA256:..." (required;
                        there is deliberately no accept-any option)
    WINSCP_REMOTE_DIR   remote target directory, e.g. /var/www/mirror

.EXAMPLE
  bash scripts/vercel-build.sh        # produce public/ first
  .\scripts\winscp-mirror.ps1         # preview
  .\scripts\winscp-mirror.ps1 -Apply  # upload
#>
[CmdletBinding()]
param(
  [switch]$Apply,
  [switch]$Delete,
  [ValidateSet('sftp','ftps','ftp')] [string]$Protocol = 'sftp',
  [string]$WinScp = 'C:\Program Files (x86)\WinSCP\WinSCP.com'
)
$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$pub  = Join-Path $root 'public'
if (-not (Test-Path (Join-Path $pub 'index.html'))) {
  throw "public/index.html not found. Run 'bash scripts/vercel-build.sh' first."
}
if (-not (Test-Path $WinScp)) { throw "WinSCP.com not found at $WinScp (use -WinScp)." }

foreach ($v in 'WINSCP_HOST','WINSCP_USER','WINSCP_FINGERPRINT','WINSCP_REMOTE_DIR') {
  if (-not [Environment]::GetEnvironmentVariable($v)) { throw "Set environment variable $v." }
}
if (-not $env:WINSCP_PASS -and -not $env:WINSCP_KEY) { throw 'Set WINSCP_PASS or WINSCP_KEY.' }
if ($env:WINSCP_REMOTE_DIR -in '/','','~') { throw 'Refusing to mirror into the remote root.' }

# Secrets go to a temp script that is deleted afterwards; they never reach argv.
$auth = if ($env:WINSCP_KEY) { "-privatekey=`"$($env:WINSCP_KEY)`"" } else { "-password=`"$($env:WINSCP_PASS)`"" }
$flags = @('-criteria=either','-transfer=binary','-filemask="|.git/;*.map"')
if (-not $Apply)  { $flags += '-preview' }
if ($Delete)      { $flags += '-delete' }

$lines = @(
  'option batch abort',
  'option confirm off',
  "open $Protocol`://$($env:WINSCP_USER)@$($env:WINSCP_HOST)/ $auth -hostkey=`"$($env:WINSCP_FINGERPRINT)`"",
  "synchronize remote `"$pub`" `"$($env:WINSCP_REMOTE_DIR)`" $($flags -join ' ')",
  'exit'
)
$tmp = New-TemporaryFile
try {
  Set-Content -Path $tmp -Value $lines -Encoding ASCII
  Write-Host ("WinSCP mirror: {0} -> {1}:{2} [{3}{4}]" -f $pub, $env:WINSCP_HOST, $env:WINSCP_REMOTE_DIR,
    $(if ($Apply) {'APPLY'} else {'PREVIEW'}), $(if ($Delete) {' +DELETE'} else {''}))
  & $WinScp "/ini=nul" "/script=$tmp" "/log=$([IO.Path]::Combine($env:TEMP,'winscp-mirror.log'))"
  if ($LASTEXITCODE -ne 0) { throw "WinSCP exited with code $LASTEXITCODE" }
} finally {
  Remove-Item -Force $tmp -ErrorAction SilentlyContinue
}
