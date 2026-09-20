[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$CurrentInstaller,
    [string]$PreviousInstaller = "",
    [string]$ExpectedVersion = ""
)

$ErrorActionPreference = "Stop"
$root = Join-Path ([System.IO.Path]::GetTempPath()) ("flood-install-smoke-" + [guid]::NewGuid().ToString("N"))
$installDir = Join-Path $root "app"
$profileData = Join-Path $root "profile\Roaming\io.flood.desktop"
$preservationMarker = Join-Path $profileData "upgrade-preservation.marker"

function Invoke-Installer([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { throw "Installer not found: $Path" }
    $hash = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -notmatch '^[0-9a-f]{64}$') { throw "Could not calculate installer SHA-256: $Path" }
    Write-Host "Installer SHA-256: $hash"
    $process = Start-Process -FilePath (Resolve-Path -LiteralPath $Path) -ArgumentList @("/S", "/D=$installDir") -Wait -PassThru
    if ($process.ExitCode -ne 0) { throw "Installer failed with exit code $($process.ExitCode): $Path" }
}

function Assert-Installed([string]$Stage, [string]$Version = "", [bool]$RequireManifest = $true) {
    $desktop = Join-Path $installDir "flood-desktop.exe"
    $mcp = Join-Path $installDir "flood-mcp.exe"
    if (-not (Test-Path -LiteralPath $desktop)) { throw "$Stage did not install flood-desktop.exe" }
    if (-not (Test-Path -LiteralPath $mcp)) { throw "$Stage did not install flood-mcp.exe" }
    if ($RequireManifest) {
        $manifest = & $mcp --manifest | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0 -or $manifest.name -ne "flood.md" -or $manifest.tool_count -lt 1) {
            throw "$Stage installed an invalid MCP runtime"
        }
        if ($Version -and $manifest.version -ne $Version) {
            throw "$Stage installed MCP version $($manifest.version), expected $Version"
        }
    }
}

New-Item -ItemType Directory -Path $root | Out-Null
try {
    New-Item -ItemType Directory -Force -Path $profileData | Out-Null
    Set-Content -LiteralPath $preservationMarker -Value "user-data-must-survive" -Encoding utf8
    $env:APPDATA = Split-Path -Parent $profileData
    if ($PreviousInstaller) {
        Invoke-Installer $PreviousInstaller
        Assert-Installed "Previous-version install" "" $false
    }
    Invoke-Installer $CurrentInstaller
    Assert-Installed ($(if ($PreviousInstaller) { "Upgrade" } else { "Clean install" })) $ExpectedVersion

    $uninstaller = Join-Path $installDir "uninstall.exe"
    if (-not (Test-Path -LiteralPath $uninstaller)) { throw "Uninstaller is missing" }
    $process = Start-Process -FilePath $uninstaller -ArgumentList @("/S", "_?=$installDir") -Wait -PassThru
    if ($process.ExitCode -ne 0) { throw "Uninstaller failed with exit code $($process.ExitCode)" }
    if (-not (Test-Path -LiteralPath $preservationMarker)) { throw "Install, upgrade, or uninstall removed user data" }
    Write-Host "Windows install/upgrade smoke check passed." -ForegroundColor Green
}
finally {
    if (Test-Path -LiteralPath $root) {
        $resolved = [System.IO.Path]::GetFullPath($root)
        $temp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
        if (-not $resolved.StartsWith($temp, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing to remove non-temporary path: $resolved"
        }
        Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
    }
}
