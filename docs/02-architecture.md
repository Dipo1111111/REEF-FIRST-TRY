# Reef — Architecture

Status: current as of 2026-10-31, grounded in the fork. An earlier draft described a
rewrite; that was wrong, and ADR 0006 records why. Facts and file references live in
`research-code.md`. This document describes the target state and the four places we change
it.

---

## 1. The spine already exists

| Layer | What the fork has | Where |
|---|---|---|
| Turn loop | append-only: `[...messages, response, ...toolResults]` | `packages/ai/src/llm.ts:173` |
| Outer lifecycle | drain, retry, continue, output-limit, overflow | `core/src/session/runner/llm.ts:61` |
| Request build | two system parts, then history | `core/src/session/model-request.ts:101` |
| Cache markers | auto at last tool, first/last system, tail | `packages/ai/src/cache-policy.ts:17` |
| Code mode | confined JS runtime, catalog, bridge, limits | `packages/codemode/src/codemode.ts` |
| Tool surface | `execute` plus direct tools | `core/src/tool.ts:265` |
| Tool output | 2,000 lines / 50 KiB, overflow to file | `core/src/tool-output.ts:13` |
| Persistence | SQLite via Drizzle, message rows in `seq` order | `core/src/session/sql.ts` |
| Per-model prompt | family-specific prompt addenda | `core/src/plugin/optimize.ts` |

Nothing in this table is being rewritten. If a proposal touches one of these lines to
"add caching" or "add script mode", the proposal is wrong.

---

## 2. What Reef adds

Four changes, plus a meter that rides with the monitor in phase 1. Each maps to one phase.

### 2.1 Cache monitor (phase 1)

A read-only component that sees every `LLMRequest` before it is sent, hashes its parts,
and compares it with the previous request in the same session.

Parts, in prefix order: system parts, tool definitions, message parts. Each hash covers
its own bytes only, so the report can say *which* part moved and how many tokens were
before it.

Output per request:

```
{ sessionID, seq, part, changedAt, tokensBefore, reused, new }
```

Rules:

- It never edits the request. It observes.
- It remembers the previous request per session, not globally.
- It reports the first part that differs, not every difference. Everything after the
  first break is already wasted.
- It is off unless enabled by config, so it cannot cost anything in production use.

This is the cheapest thing in the project and the one that finds every other bug.

### 2.2 Resident tool surface (phase 2)

Today ~15 tool definitions sit in the prefix. Droid sends two.

Target: **two resident tools** —

| Tool | Why it stays resident |
|---|---|
| `execute` | the whole point; code mode entry |
| `question` | must interrupt the user synchronously; a sandboxed program cannot hold a conversation |

Everything else — read, edit, write, patch, shell, grep, glob, todo, webfetch, websearch,
subagent, skill, image-generate — moves into the catalog as `codemode: true`. Reachable
from a program, not resident in the prefix.

That is the aggressive version, and it is the one worth measuring first. If the rig shows
pass rate dropping because the model re-reads files through programs to recover line
numbers, `read` and then `edit` come back, one at a time, each with its own measurement.
The cap is four resident tools and every addition needs a number behind it.

Two mechanics already exist and are used as-is: the catalog ships as instruction deltas
(`core/src/codemode/instructions.ts:32`), and the `execute` description is invariant
(`core/src/codemode/tool.ts:74`).

This phase is a set of `options: { codemode: ... }` changes in
`core/src/tool/plugin/*.ts` plus whatever falls out of measuring it. It is not a new
subsystem.

### 2.3 Bounded loop (phase 3)

A watchdog beside `SessionStep.attempt`, feeding decisions back through the existing
`Outcome` union (`core/src/session/runner/step.ts:32`).

| Signal | Threshold | Action |
|---|---|---|
| Stream silence after headers | 240 s | drop the stream, treat as transport failure, retry |
| Assistant turns with no visible text and no tool call | 3 in a row | stop with a typed error |
| Identical tool calls (same name + deep-equal input) | 3 | inject one nudge message, append-only |
| Same again | 6 | stop the loop |
| Identical calls that return different results (polling) | — | reset the counter |
| Hard time limit on one attempt | 2 attempts | then fail the step |

Rules:

- Counters live in the runner, derived from stored messages, not in memory only. A
  process restart must not reset them.
- Every action is append-only. The nudge is a new message. Nothing is spliced.
- Every stop is a typed `SessionError`, not a thrown string.

### 2.4 Anchoring default (phase 4)

Today `auto: true` compaction fires before any step past 15% headroom and rewrites the
prefix (`core/src/session/compaction.ts:263`, `:431`).

Target:

- `auto: false` by default for headless runs.
- Compact on exactly two triggers: the provider rejects the request as too long
  (`reason: "overflow"`, already implemented at `step.ts:160`), or the user asks.
- The summary is inserted as a new message, and the old messages stay in the database.
  The *request* is rebuilt from the summary plus the kept tail; the *log* is never edited.
- Record what each compaction cost: tokens before, tokens after, cache discarded.

The point is not "never compact". The point is that compaction should be an event you can
count, not a background habit. Droid keeps compaction and gives it a 16,000-token summary
budget, so the goal is a rare, deliberate, well-sized compaction, not zero compaction.

### 2.5 Meter (phase 1)

`--format json` already emits `cost` and `tokens` per event
(`cli/src/run/noninteractive.ts:508`). The meter is a thin layer that:

- records one row per request: model, provider, input, cache read, cache write, output,
  wall clock, tool calls, model calls;
- writes rows as JSON lines to a path the rig reads;
- never changes behavior.

The rig is the only consumer. If a number is not in the meter, it is an opinion.

---

## 3. Data flow, target state

```
user turn
   │
   ▼
┌──────────────────┐     ┌────────────────┐
│ session store    │────▶│ request build  │  exists
│ messages, seq    │     │ system+tools+  │
└──────────────────┘     │ history        │
                         └───────┬────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ cache monitor (observe) │  new, phase 1
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ provider stream         │  exists
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
      ┌──────────────┐   ┌───────────────┐  ┌──────────────┐
      │ watchdog     │   │ tool dispatch │  │ meter        │  new / new
      │ stop rules   │   │ direct+code   │  │ per request  │
      └──────┬───────┘   └───────┬───────┘  └──────────────┘
             │                   │
             ▼                   ▼
      append nudge /      append results
      stop typed          (append-only)
```

---

## 4. Invariants

1. The request grows by appending. Anything that rewrites an earlier part must be
   named in an ADR and must be visible in the cache monitor.
2. The log is never edited. Only the request built from it may be shortened.
3. Code mode has no ambient authority. Tools are reached through the bridge, with the
   same permissions as a direct call.
4. The resident tool set is small and changes only with a rig number attached.
5. Every stop rule is deterministic and testable without a model.

---

## 5. Open questions

| Question | Why it matters | Forced by |
|---|---|---|
| Do the workhorse tools actually need to stay resident? | The whole phase-2 thesis; starting at two tools is a bet | First measurement in phase 2 |
| Can our providers be trusted to hold a cache across a retry? | Droid retries on the provider that holds the cache; we may not control routing | Phase 3 |
| Where does the watchdog live when the transport hides silence? | `chunkTimeout` is per-chunk; the watchdog needs an event-stream clock | Phase 3 |
| Keep `keep: 15_000` as the anchored tail? | Determines how often overflow compaction fires | Phase 4 |

---

## 6. What we are not doing

No new provider abstraction. No new plugin system. No config language. No rewrite of the
loop, the request builder, or the sandbox. The sandbox already works; the loop already
appends; the cache markers already exist. Reef makes them smaller, observable, and
bounded.
