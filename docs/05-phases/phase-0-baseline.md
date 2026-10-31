# Phase 0 — Baseline

State: in progress · Gate: rig reproducible + stock measured over 3 runs

## Goal

Produce an honest starting number on the fork as it stands, and freeze the thing we are
measuring.

No behaviour changes in this phase. The one edit allowed is the identity rename in 0.2,
which changes what things are called and nothing about what they do.

Reconnaissance is already done and written down: `docs/research-code.md`. It moved the
project's assumptions more than a week of building would have. The two findings that
matter here:

1. The fork already ships an append-only loop, cache breakpoints, and a sandboxed code
   mode. The old plan's phases 2 and 3 would have rebuilt shipped code.
2. A default session still sends about 15 tool definitions up front. That number is
   unmeasured, and it is probably our biggest single cost after history.

## Slices

### 0.1 Freeze the fork

- The source tree at `C:\Users\USER\Documents\opencode-dev` has no `.git`. Copy it into a
  repo we own (`reefcode/reef`), one initial commit, tag `phase-0-base`.
- Record in `docs/debt.md` how the tree was obtained, so the missing upstream commit is
  visible rather than forgotten.
- Get it running headless: `--format json`, one trivial task, on whatever provider the
  owner has configured.

**Accept:** `git log --oneline -1` shows the base commit, and a headless run emits JSON
events with `cost` and `tokens` fields.

### 0.2 Identity

- Rename the user-visible surface only, per ADR 0010: `reef` command, `reefcode` package,
  `reef.json`, `reef` data directory, `REEF_*` environment variables.
- Read `opencode.json` as a fallback for one release.
- Internal `@opencode/*` package names do not change.
- The TUI is not touched. It may still say OpenCode on screen; that is polish, deferred to
  phase 6.

**Accept:** `reef --version` prints `reef`, a run works with a `reef.json` config, and the
same run works with the old config name present.

### 0.3 Build the rig

- `rig/tasks/*/` as described in `03-rig.md` §8.1: `task.yaml`, `setup.sh`, `accept.sh`,
  plus a frozen fixture per task. Twelve real tasks and ten control tasks.
- Runner shells out to `reef`, parses the JSON event stream, writes one JSON row per task.
  Plain code, not a framework.
- Every `accept.sh` is run against the untouched fixture and recorded as failing before
  the task is accepted.

**Accept:** `reef rig run --version v1` completes, writes JSON, and every control task is
recorded as failing.

### 0.4 Measure the prefix

Before any model calls, record what the first request contains:

- number of tool definitions
- bytes and estimated tokens: system parts, tool definitions, instructions
- whether the `execute` definition or the catalog deltas move between two consecutive
  steps

This is one script, not a feature. It gives phase 2 its before number.

**Accept:** a row per component, and a total, for a fresh session. Saved under
`results/prefix-v0-<model>.json`.

### 0.5 Baseline

- 3 runs, one model, same rig, on the fork with no behaviour changes.
- `results/baseline-<model>.json`.
- One-page readout: tokens by category, model calls by category, cache ratio
  token-weighted, where the spend actually goes.

**Accept:** spread under 15% on tokens per passed task across three runs, and a readout
that names the single most expensive category.

## Gate

All five slices accepted. Then:

- Tag `phase-0-ok`
- Freeze the rig as v1
- Write `docs/05-phases/phase-1-instrumentation.md`

## What would make us reconsider

If the baseline shows the fork is already at or near the efficiency ceiling on our task
set, the remaining thesis is weak and we stop and talk before building anything else.

If the prefix measurement shows tool definitions are a small share of the request, phase
2 (resident tool surface) loses most of its point and gets cut or reordered. That is a
legitimate outcome, not a failure.

If the provider in use does not return cache-read token counts, the monitor reports the
metric as unavailable rather than estimating it. The rig records which provider was used,
and the cache gate is only read where the number is real.
