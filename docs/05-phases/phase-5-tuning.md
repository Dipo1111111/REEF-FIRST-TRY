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

## Not verified

- No measurement. The owner's constraint stands: no paid runs without approval. The effect
  on the 14–18 call tail is unknown until a run is approved.
- The rig pass rule has only been exercised with `--dry`.

## Next

Publish `reefcode` 0.1.0, then UI polish, then the many-call and long-session tasks.
