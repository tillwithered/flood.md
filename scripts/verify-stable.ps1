[CmdletBinding()]
param(
    [switch]$SkipInstall,
    [switch]$SkipTauriBuild
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$verificationDir = Join-Path $repoRoot "target\stable-verification"

function Invoke-VerifiedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [string]$Executable,
        [Parameter(Mandatory = $false)]
        [string[]]$Arguments = @()
    )

    Write-Host "`n==> $Label" -ForegroundColor Cyan
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

function Read-JsonCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [string]$Executable,
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Write-Host "`n==> $Label" -ForegroundColor Cyan
    $output = & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }

    try {
        return $output | ConvertFrom-Json
    }
    catch {
        throw "$Label returned invalid JSON: $($_.Exception.Message)"
    }
}

Push-Location $repoRoot
try {
    if (-not $SkipInstall) {
        Invoke-VerifiedCommand "Install locked frontend dependencies" "npm" @("ci")
    }

    Invoke-VerifiedCommand "Frontend type and policy checks" "npm" @("run", "check")
    Invoke-VerifiedCommand "Frontend production build" "npm" @("run", "build")
    Invoke-VerifiedCommand "Rust formatting" "cargo" @("fmt", "--all", "--", "--check")
    # The desktop crate declares the release MCP binary as a bundled resource,
    # so it must exist before workspace-wide clippy/build checks reach Tauri.
    Invoke-VerifiedCommand "Release MCP binary" "cargo" @("build", "--release", "-p", "flood-mcp", "--bin", "flood-mcp")
    Invoke-VerifiedCommand "Rust clippy" "cargo" @("clippy", "--workspace", "--all-targets", "--", "-D", "warnings")
    Invoke-VerifiedCommand "Rust workspace tests" "cargo" @("test", "--workspace")
    Invoke-VerifiedCommand "Realistic workspace performance budgets" "powershell" @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", (Join-Path $repoRoot "scripts\measure-performance.ps1")
    )

    $mcpBinary = Join-Path $repoRoot "target\release\flood-mcp.exe"
    if (-not (Test-Path -LiteralPath $mcpBinary)) {
        throw "Release MCP binary was not produced at $mcpBinary"
    }

    $manifest = Read-JsonCommand "MCP manifest" $mcpBinary @("--manifest")
    if ($manifest.name -ne "flood.md") {
        throw "Unexpected MCP manifest name: $($manifest.name)"
    }
    if ($manifest.protocol_version -ne "2026-07-28") {
        throw "Unexpected primary MCP protocol: $($manifest.protocol_version)"
    }
    if ($manifest.tool_count -lt 1) {
        throw "MCP manifest contains no tools"
    }
    if ($manifest.tool_catalog_revision -notmatch "^[0-9a-f]{64}$") {
        throw "MCP catalog revision is not a SHA-256 digest"
    }

    $selfCheck = Read-JsonCommand "MCP isolated self-check" $mcpBinary @("--self-check")
    if ($selfCheck.passed -ne $true) {
        $failedChecks = @($selfCheck.checks | Where-Object { $_.passed -ne $true } | ForEach-Object { $_.name })
        throw "MCP self-check failed: $($failedChecks -join ', ')"
    }

    if (-not $SkipTauriBuild) {
        Invoke-VerifiedCommand "Tauri production application build" "npm" @("run", "tauri", "build", "--", "--no-bundle")
    }

    $artifactPaths = @($mcpBinary)
    $desktopBinary = Join-Path $repoRoot "target\release\flood-desktop.exe"
    if (-not $SkipTauriBuild) {
        if (-not (Test-Path -LiteralPath $desktopBinary)) {
            throw "Tauri desktop binary was not produced at $desktopBinary"
        }
        $artifactPaths += $desktopBinary
    }

    $artifacts = @($artifactPaths | ForEach-Object {
        $item = Get-Item -LiteralPath $_
        $hash = Get-FileHash -LiteralPath $_ -Algorithm SHA256
        [ordered]@{
            name = $item.Name
            bytes = $item.Length
            sha256 = $hash.Hash.ToLowerInvariant()
        }
    })

    New-Item -ItemType Directory -Force -Path $verificationDir | Out-Null
    $evidence = [ordered]@{
        schema_version = 1
        generated_at = (Get-Date).ToUniversalTime().ToString("o")
        git_commit = (& git rev-parse HEAD).Trim()
        mcp_manifest = $manifest
        mcp_self_check = [ordered]@{
            passed = $selfCheck.passed
            duration_ms = $selfCheck.duration_ms
            check_count = @($selfCheck.checks).Count
        }
        artifacts = $artifacts
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to resolve the verified git commit"
    }

    $evidencePath = Join-Path $verificationDir "evidence.json"
    $evidence | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $evidencePath -Encoding utf8

    Write-Host "`nStable verification passed." -ForegroundColor Green
    Write-Host "Evidence: $evidencePath"
    foreach ($artifact in $artifacts) {
        Write-Host "$($artifact.name)  $($artifact.sha256)"
    }
}
finally {
    Pop-Location
}
