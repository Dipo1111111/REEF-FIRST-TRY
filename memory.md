# Memory — Reef (Droid-style harness built on OpenCode)

Last updated: 2026-10-31

## Recurring context

**Project root:** `C:\Users\USER\Documents\reef`
**Source of truth for the fork:** `C:\Users\USER\Documents\opencode-dev` (large; no `.git`).
Do not read the whole tree. Terminal path only: `packages/cli`, `packages/core`,
`packages/ai`, `packages/codemode`. Ignore desktop/web/tui/app/console/website.

**Name:** Reef. Binary `reef`, npm package `reefcode`, repo `reefcode/reef`, org `reefcode`.
`reef` and `reef-cli` are taken on npm; GitHub org `reef` is blocked.

**How the user wants to be spoken to:** plain words, short sentences, no jargon, lead with
the answer, prose over bullets, no em dashes. Hard requirement, stated repeatedly.

**How the user wants work done:** do not hand-hold. Do the research and the writing
yourself. No subagents. Use the `architect` skill for planning and `grill-me` to stress
test, but only bring back decisions that genuinely need the user.

**Agreed order of work (do not reorder):**
1. Learn how Droid works, in depth. DONE.
2. Write that into one plain file. DONE.
3. User forks OpenCode and points at it. DONE (`opencode-dev`).
4. Read the parts of the codebase that matter. DONE (terminal path only).
5. Write the real plan docs against the real code. DONE.
6. A capable model builds it, phase by phase. NEXT.

## What was built

Planning and research docs only, no code. Under `C:\Users\USER\Documents\reef`:

- `README.md` — entry point, status board, known contradictions
- `docs/00-charter.md` — unchanged (owner-only)
- `docs/01-contract.md` — unchanged; its 1.4 phase order is now stale, amendment proposed
- `docs/research-droid.md` — Droid 1.0 facts from Factory's own 29 Oct 2026 post
- `docs/research-code.md` — what the fork already ships, with file:line anchors
- `docs/02-architecture.md` — draft 2, rewritten against the real code
- `docs/03-rig.md` — task set, metrics; pass bars updated to the new phases
- `docs/04-decisions/0006-delta-not-rewrite.md`
- `docs/04-decisions/0007-phase-order.md`
- `docs/04-decisions/0008-byok-local.md`
- `docs/04-decisions/0009-owner-amendments.md` (proposed, owner applies)
- `docs/04-decisions/0010-identity.md`
- `docs/05-phases/` — new phase table and phase 0 file
- `docs/debt.md` — 5 open items

## Decisions made

- **Reef is a delta, not a rewrite (ADR 0006).** The fork already has an append-only loop,
  four-breakpoint cache markers, sandboxed code mode, file-backed tool output, and
  per-model prompt addenda.
- **Four changes only:** cache monitor, resident tool surface (two tools, cap four),
  bounded loop, anchoring default.
- **Phase order (ADR 0007):** 0 baseline → 1 monitor → 2 tool surface → 3 bounded loop →
  4 anchoring → 5 tuning.
- v1 stays headless only (ADR 0002), anchoring default (ADR 0004), rig before features
  (ADR 0003).
- **No keys, no payment, no telemetry (ADR 0008).** Reef ships no credential and no plan.
  The user brings their own provider config and it stays local. The rig is parameterised
  by model and provider; no model is chosen on the user's behalf.
- **Resident tool target is two:** `execute` and `question`. Read/edit come back only if
  the rig shows the program round trip costs more than the schema. Hard cap four.
- **Automatic compaction is off by default in headless.** Compact on provider overflow or
  on request, and log each compaction's cost.
- **Rig tasks come from the fork itself.** Failed or flaky tests in `opencode-dev`, small
  tooling tasks, and one constructed long session. Ten of the twelve minimum are control
  tasks. Each task is a directory with `task.yaml`, `setup.sh`, `accept.sh` and a frozen
  fixture; isolated by temp directory, no Docker, and every `accept.sh` must be seen
  failing on the untouched fixture first.
