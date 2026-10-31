# Reef — The Rig

The rig is the only source of truth for progress. If a claim is not in the rig, it is
an opinion.

---

## 1. What the rig is

A fixed set of tasks, each with a deterministic acceptance check, run against a
harness, producing a row of numbers per task.

It is not a benchmark. It is a regression detector with a score, built from tasks that
represent work we actually do. Public benchmarks measure whether the harness is
competitive; the rig measures whether our change helped.

## 2. Task set

**Target: 20 real tasks + 10 control tasks. Phase 0 ships 12 real + 10 control; the rig
grows only at a phase boundary.**

### Categories

| Category | Count | What it tests |
|---|---|---|
| single-file edit | 3 | baseline competence, prompt overhead |
| multi-file refactor | 3 | read breadth, edit precision |
| test-fix loop | 4 | iteration, tool round trips |
| repo-wide search | 3 | where PTC should pay off |
| long session | 4 | drift, compaction, cache retention |
| build / CI repair | 3 | long-running commands, background work |
| **control (expected to fail)** | 10 | anti-overfitting |

The control set matters more than the rest. Without tasks we expect a good harness to
fail, the score rises while the tool gets worse.

### Task schema

```yaml
id: fix-flaky-timeout
category: test-fix-loop
prompt: |
  The checkout test times out intermittently. Find out why and fix it.
budget:
  wall_clock_s: 900
  max_model_calls: 40
notes: |
  Root cause is a 50ms sleep racing a 100ms debounce. A harness that
  re-reads files repeatedly will burn tokens here.
```

`setup.sh` and `accept.sh` live beside it. The acceptance command must be able to fail.

## 3. Metrics

Recorded per task, per run:

| Metric | Definition | Why |
|---|---|---|
| `passed` | acceptance command exit status | the only correctness signal |
| `tokens_in` | total input tokens billed | baseline cost |
| `tokens_cached` | input tokens read from cache | the main efficiency lever |
| `tokens_out` | output tokens | usually small, occasionally dominant |
| `model_calls` | number of model round trips | the main speed lever |
| `tool_calls` | number of tool invocations | context for the above |
| `wall_clock_s` | end-to-end, excluding setup and grading | speed |
| `ttft_ms` | time to first token, median | perceived speed |
| `cache_ratio` | tokens_cached / tokens_in | reported token-weighted |
| `tokens_per_pass` | tokens_in / passes | the headline number |

### Reported aggregates

- **tokens per passed task** — sum(tokens_in) / sum(passed)
- **wall clock per passed task** — sum(wall_clock) / sum(passed)
- **pass rate** — passed / total
- **cache ratio** — token-weighted, never request-weighted

Request-weighted cache ratio is banned. It flatters every harness, because the many
small requests are the cheap ones.

## 4. Runs and variance

- Model calls are nondeterministic. One run is an anecdote.
- Minimum for a decision: **3 runs**, report the median.
- If the spread across runs exceeds 15% on the headline metric, the task set is too
  noisy to decide on. Cut the noisy task rather than averaging it.
- Temperature, model id, and rig version are recorded with every result row.

## 5. Pass bars

| Phase | Bar to clear |
|---|---|
| 0 | Baseline recorded; the frozen fork reproduces within 2%; prefix measured |
| 1 | Monitor attributes a deliberate break to the right part; meter matches events within 2% |
| 2 | 2 resident tools (cap 4); tokens per passed task not worse; pass rate not lower |
| 3 | injected stall / empty-turn / identical-call runs stop correctly; zero false stops on control |
| 4 | cache_ratio ≥95% token-weighted on long sessions; compaction count recorded |
| 5 | tokens per passed task −25%, wall clock −15%, pass rate not lower |

A phase does not close until its bar is met across 3 runs.

## 6. Anti-gaming rules

These exist because every metric gets gamed, including by me.

1. **The control set is never used for tuning.** It is only read at phase boundaries.
2. **Pass rate is a gate, not a target.** Lowering it to win on tokens is a failure.
3. **No task is removed because it is hard.** Removal requires an ADR with a reason
   that is not "it fails."
4. **No task is added to demonstrate a win.** Additions happen at phase boundaries
   only.
5. **The rig is versioned and frozen within a phase.**
6. **Results are published as a table, not a summary sentence.** A single number hides
   which tasks regressed.

## 7. Running it

```
reef rig run --version v1 --model <id> --runs 3 --out results/v1-<model>-<date>.json
reef rig report results/v1-<model>-<date>.json
```

The rig runner is plain code, not a framework. It shells out to the harness, parses
the meter output, and writes JSON. If it grows past a few hundred lines, something is
wrong.

## 8. Where tasks come from

The fork itself. It is real code, it is the codebase we are changing, and every task can
have an acceptance command that already exists or is trivial to write.

Three sources, in this order:

1. **Its test suite.** A failing or flaky test in `opencode-dev` is a task: the prompt is
   the bug report, the acceptance command is that test. Pick tests that fail for a real
   reason on a clean fixture, not snapshot churn.
2. **Its tooling.** Tasks like "make `reef run --format json` emit one line per tool call"
   or "make `models list` work offline" are real, small, and verifiable.
3. **One constructed long task** that deliberately exceeds the compaction threshold, so
   phase 4 has something to measure.

Synthetic tasks are acceptable only for the control set, where the point is that they
should fail. The control set is ten tasks from the first day of the rig.

## 8.1 Task layout and isolation

```
rig/tasks/<id>/
  task.yaml      # id, category, prompt, budget, notes
  setup.sh       # copies a frozen fixture into the run directory, idempotent
  accept.sh      # exits 0 on success, non-zero on failure, prints one line
fixtures/<id>/   # small, checked-in copy of the starting state
```

Isolation without new dependencies:

- One run gets one temp directory under the system temp root.
- `setup.sh` copies `fixtures/<id>/` into it and nothing else.
- The harness runs with that directory as its cwd.
- The run is graded by `accept.sh` in the same directory, after the run, with the model
  gone.
- No Docker, no VM, no network dependency in the acceptance command. The model may need
  the network; the grader must not.

One rule that matters more than the rest: **every `accept.sh` must be run against the
untouched fixture and observed to fail** before the task is accepted into the rig. A task
that passes before the model does anything measures nothing.

## 9. Phase 0 deliverable

`docs/03-rig.md` (this file, frozen as v1), plus:

- `rig/tasks/*/` — 12 real tasks plus 10 control tasks, each with a working `setup.sh` and
  `accept.sh`
- `results/baseline-<model>.json` — the unmodified fork, 3 runs
- `results/prefix-v0-<model>.json` — what the first request actually contains
- A one-page readout: which categories are expensive, where the tokens actually go

That readout determines where Phase 2 starts. We do not guess.
