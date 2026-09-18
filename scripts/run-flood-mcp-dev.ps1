param(
    [string] $BinaryPath = "",
    [switch] $CleanupOnly
)

$ErrorActionPreference = "Stop"

$mcpRunRoot = [IO.Path]::GetFullPath((Join-Path ([IO.Path]::GetTempPath()) "flood-md-mcp-dev"))
New-Item -ItemType Directory -Path $mcpRunRoot -Force | Out-Null

# A client can be terminated before the finally block runs. Clean abandoned
# launch copies on every start; Windows keeps executables used by live MCP
# clients locked, so those copies are left in place automatically.
Get-ChildItem -LiteralPath $mcpRunRoot -Filter "flood-mcp-*.exe" -File -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue

if ($CleanupOnly) {
    exit 0
}

$mcpSource = if ($BinaryPath) {
    [IO.Path]::GetFullPath($BinaryPath)
}
else {
    [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\target\debug\flood-mcp.exe"))
}
if (-not (Test-Path -LiteralPath $mcpSource -PathType Leaf)) {
    [Console]::Error.WriteLine("flood-mcp dev binary not found: $mcpSource")
    exit 1
}

$mcpRunCopy = [IO.Path]::GetFullPath((Join-Path $mcpRunRoot ("flood-mcp-{0}.exe" -f [Guid]::NewGuid().ToString("N"))))
if (-not $mcpRunCopy.StartsWith($mcpRunRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    [Console]::Error.WriteLine("Unsafe flood-mcp temporary path")
    exit 1
}

Copy-Item -LiteralPath $mcpSource -Destination $mcpRunCopy
try {
    & $mcpRunCopy @args
    exit $LASTEXITCODE
}
finally {
    Remove-Item -LiteralPath $mcpRunCopy -Force -ErrorAction SilentlyContinue
}
