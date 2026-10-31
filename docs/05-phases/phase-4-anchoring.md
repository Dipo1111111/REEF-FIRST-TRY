# Phase 4 — Anchoring

Status: auto compaction off by default, ledger built · 2026-10-31

Gate: long-session cache at or above 95% token-weighted, compaction count recorded and
explained, pass rate held.

## What changed

Automatic compaction is off by default. `SessionCompaction` starts with `auto: false`, so
a headless run compacts on exactly two triggers: the provider rejects the request as too
long, or the user asks. The config key `compaction.auto` still turns it back on for anyone
who wants the old behaviour.

This matters because automatic compaction rewrites the request prefix, and the prefix is
the part the provider has cached. A background habit that fires near the window limit
discards that cache at the worst time. Turning it into an event means it can be counted
and judged.

The fork already stores a compaction as a new message and leaves the old messages in the
database; the request is rebuilt from the summary plus the kept tail, and the log is never
edited. No change was needed there.

`packages/core/src/session/compaction-ledger.ts` appends one JSON line per completed
compaction when `REEF_COMPACTION_LOG` points at a file:

```json
{"time":"...","sessionID":"ses_...","reason":"manual","model":{...},
 "tokensBefore":40000,"tokensAfter":18000,"tokensDropped":22000,
 "native":false,"usage":{"tokens":{...},"cost":...}}
```

`tokensBefore` is the prompt estimate before compaction, `tokensAfter` is the summary plus
the kept tail, and `tokensDropped` is the difference. All of the replaced prefix is also
cache the provider will rebuild, which is why the summary call is not the whole cost.

## Evidence

- Two ledger tests: rows are written with the cost fields, and a bad path never throws.
- The existing config compaction test still passes with the new default.
- `bun typecheck` in `packages/core`: clean across 1,869 files.
- One real run with `REEF_COMPACTION_LOG` set, a short session: exit 0, the file was
  created and read back, and zero compaction rows, which is correct because nothing
  overflowed and auto is off.

## Gate status

- Long-session cache at 95% token-weighted: not measured. It needs a long paid session,
  the same measurement batch as phases 2 and 3.
- Compaction count recorded and explained: built. The ledger records every completion
  with its reason and cost.
- Pass rate held: not measured.

No tag. The code is in place; the numbers need the approved measurement run.

## Files

- `packages/core/src/session/compaction.ts` (default auto false, ledger call)
- `packages/core/src/session/compaction-ledger.ts`
- `packages/core/test/session/compaction-ledger.test.ts`