- **Identity is Reef at the surface (ADR 0010).** `reef`, `reefcode`, `reef.json`, `reef`
  data dir, `REEF_*`. Internal `@opencode/*` names stay for mergeability.
- **Polish is phase 6, after phase 5.** TUI restyle, brand strings, theme. Not v1.
- **Charter and contract amendments are pending with the owner (ADR 0009).** They still say
  "rebuild the loop and script tool" and "one model family at a time".

## Key facts, carrying forward

Droid (Factory, 29 Oct 2026, factory.com/news/frontier-harness):

- Script tool = JS in a sandbox with no fs/net/system; tool calls via bridge; hundreds of
  calls per request; printed output capped; full results to searchable files; 5-minute
  wait then partial return; background + wake, no polling.
- 15 tool calls: 10 model calls / 56.8 s → 5 model calls / 41.6 s. Cost −15% on Opus 5.5,
  concentrated in the 12.5% of scripts with 6+ calls.
- Cache: new tools appended at the end, not inserted. 98% of input from cache per request,
  98.6% of requests strictly append-only, 91.5% token-weighted, over 20.4M requests.
- Base prompt 20,887 → 13,055 (−37%); tools 11 → 2 definitions; tool definitions
  15,798 → 8,528 (−46%); system prompt 1,618 → 2,155 (+33%).
- Stop rules: 4 min stream silence → drop/retry; hard time limit 2 attempts; partial
  response removed before retry; 3 empty turns → stop; 3 identical calls → nudge, 6 → stop.
- Benchmarks (vendor): Opus 5.5 65.2% at $4.73 and 42.6 min; OpenCode 62.1%; Claude Code
  57.6%. GPT-6.1 Sol 57.6% at $0.79, 25.8 min, 10% slower than Codex.

Our fork:

- Loop: `packages/ai/src/llm.ts:173` appends `[...messages, response, ...toolResults]`.
- Cache: `packages/ai/src/cache-policy.ts:17` auto at last tool, first/last system, tail;
  4-marker cap (`:24`).
- ~15 tools sent up front (`codemode: false` list in `core/src/tool/plugin/`): read, write,
  edit, patch, glob, grep, shell, todo, question, skill, subagent, webfetch, websearch,
  image-generate. Droid sends 2. Biggest untested gap.
- Code mode on by default (`core/src/tool.ts:274`); catalog ships as instruction deltas.
- Tool output: 2,000 lines / 50 KiB then spill to file (`core/src/tool-output.ts:13`).
- Compaction: `auto: true`, `keep: 15_000` (`core/src/session/compaction.ts:263`), 15%
  reserve min 16k (`:130`, `:136`). Rewrites the prefix on every fire.
- Timeouts: 300 s headers, 900 s chunks (`packages/ai/src/schema/options.ts:56`, `:62`).
  No 4-minute silence rule, no empty-turn or identical-call detection anywhere.
- Headless JSON events already carry `cost` and `tokens`
  (`packages/cli/src/run/noninteractive.ts:508`).

## Current state

Docs are complete and consistent, except the contract 1.4 line the owner must amend. No
code written, no rig, no git repo for the fork. Nothing runs yet.

## Next session starts with

Phase 0.1: turn `opencode-dev` into a git repo with one base commit (`phase-0-base`), then
0.2 build `rig/tasks/*.yaml` (12+ tasks, 10 control) and the runner that reads
`--format json` events. Do not start writing features before `results/baseline-<model>.json`
exists.

## Open questions

- Do `read` / `edit` really need to stay resident, or can they live in code mode? Phase 2
  measurement decides; two resident tools is the opening bet.
- Can we guarantee a retry lands on the provider that holds the cache, like Droid does?
- Does the provider in use return cache-read token counts at all? If not, that metric is
  reported unavailable, never estimated.
