# Build all NestJS APIs before starting with PM2.
# Run once before `pm2 start ecosystem.config.js`, and again after any backend code change.
#
# Usage: .\build-all.ps1
# If execution policy blocks the script: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

$ErrorActionPreference = 'Stop'

$projects = @(
    'Rail-ID-Service'
    'railML-Timetable'
    'railML-Infrastructure'
    'railML-RollingStock'
    'railML-Crew'
    'railML-StockCrewPlan'
)

$base = "$HOME\Developer"

foreach ($proj in $projects) {
    Write-Host ""
    Write-Host "▶ Building $proj API..."
    Set-Location "$base\$proj\api"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed for $proj"
        exit 1
    }
    Write-Host "✓ $proj API built"
}

Write-Host ""
Write-Host "All APIs built. Run: pm2 start $base\ecosystem.config.js"
