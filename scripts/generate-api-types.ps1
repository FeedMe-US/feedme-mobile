# Generate TypeScript types from OpenAPI spec
# Usage: powershell -ExecutionPolicy Bypass -File scripts/generate-api-types.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$SharedDir = Join-Path $ProjectRoot "shared"
$OutputFile = Join-Path $ProjectRoot "src\types\api.generated.ts"
$OpenApiFile = Join-Path $SharedDir "openapi.json"

# Check OpenAPI spec exists
if (-not (Test-Path $OpenApiFile)) {
    Write-Host "Error: $OpenApiFile not found" -ForegroundColor Red
    Write-Host "Run 'npm run api:fetch' to download the OpenAPI spec from feedme-docs" -ForegroundColor Yellow
    exit 1
}

Write-Host "Generating TypeScript types from OpenAPI spec..." -ForegroundColor Cyan

# Run openapi-typescript
$npmBin = Join-Path $ProjectRoot "node_modules\.bin"
$openapiTs = Join-Path $npmBin "openapi-typescript.cmd"

if (Test-Path $openapiTs) {
    & $openapiTs $OpenApiFile --output $OutputFile
} else {
    # Try npx if not installed locally
    npx openapi-typescript $OpenApiFile --output $OutputFile
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: openapi-typescript failed" -ForegroundColor Red
    exit 1
}

# Count generated types
$typeCount = (Get-Content $OutputFile | Select-String -Pattern "export (type|interface)" | Measure-Object).Count

Write-Host "Generated $OutputFile" -ForegroundColor Green
Write-Host "  Types: $typeCount" -ForegroundColor Gray

Write-Host "Done!" -ForegroundColor Green
