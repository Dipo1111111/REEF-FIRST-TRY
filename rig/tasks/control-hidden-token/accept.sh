#!/usr/bin/env bash
set -uo pipefail
cd "$RUN_DIR" && bun test test/guess.test.ts
