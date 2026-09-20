[CmdletBinding()]
param(
    [string]$ExpectedTag = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

$package = Get-Content -LiteralPath (Join-Path $repoRoot "package.json") -Raw | ConvertFrom-Json
$tauri = Get-Content -LiteralPath (Join-Path $repoRoot "src-tauri\tauri.conf.json") -Raw | ConvertFrom-Json
$cargoText = Get-Content -LiteralPath (Join-Path $repoRoot "Cargo.toml") -Raw
$workspacePackage = [regex]::Match($cargoText, '(?ms)^\[workspace\.package\]\s*(.*?)(?=^\[|\z)')
$cargoMatch = [regex]::Match($workspacePackage.Groups[1].Value, '(?m)^version\s*=\s*"([^"]+)"')
if (-not $cargoMatch.Success) { throw "Cargo.toml has no workspace package version" }

$versions = @(@($package.version, $tauri.version, $cargoMatch.Groups[1].Value) | Select-Object -Unique)
if ($versions.Count -ne 1) {
    throw "Release versions differ: package=$($package.version), tauri=$($tauri.version), cargo=$($cargoMatch.Groups[1].Value)"
}

if ($ExpectedTag) {
    $expected = $ExpectedTag.TrimStart('v')
    if ($expected -ne $versions[0]) { throw "Tag $ExpectedTag does not match application version $($versions[0])" }
}

if ($tauri.bundle.createUpdaterArtifacts -ne $true) { throw "Updater artifacts are disabled" }
if (-not $tauri.plugins.updater.pubkey) { throw "Updater public key is missing" }
if (@($tauri.plugins.updater.endpoints).Count -lt 1) { throw "Updater endpoint is missing" }
if ($tauri.bundle.windows.nsis.installMode -ne "currentUser") { throw "NSIS install mode must remain currentUser" }

Write-Host "Release contract verified for $($versions[0])." -ForegroundColor Green
