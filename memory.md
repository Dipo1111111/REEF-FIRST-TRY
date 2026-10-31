# Memory — Reef (Droid-style harness built on OpenCode)

Last updated: 2026-10-31 20:45

## Recurring context

**Project root:** `C:\Users\USER\Documents\reef` (git repo, branch `main`).
**Fork:** `C:\Users\USER\Documents\reef\code` — the OpenCode monorepo, 1,777 packages.
Only read `packages/cli`, `packages/core`, `packages/ai`, `packages/codemode`. Ignore
desktop/web/tui/app/console/website. `C:\Users\USER\Documents\opencode-dev` is the old
snapshot with no `.git`; the live tree is `code/`.

**Name:** Reef. Binary `reef`, npm package `reefcode`, platform packages
`reefcode-<os>-<arch>` (scopeless), repo `reefcode/reef`. npm `reef` and `reef-cli` are
taken. Internal `@opencode/*` package names stay for mergeability (ADR 0010).

**How the user wants to be spoken to:** plain words, short sentences, no jargon, lead with
the answer, no em dashes. Prose for short replies. Long replies use headers and short
sections, one idea per block. They skim.

**How the user wants work done:** no hand-holding, no subagents, do the research and
writing yourself. Bring back only decisions that genuinely need them.

**Standing constraint:** test only with `opencode-go/deepseek-v4.1-flash`. No paid runs
without approval. Free packaging, docs and design work may proceed.

**Agreed order (user restated 2026-10-31, do not reorder):**
packaging → 3 engine fixes → UI polish → task work (long-session, many-call) very last.

**Build environment:** bun 1.4.4. `bun install` from the registry hangs on this machine
("registry requests failed, retrying"), so build with `--skip-install`. Release builds need
`OPENCODE_VERSION=0.1.0 OPENCODE_CHANNEL=latest` or the version becomes
`0.0.0-main-<timestamp>`.

## What was built this session

- `code/packages/cli/script/build.ts` — binary is `reef`; dist dirs `dist/reef-<os>-<arch>`
  with `bin/reef[.exe]`; per-target package name `reefcode-<os>-<arch>`; user agent
  `reef/<channel>/<version>/cli`; `OPENCODE_CLI_NAME` is `reef`.
- `code/packages/cli/script/pack.ts` — publishes `reefcode` with `bin.reef`, prefix
  `reefcode-`, repo URL `reefcode/reef`. Directory lookup now comes from each manifest
  instead of string-replacing the package name, because build dirs and package names differ.
- `code/packages/cli/script/postinstall.mjs` — messages say Reef, temp prefix `reef-install-`.
- `code/packages/cli/script/service-smoke.ts` — points at the reef dist dir, binary, data
  and state dirs.
- `code/packages/cli/src/commands/commands.ts`, `src/acp/service.ts` — help text and ACP
  agent name say Reef.
- `docs/install.md` — install paths, first run, where Reef writes, known gaps, source build.
- `README.md` — install section, status board corrected (phases 1-4 done, 5 in progress).
- `docs/debt.md` — struck the version-string item, added publish and env-rename items.
- Commit `97108d2`.

## Verified

- Build: 2,044 files typecheck clean (`bun run typecheck` in `packages/cli`).
- `reef --version` → `reef v0.1.0`; `--help` description says Reef.
- Real call through the packaged binary: `run --standalone --model
  opencode-go/deepseek-v4.1-flash` answered correctly.
- `bun run pack` → `code/dist/npm/reefcode-0.1.0.tgz` (2.9 KB) and
  `reefcode-windows-x64-0.1.0.tgz` (96 MB, 234 MB unpacked).
- Installed both tarballs into a clean temp project: postinstall linked the binary,
  `.bin/reef.cmd` ran, `reef v0.1.0`, and one real model call succeeded from the installed
  copy. Packaging is proven locally; only publishing is missing.

## Problems solved

- `pack` failed on `ENOENT dist/reefcode-windows-x64` because it rebuilt directory paths by
  stripping `@opencode/` from the package name. Fixed by mapping name to directory during
  the manifest scan.
- Packaged binary reported "Model unavailable: opencode-go/..." and `auth list` said no
  authenticated integrations. Cause is channel-scoped databases, not a packaging bug:
  preview builds read `opencode-<channel>.db`, `latest` reads `opencode.db`, and the
  opencode-go credential on this machine lives in `opencode-local.db`. Point `OPENCODE_DB`
  at the database that holds the credential to test a `latest` build.
- `auth list` is unreliable for diagnosing this (known debt); the prompt run is the test.

## Current state

Packaging is complete and committed. Nothing is published: no npm account used, no archive
hosted, install docs still say "not published yet". The engine is unchanged from phase 4.

## Next session starts with

1. Publish `reefcode` 0.1.0 and `reefcode-windows-x64` 0.1.0 (needs the user's npm access),
   then flip `docs/install.md` from intended to real. Linux archives come from
   `pack.ts`; macOS and Windows install through npm.
2. Then the three engine fixes in this order: script-first instruction plus step budget
   (kill the 14-18 call tail), verified-done guard (clean test run and non-empty diff), lazy
   tool catalog.
3. Then UI polish (TUI readability, remaining OpenCode strings).
4. Then the task work last: one many-call task (100+ tool calls), one long-session task,
   both only when measurement is approved.

## Open questions

- Does the user want the channel-db behaviour fixed before publishing (a `latest` build
  looks unauthenticated to anyone coming from a preview install)?
- Same-model head-to-head is possible now that Reef is packaged. Claude Code is
  Anthropic-bound; OpenCode is the fair pair for DeepSeek.
- Is the 14-18 call tail a prompt problem or a model-confidence problem? The script-first
  instruction is the cheap test.
