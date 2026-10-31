#!/usr/bin/env bash
set -uo pipefail
cd "$RUN_DIR" && ! grep -R "OldRun" -n src && bun test
