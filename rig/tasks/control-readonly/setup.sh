#!/usr/bin/env bash
set -euo pipefail
cp -R "$FIXTURE_DIR"/. "$RUN_DIR"/
chmod -w "$RUN_DIR/src/slow.ts" 2>/dev/null || attrib +R "$RUN_DIR/src/slow.ts" >/dev/null 2>&1 || true
