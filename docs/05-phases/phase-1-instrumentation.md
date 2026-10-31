# Phase 1 — Instrumentation and cache monitor

Status: closed · 2026-10-31

Gate: the monitor attributes a deliberate cache break to the right part, and the meter
matches the JSON event stream within 2%.

## What was built

Two read-only pieces, both off unless an environment variable points them at a file.

`packages/core/src/session/cache-monitor.ts` sees every `LLMRequest` after it is built
and before it is sent. It hashes the three parts in prefix order (system, tool
definitions, messages), compares each request with the previous request of the same
session and the same kind, and reports the first part that moved. State is per process,
per session, per kind, capped at 256 sessions.

`packages/core/src/session/meter.ts` writes one JSON line per completed step, from the
same usage record the `session.step.ended` event carries: session, message, model,
finish reason, cost, tokens (input, output, reasoning, cache read, cache write) and wall
clock. Writes happen at the `Step.Ended` publication in
`packages/core/src/session/runner/step.ts`.

Enable them with:

```
REEF_CACHE_MONITOR=C:\path\rows.jsonl
REEF_METER=C:\path\meter.jsonl
```

Both append. A failed write drops the row; neither can fail a request or a step.

## Monitor rows

```json
{"time":"...","sessionID":"ses_...","seq":1,"kind":"primary","part":"none",
 "changedAt":0,"first":true,"reusedBytes":0,"newBytes":34948,"totalBytes":34948,
 "tokensBefore":0}
```

- `part` is the first part that differs: `system`, `tools`, `messages`, or `none`.
- `changedAt` is the index inside that part.
- `reusedBytes` is the prefix that did not move; `newBytes` is everything at and after
  the break. Later differences are not attributed, because they are already stale.
- `tokensBefore` is a four-bytes-per-token estimate of the reusable prefix, not a
  provider count.

Request kinds are compared separately. A title request has its own system prompt and
history; comparing it with the primary flow would report a cache break no provider ever
saw. The end-to-end run below shows the difference: two `title` rows compare with each
other while `primary` rows keep their own sequence.

## Evidence

Unit tests, `packages/core/test/session/cache-monitor.test.ts`, 9 cases: first request,
changed system part, changed tool, appended message, identical request, session
isolation, kind isolation, per-session sequence, file append. One meter test covers
sequence and totals. All 10 pass, and `bun typecheck` in `packages/core` reports no
errors across 1,863 files.

End-to-end against the mock provider, two CLI runs continuing one session:

```
4 requests seen: primary seq 1 (34,948 bytes), title seq 1 (2,048),
title seq 2 (2,048, reused 2,048), primary seq 1 in the next process
2 step_finish events, 2 meter rows
meter tokens 1 + 1 input, 1 + 1 output, cost 7.5e-7 each
```

The meter totals equal the event totals exactly, which is inside the two percent gate.
The title comparison is the deliberate separation check: before kinds were split, the
title request was blamed for a `system` break in the primary flow.

## Limits, recorded as debt

- The monitor and meter are enabled by environment variable, not by a config key. The
  architecture asked for config; env was enough for the gate and avoids touching config
  discovery during the phase. Wire `experimental.cache_monitor` and `experimental.meter`
  before phase 5.
- State is per process. A `reef run` that continues a session in a new process starts a
  new sequence, so across-process breaks are not attributed. Within one long run, which
  is the case phases 3 and 4 care about, the whole session is visible.
- The meter records completed steps, not every provider request. Title and other
  internal calls do not publish `Step.Ended`, so they are absent from both the meter and
  the JSON event stream. Any cost figure from the stream has the same gap.
- `reusedBytes` and `newBytes` are logical part sizes, not wire bytes. They are for
  attribution, not billing.

## Reproduce

```
cd code/packages/core
bun test test/session/cache-monitor.test.ts test/session/meter.test.ts
bun typecheck
```

The end-to-end check needs the mock provider and a config that points the provider at it;
the rig already owns both.
