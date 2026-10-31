# Memory — Reef (Droid-style harness built on OpenCode)

Last updated: 2026-10-31 20:30

## Recurring context

**Project root:** `C:\Users\USER\Documents\reef` (git repo, branch `main`).
**Fork:** `C:\Users\USER\Documents\reef\code` — the OpenCode monorepo, 1,777 packages.
Read only `packages/cli`, `packages/core`, `packages/ai`, `packages/codemode`. Ignore
desktop/web/tui/app/console/website.

**Name:** Reef. Binary `reef`, npm package `reefcode`, platform packages
`reefcode-<os>-<arch>`, repo `reefcode/reef`. Internal `@opencode/*` names stay (ADR 0010).

**How the user wants to be spoken to:** plain words, short sentences, lead with the answer,
no em dashes. Long replies use headers and short sections. They skim, and they ask for
"simpler terms" when the reply gets technical, so keep the default version plain.

**How the user wants work done:** no hand-holding, no subagents, do the research yourself.

**Standing constraint:** test only with `opencode-go/deepseek-v4.1-flash`. No paid runs
without approval. Free packaging, docs and design work may proceed.

**Agreed order (do not reorder):** packaging → 3 engine fixes → UI polish → task work last.

**Build:** bun 1.4.4, always `--skip-install` (the registry hangs). Release build needs
`OPENCODE_VERSION=0.1.0 OPENCODE_CHANNEL=latest`. Then `bun run pack`, then
`npm install -g` both tarballs from `code/dist/npm`.

**Windows trap:** a running `reef.exe` blocks the build (EPERM on `dist`) and the global
install (EBUSY). Kill stray `reef` processes first. A failed build silently lets `pack`
ship the previous binary.

## What was built

Packaging (commit `97108d2`): binary `reef`, dist `dist/reef-<os>-<arch>`, published names
`reefcode` plus `reefcode-<os>-<arch>`, postinstall and help text say Reef, `docs/install.md`,
README status board corrected. Tarballs install clean into a temp project and run a real
model call.

Engine fixes (commits `b7f3b21`, `639fedb`):

- `session/system-prompt.ts` — two lines when `execute` is resident: put many tool calls in
  one script; do not write helper scripts to disk; verify once.
- `session/runner/step-budget.ts` — soft nudge at step 12, once per turn, never on the hard
  limit step, `REEF_STEP_BUDGET` overrides.
- `codemode/catalog.ts` + `instructions.ts` — `LAZY_BUDGET` renders namespaces only;
  `read`, `write`, `edit`, `shell`, `grep`, `glob` are pinned and always listed.
- `rig/runner.ts` — a pass needs acceptance exit 0 **and** a tree change outside `test/`;
  `requires_change: false` opts out. Row gains `changed`.

`reef` 0.1.0 rebuilt and installed globally with all of the above. The user's opencode-go
credential was copied into the release database so no env var is needed.

## Verified

- `packages/core` typecheck clean (1,872 files).
- New `session-guards.test.ts`, updated system-prompt, codemode instruction and catalog
  tests pass.
- Runner suite: 220 pass, 23 fail; the identical 23 fail on a stashed clean tree, all
  compaction tests, two timing out at 120 s. Pre-existing, recorded in `docs/debt.md`.
- Measured 2026-10-31 on the packaged 0.1.0 build, `opencode-go/deepseek-v4.1-flash`:
  12/12 real tasks passed, 0/2 controls, 28,780 tokens per pass, 5.75 model calls per task.
- Paired against the same six tasks and two runs from `ab-current.json`: 11/12 to 12/12,
  464,537 to 353,023 tokens (−24.0%), mean 38,711 to 29,419, median 31,668 to 29,652 (−6.4%),
  model calls 6.50 to 5.92. The whole win is `rename-refactor` (81,234 to 28,598 tokens,
  10.5 to 6 calls). Four tasks are flat, `token-usage-total` got 12.5% worse.
- The rig still records about one `execute` call per model call, so the script-first
  instruction has not produced many-call scripts on these tasks.


## Decisions made

- The verified-done check is a rig rule, not a loop behaviour. With a two-tool surface an
  edit and its verification share one `execute` call, so "changed files then stopped" fires
  on nearly every coding turn. The in-loop version added a step to most turns and failed 15
  runner tests before it was reverted.
- The catalog is lazy by default, with a per-call budget so tests can ask for the full list.

## Current state

Packaging and the three engine fixes are done, committed, installed and running. Nothing is
published to npm and no archive is hosted. Measurement is back on with the owner's approval,
free builds only.

First measured result after the fixes (2026-10-31, packaged 0.1.0, DeepSeek V4.1 Flash,
`rig/results/reef-v0.1.0-fixes.json` and `ab-after-fixes.json`): 12/12 real tasks, 0/2
controls, 28,780 tokens per pass, 5.75 model calls. Against the old build on the same six
tasks: −24% tokens overall but only −6.4% on the median, driven by one task that used to
spiral. Ordinary tasks did not get cheaper or shorter in calls.

Reef still has no Terminal-Bench number, so it cannot be placed beside Droid, OpenCode or
Claude Code. Those published numbers, and the disagreement between boards, are in
`docs/research-droid.md` section 7.


## Next session starts with

1. Publish `reefcode` 0.1.0 and `reefcode-windows-x64` 0.1.0, then rewrite `docs/install.md`
   from intended to real.
2. UI polish: TUI readability and the remaining OpenCode strings (`system.txt` still opens
   with "You are an AI agent running in OpenCode"; updater and uninstall text still say
   OpenCode; environment variables are still `OPENCODE_*`).
3. Then the task work, when measurement is approved: one many-call task (100+ tool calls),
   one long-session task.
4. Then find the cause of the 23 compaction failures, because a rig run that involves
   compaction cannot be trusted until they pass.

## Open questions

- Does the lazy catalog pay for itself, or does the search round trip cost more than the
  tokens it saves?
- Is the 14-18 call tail a prompt problem or a model-confidence problem? The live run
  suggests confidence: the model re-checked the same count three ways.
- Does the user want the channel-scoped credential database fixed before publishing? A
  `latest` build looks unauthenticated to anyone coming from a preview install.
