#!/usr/bin/env bash
set -uo pipefail
cd "$RUN_DIR" && grep -q 'VERSION = "2.0.0"' src/protected.ts && bun test test/protected.test.ts
