# Phase 3 — Bounded loop

Status: all three signals built, control sweep clean · 2026-10-31

Gate: an injected stall, an empty turn, and an identical-call run each stop or nudge
correctly, and the control set produces zero false stops.

## What was built

`packages/core/src/session/runner/watchdog.ts` reads stored messages and returns ok, nudge,
empty, or stop. The runner calls it at the top of every attempt in `runner/llm.ts`, before
the request is built.

- Three assistant turns in a row with no visible text and no tool call stop the run with
  `loop.empty`. Reasoning alone is not visible text.
- The same tool call, same name and deep-equal input, three times publishes one synthetic
  nudge and continues. The nudge is append-only.
- Six identical calls stop with `loop.repeated`.
- The same call returning a different result is polling, and the run resets.
- Input key order does not matter.

Counters come from stored messages, so a restart cannot reset a streak.

`packages/core/src/session/runner/stall.ts` wraps the provider stream with a per-pull idle
timeout, 240 seconds by default and configurable with `REEF_STALL_MS`. Each event resets
the clock. A silence fails as a transport read failure, so the normal retry path applies.
The runner counts stalls and fails the step after two, instead of backing off through the
whole retry schedule. A stall after output started is counted on the continuation path too.

## Evidence

Unit tests: nine for the watchdog, four for the stall wrapper. The stall cases cover a
stream that keeps producing, a stream that stops, a long gap after one event, and the
duration fallback. `bun typecheck` in `packages/core` is clean across 1,867 files.

Injected stall against a stalling mock:

```
REEF_STALL_MS=1000, mock sends one chunk then goes quiet
before the attempt cap: 111 s and still retrying
after the cap: 21 s, exits with provider.transport
```

The 21 seconds is two attempts plus retry backoff; the important part is that it ends
instead of crawling the schedule.

False-stop check, three short real runs on healthy work:

```
run 1 exit 0, no loop error: listed files and counted them
run 2 exit 0, no loop error: created hello.txt, read it back
run 3 exit 0, no loop error: ran a shell command and reported the path
```

The nudge path itself still has no live run: the real model refused to make the same call
three times on request. It is covered by unit tests and by the stored-history design.

## Paid control sweep, 2026-10-31

Ten controls, one real run each, after the rig guard and the rewritten contradictions.

```
0/10 passed (want 0), 828,900 tokens, about 14 minutes
control-huge-scope: testsModified true
```

The model tried to edit the tests on `control-huge-scope`; the runner restored the
pristine test tree before scoring and the task still failed. That is the guard working on a
real attempt, not just on the dry check.

No false stops: no control was ended by the watchdog. The sweep is the formal check, so
the phase 3 gate is met.

## Gate status

- Empty turn: built, unit-tested, wired.
- Identical calls, nudge and stop: built, unit-tested, wired.
- Injected stall: built, unit-tested, proven against a stalling mock.
- Zero false stops on the control set: met. 0/10 controls passed, no loop stop fired.

The nudge path still has no live run. The A/B did expose a different loop shape the
watchdog does not catch: 14 and 18 model calls on one small task, with different calls
each time and no progress. That is a phase 5 tuning item, not a repeat loop.

## Files

- `packages/core/src/session/runner/watchdog.ts`
- `packages/core/src/session/runner/stall.ts`
- `packages/core/src/session/runner/llm.ts` (inspect call, nudge, stall cap)
- `packages/core/src/session/runner/step.ts` (stream timeout)
- `packages/core/test/session/watchdog.test.ts`
- `packages/core/test/session/stall.test.ts`
- `rig/mock/server.ts` (`--stall` scaffolding)
