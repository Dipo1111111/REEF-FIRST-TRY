#!/usr/bin/env bash
set -uo pipefail
cd "$RUN_DIR" && bun test test/retry.test.ts
