# Phase 3 — Bounded loop

Status: code complete for two signals, gate partly met · 2026-10-31

Gate: an injected stall, an empty turn, and an identical-call run each stop or nudge
correctly, and the control set produces zero false stops.

## What was built

`packages/core/src/session/runner/watchdog.ts` reads stored messages and returns one of
four verdicts: ok, nudge, empty, stop. The runner calls it at the top of every attempt in
`runner/llm.ts`, before the request is built.

Rules:

- Three assistant turns in a row with no visible text and no tool call stop the run with a
  `loop.empty` error. Reasoning alone does not count as visible text.
- The same tool call, meaning the same name and a deep-equal input, three times in a row
  publishes one synthetic nudge message and continues. The nudge is append-only.
- Six identical calls stop the run with `loop.repeated`.
- The same call returning different results is polling, and the run resets. Two reads of
  the same file with different output never trigger the rule.
- Input key order does not matter; the comparison sorts keys before hashing.

Counters are derived from stored messages, not held in memory, so a process restart cannot
reset a streak. The nudge is detected by its exact text, so it is published once per
session, not once per step.

## Evidence

Nine unit tests in `packages/core/test/session/watchdog.test.ts` cover: varied history,
three empty turns, text breaking the streak, a tool call breaking the streak, three
identical calls producing a nudge, the nudge not repeating, six identical calls stopping,
polling resetting the run, and key-order independence. All pass. `bun typecheck` in
`packages/core` is clean across 1,865 files.

One live run with a normal prompt listed the files in a directory and answered, which
shows the watchdog does not fire on a healthy history. An attempt to make the model repeat
the same `execute` call three times failed to induce the loop: it called once and stopped,
so the nudge path has unit coverage but no live run behind it.

## What is not built

- The 240-second stream-silence rule. Detecting silence after headers needs a per-event
  idle timeout at the transport boundary. An overall step timeout would kill legitimate
  long tool calls, so it was not faked with one.
- The two-attempt hard limit for one attempt. The existing retry policy bounds retries;
  a second independent cap was not added without a stall signal to attach it to.
- Zero false stops on the control set. The rig controls are still the rewritten, unverified
  set from the cancelled baseline, and running them costs a paid sweep.

## Gate status

- Empty turn: covered by unit tests, wired into the runner.
- Identical calls, nudge and stop: covered by unit tests, wired into the runner.
- Injected stall: not implemented.
- Control sweep: not run.

The phase is not tagged. Two of the four checks are evidence-backed; the stall needs a
transport change and the control sweep needs owner approval.

## Files

- `packages/core/src/session/runner/watchdog.ts`
- `packages/core/src/session/runner/llm.ts` (inspect call and nudge publish)
- `packages/core/test/session/watchdog.test.ts`
