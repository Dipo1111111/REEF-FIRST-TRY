@echo off
rem Live design loop. Runs the TUI straight from source and restarts it in place when a
rem source file changes. No build, no global install.
rem
rem   reef-ui                  open the shell in the current directory
rem   reef-ui -c               continue the last session
rem
rem Leave it open in a second terminal while the source is edited. Ctrl+C quits.
setlocal
set "PWD=%CD%"
bun run "%~dp0reef-ui.ts" %*
