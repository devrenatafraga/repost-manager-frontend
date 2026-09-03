#!/usr/bin/env bash
# Regenerate types from the committed OpenAPI snapshot and fail if they drift.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPEC="$ROOT/openapi/openapi.json"
OUT="$ROOT/src/api/schema.d.ts"

if [[ ! -f "$SPEC" ]]; then
  echo "Missing $SPEC — run npm run gen:api against a live backend first." >&2
  exit 1
fi

npx openapi-typescript "$SPEC" -o "$OUT"

if ! git -C "$ROOT" diff --quiet -- "$OUT"; then
  echo "OpenAPI types are out of date. Run: npm run gen:api:check (or gen:api) and commit." >&2
  git -C "$ROOT" --no-pager diff -- "$OUT"
  exit 1
fi

echo "OpenAPI types are in sync with openapi/openapi.json"
