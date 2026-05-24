#!/bin/bash
# Build all NestJS APIs before starting with PM2.
# Run once before `pm2 start ecosystem.config.js`, and again after any backend code change.

set -e

PROJECTS=(
  "Rail-ID-Service"
  "railML-Timetable"
  "railML-Infrastructure"
  "railML-RollingStock"
  "railML-Crew"
  "railML-StockCrewPlan"
)

BASE="$HOME/Developer"

for proj in "${PROJECTS[@]}"; do
  echo ""
  echo "▶ Building $proj API..."
  cd "$BASE/$proj/api"
  npm run build
  echo "✓ $proj API built"
done

echo ""
echo "All APIs built. Run: pm2 start $BASE/ecosystem.config.js"
