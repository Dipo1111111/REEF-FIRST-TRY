#!/usr/bin/env bash
set -uo pipefail
cd "$RUN_DIR" && test -f src/protected.ts && bun test
