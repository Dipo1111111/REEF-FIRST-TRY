# Phases

One file per phase, written when the phase starts. Not before.

Planning phase 3 before phase 2 exists produces fiction. The code contradicts it in
week one, and then we maintain documents that lie.

## Phase table

| # | Phase | Gate (closes the phase) | State |
|---|---|---|---|
| 0 | Baseline | rig verified (22 tasks fail untouched); first request measured; 3-run baseline deferred by ADR 0011 | closed with deferral |
| 1 | Instrumentation + cache monitor | monitor attributes a deliberate cache break to the right part; meter matches the JSON event stream within 2% | closed |
| 2 | Resident tool surface | 2 resident tools (cap 4); tokens per passed task not worse; pass rate held | code complete; paid comparison deferred |
| 3 | Bounded loop | injected stall, empty-turn and identical-call runs stop or nudge correctly; zero false stops on the control set | signals built; control sweep pending |
| 4 | Anchoring | long-session cache ≥95% token-weighted; compaction count recorded and explained; pass rate held | auto off + ledger built; long-session measurement pending |
| 5 | Tuning and finish | v1 bar met on the rig: tokens per passed task −25%, wall clock −15%, pass rate not lower | not started |
| 6 | Polish | deferred: TUI restyle, brand strings, theme, docs site | deferred until phase 5 closes |

## Deferred polish

The user-visible identity that matters for running the thing is already in phase 0: the
command, the config file, the data directory and the environment variables are Reef's.
What is deliberately left alone is the terminal UI, its layout, its strings, its colours,
and any public presentation.

That is a polish phase, not a design gap. It runs after phase 5 closes, so that time spent
on how it looks cannot displace a phase that moves the numbers. Two options are open at
that point, and neither requires touching the loop:

1. restyle the existing TUI, colours and strings only;
2. write a thin renderer over the event stream the headless path already emits.

Nothing in phases 0 to 5 depends on that choice, which is why it stays undecided.

## Why this order

Measurement first (0, 1). A cache experiment you cannot attribute is a guess, and every
later phase needs the monitor to prove it did not break the prefix.

Tool surface before stop rules. Changing the resident set is the change most likely to
move tokens per task, and it is also the one most likely to quietly break the cache. Do
it while the monitor is fresh and the rig is quiet.

Stop rules before anchoring. A bounded loop lets the anchoring phase run long sessions
without burning a budget on a stuck agent. Anchoring then changes when compaction fires,
which is the last thing you want to debug while the loop can still spin.

## Why the old order changed

The original table had "request discipline" and "script tool" as phases 2 and 3. The fork
already ships both: append-only loop, cache markers at four breakpoints, a sandboxed code
mode with a tool catalog. Building them again would be duplicate work. See ADR 0006 and
ADR 0007.

## Rules for every phase

1. The phase has one gate. If it has two, it is two phases.
2. The gate is a command, not a description.
3. The phase starts from a tagged commit and ends with a tag or a revert.
4. The rig is frozen for the duration. Changes only at the boundary.
5. Anything deferred goes in `docs/debt.md`.
6. Write the next phase's file only after the current gate closes.

## Rollback

Every phase tag is a clean state. If a phase is abandoned mid-way:

```
git checkout phase-<n-1>-ok
```

and the work goes in a branch for salvage. No phase is allowed to leave the mainline
in a state where the rig cannot run.
