param(
    [string] $BinaryPath = ""
)

$ErrorActionPreference = "Stop"

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

$mcpRunRoot = [IO.Path]::GetFullPath((Join-Path ([IO.Path]::GetTempPath()) "flood-md-mcp-dev"))
New-Item -ItemType Directory -Path $mcpRunRoot -Force | Out-Null
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
