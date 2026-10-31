@echo off
rem Dev entry point for Reef. A packaged release uses the npm bin instead.
rem --cwd anchors module resolution (the TUI's optional react peer is only
rem resolved inside packages/cli). PWD keeps the caller's directory as the
rem project root, which is what `run` reads.
setlocal
set "HERE=%~dp0"
set "PWD=%CD%"
bun run --cwd "%HERE%..\code\packages\cli" src\index.ts %*
