[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$evidenceDir = Join-Path $repoRoot "target\stable-verification"
$stdoutPath = Join-Path $env:TEMP "flood-performance-$([guid]::NewGuid()).json"
$stderrPath = Join-Path $env:TEMP "flood-performance-$([guid]::NewGuid()).err"

$budgets = [ordered]@{
    startup = 500
    open_project_1100 = 1000
    task_list_1100 = 1000
    search_1100 = 250
    save_with_conflict_check = 500
    context_compile = 1000
    agent_queue_100 = 500
    peak_working_set_mb = 300
}

Push-Location $repoRoot
try {
    & cargo build --release -p flood-core --example performance_budgets
    if ($LASTEXITCODE -ne 0) { throw "Performance fixture build failed" }

    $binary = Join-Path $repoRoot "target\release\examples\performance_budgets.exe"
    $process = Start-Process -FilePath $binary -NoNewWindow -PassThru -Wait -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
    if ($process.ExitCode -ne 0) {
        throw "Performance fixture failed: $(Get-Content -LiteralPath $stderrPath -Raw)"
    }
    $result = Get-Content -LiteralPath $stdoutPath -Raw | ConvertFrom-Json
    $peakMb = [math]::Round($process.PeakWorkingSet64 / 1MB, 2)
    foreach ($name in @("startup", "open_project_1100", "task_list_1100", "search_1100", "save_with_conflict_check", "context_compile", "agent_queue_100")) {
        if ($result.measurements_ms.$name -gt $budgets[$name]) {
            throw "$name exceeded budget: $($result.measurements_ms.$name) ms > $($budgets[$name]) ms"
        }
    }
    if ($peakMb -gt $budgets.peak_working_set_mb) {
        throw "Peak working set exceeded budget: $peakMb MB > $($budgets.peak_working_set_mb) MB"
    }
    if ($result.facts.search_hits -ne 1 -or $result.facts.conflict_detected -ne $true -or $result.facts.reopened_tasks -ne 1100) {
        throw "Performance fixture produced invalid functional evidence"
    }

    New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null
    $evidence = [ordered]@{
        schema_version = 1
        generated_at = (Get-Date).ToUniversalTime().ToString("o")
        hardware = [ordered]@{
            os = [System.Environment]::OSVersion.VersionString
            processors = [System.Environment]::ProcessorCount
        }
        budgets = $budgets
        measurements_ms = $result.measurements_ms
        peak_working_set_mb = $peakMb
        fixture = $result.fixture
    }
    $evidence | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $evidenceDir "performance.json") -Encoding utf8
}
finally {
    Pop-Location
    Remove-Item -LiteralPath $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue
}
