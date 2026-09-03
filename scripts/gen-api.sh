#!/usr/bin/env bash
# Refresh OpenAPI snapshot from a running backend and regenerate TypeScript types.
# Usage:
#   OPENAPI_URL=http://localhost:8080/openapi.json npm run gen:api
#   npm run gen:api          # same default URL
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPEC="$ROOT/openapi/openapi.json"
OUT="$ROOT/src/api/schema.d.ts"
URL="${OPENAPI_URL:-http://localhost:8080/openapi.json}"

mkdir -p "$(dirname "$SPEC")" "$(dirname "$OUT")"

echo "Fetching OpenAPI from $URL"
if ! curl -fsSL "$URL" -o "$SPEC.tmp"; then
  echo "Failed to fetch $URL" >&2
  echo "Start the backend (./gradlew :server:run) or set OPENAPI_URL." >&2
  rm -f "$SPEC.tmp"
  exit 1
fi

python3 - "$SPEC.tmp" "$SPEC" <<'PY'
import json, sys
src, dst = sys.argv[1], sys.argv[2]
with open(src, encoding="utf-8") as f:
    data = json.load(f)
with open(dst, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY
rm -f "$SPEC.tmp"

npx openapi-typescript "$SPEC" -o "$OUT"
echo "Wrote $SPEC and $OUT"
