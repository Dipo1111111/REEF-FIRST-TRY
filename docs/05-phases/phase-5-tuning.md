# Phase 5 — Tuning and finish

Started 2026-10-31. Gate: tokens per passed task −25%, wall clock −15%, pass rate not lower.

## Order chosen by the owner

Packaging first, then the three engine fixes, then UI polish, then the task work last.
Packaging closed on 2026-10-31 at `reefcode` 0.1.0 (built, packed and installed locally; not
published). This file covers the engine fixes.

## What changed

1. **Script-first instruction.** The default system prompt tells the model to put many tool
   calls in one `execute` script instead of one call per step, whenever `execute` is a
   resident tool. It is one line, and it sits in the stable, cache-marked part of the prompt.
2. **Soft step budget.** `runner/step-budget.ts`. At step 12 the runner publishes one
   synthetic message asking for a single script that finishes the work. It never fires on
   the step where the hard agent limit disables tools. `REEF_STEP_BUDGET` overrides the
   default; an agent's own `steps` still wins.
3. **Lazy catalog.** The Code Mode instruction lists namespaces and six pinned tools
   (`read`, `write`, `edit`, `shell`, `grep`, `glob`) and leaves everything else to
   `search`. The full listing cost about 725 tokens per request. `make` takes a budget so
   tests and other callers can ask for the full listing.
4. **Verified-done moved to the rig.** A pass now needs the acceptance command to exit 0
   and the run tree to differ from its post-setup state outside `test/`. Read-only tasks opt
   out with `requires_change: false`.

## Why the done check is not in the loop

The first attempt ran it in the runner: if a step changed files and then stopped, publish a
nudge asking for a test run. With a two-tool surface an edit and its verification happen
inside the same `execute` call, so almost every coding turn "changed files and stopped". The
guard added a step to most turns and failed 15 runner tests. It is a question about what
counts as success, which is the rig's job, so it lives there.

## Verified

- `packages/core` typecheck clean (1,872 files).
- Unit tests for the budget and the prompt guidance pass.
- Code Mode instruction and catalog suites pass, including a new lazy-default test.
- Runner suite re-run; the one fixture that models the real surface needed
  `SessionSystemPrompt.make(["execute", "question"])` instead of `make([])`.

## Measured, 2026-10-31

Package build `reef.exe` 0.1.0, model `opencode-go/deepseek-v4.1-flash`, one run per task,
`rig/results/reef-v0.1.0-fixes.json`.

| | Value |
|---|---|
| Real tasks | 12/12 passed (was 11/12) |
| Controls | 0/2 passed, as they must |
| Tokens, total | 451,962 |
| Tokens per pass | 28,780 |
| Mean model calls | 5.75 |
| Mean wall clock | 24.6 s |

The paired comparison uses the same six tasks and two runs each as `ab-current.json`:

| | Before | After | Change |
|---|---|---|---|
| Passes | 11/12 | 12/12 | +1 |
| Tokens, total | 464,537 | 353,023 | −24.0% |
| Tokens per run, mean | 38,711 | 29,419 | −24.0% |
| Tokens per run, median | 31,668 | 29,652 | −6.4% |
| Mean model calls | 6.50 | 5.92 | −8.9% |
| Mean wall clock | 49.8 s | 21.5 s | −56.8% |

Per task, tokens per run:

| Task | Before | After | Change |
|---|---|---|---|
| rename-refactor | 81,234 | 28,598 | −64.8% |
| config-precedence | 34,896 | 29,552 | −15.3% |
| tool-output-truncate | 32,549 | 31,189 | −4.2% |
| cache-marker-cap | 22,958 | 22,512 | −1.9% |
| retry-backoff-growth | 29,504 | 29,642 | +0.5% |
| token-usage-total | 31,127 | 35,020 | +12.5% |

Read this honestly. Four tasks are flat within noise, one got worse, and the headline −24%
comes almost entirely from `rename-refactor`, which used to spiral to 14 model calls and now
stops at 4 to 6. The median run got 6% cheaper. So the fixes killed a blow-up; they did not
make ordinary tasks cheaper.

Model calls did not fall on ordinary tasks either: 5.5 against 5.5 on three of them. The rig
records about one `execute` call per model call on every task, which is the opposite of what
script-first is supposed to produce. Either these tasks are too small to need a batch, or the
model is still calling one tool per step. The instruction alone has not changed that.

Wall clock halved uniformly across tasks, including ones whose token counts did not move.
That pattern points at machine or provider conditions on the two days, not at the engine, so
do not quote the −57%.

## Not verified

- No Terminal-Bench 4.0 run. Reef has no number that can be placed beside Droid, OpenCode or
  Claude Code. See `docs/research-droid.md` section 7 for their numbers and for how wide the
  disagreement between boards already is.
- One run per task. No pairs, no confidence intervals.
- `toolCalls` counts `execute` invocations. Calls made inside a script are not counted yet.


## Next

Publish `reefcode` 0.1.0, then UI polish, then the many-call and long-session tasks.
