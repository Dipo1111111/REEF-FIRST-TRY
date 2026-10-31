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

Under `C:\Users\USER\Documents\reef` (git repo, base commit `defcc61`, tag `phase-0-base`):

- `README.md` — entry point, status board, known contradictions
- `docs/00-charter.md` — unchanged (owner-only)
- `docs/01-contract.md` — unchanged; its 1.4 phase order is stale, amendment proposed
- `docs/research-droid.md` — Droid 1.0 facts from Factory's own 29 Oct 2026 post
- `docs/research-code.md` — what the fork already ships, with file:line anchors
- `docs/02-architecture.md` — target state, rewritten against the real code
- `docs/03-rig.md` — task set, metrics; pass bars updated to the new phases
- `docs/04-decisions/0006` … `0011` — delta, order, BYOK, amendments, identity, deferral
- `docs/05-phases/` — phase table, phase 0 file, phase 0 readout
- `docs/debt.md` — 10 open items
- `code/` — the fork, copied from `Documents\opencode-dev`, 1,777 packages installed
- `bin/reef.cmd`, `bin/reef` — dev entry points (`--cwd packages/cli`, `PWD` = caller)
- `rig/runner.ts` — setup, run, accept, token accounting, dry mode, hermetic env
- `rig/scaffold.ts` — regenerates 12 real + 10 control tasks from three fixtures
- `rig/mock/server.ts` — OpenAI-compatible mock that logs request bodies
- `rig/measure-prefix.ts` — bytes and token estimate per request component
- `rig/results/` — gitignored output: accepts-v0.json, prefix-v0, request captures

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
  tooling tasks, and one constructed long session. Phase 0 ships 12 real and 10 control
  tasks. Each task is a directory with `task.yaml`, `setup.sh`, `accept.sh` and a frozen
  fixture; every `accept.sh` was seen failing on the untouched fixture first.
  Fixtures are small extractions, not the monorepo (debt log).
- **Runs are hermetic.** Run dirs live outside the user profile (`C:\reef-rig`) because
  config discovery walks every parent; a run under `C:\Users\<name>` inherits that user's
  `.agents`/`.claude` skills. Measured 397 KB of system text before this was fixed.
- **Identity is Reef at the surface (ADR 0010).** `reef`, `reefcode`, `reef.json`, `reef`
  data dir, `REEF_*`. Internal `@opencode/*` names stay for mergeability.
- **Polish is phase 6, after phase 5.** TUI restyle, brand strings, theme. Not v1.
- **No global skill ingestion (ADR 0012).** Reef ignores `~/.claude/skills` and
  `~/.agents/skills` by default. Project-local ones and Reef's own still load;
  `REEF_COMPAT_SKILLS=1` restores upstream. Measured cut: 397,788 → 8,652 system chars.
- **Rig auth is seeded, not configured.** The rig's isolated data dir holds a copy of the
  local credential store. `run` authenticates there (verified by the authorization header
  at the mock); `auth list` does not (debt log).
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
- **Measured 2026-10-31:** first request = 13 tool definitions, 15,517 bytes (~3,879
  tokens) + 8,653-byte system prompt (~2,163 tokens) = 24,205 bytes, ~6,051 tokens total.
  Tools are 64% of the first request. Readout: `docs/05-phases/phase-0-readout.md`.
- Tools sent up front (`codemode: false` list in `core/src/tool/plugin/`): read, write,
  edit, patch, glob, grep, shell, todo, question, skill, subagent, webfetch, websearch,
  image-generate. Droid sends 2. Phase 2's win is bounded, about 12 KB per early step.
- Code mode on by default (`core/src/tool.ts:274`); catalog ships as instruction deltas.
- Tool output: 2,000 lines / 50 KiB then spill to file (`core/src/tool-output.ts:13`).
- Compaction: now `auto: false` by default (`core/src/session/compaction.ts`), compact only
  on overflow or request; `keep: 15_000`, 15% reserve min 16k (`:130`, `:136`). A completed
  compaction appends a cost row when `REEF_COMPACTION_LOG` is set.
- Timeouts: 300 s headers, 900 s chunks (`packages/ai/src/schema/options.ts:56`, `:62`).
  No 4-minute silence rule, no empty-turn or identical-call detection anywhere.
- Headless JSON events carry `cost` and `tokens.cache.read/write` on every `step_finish`
  (confirmed live, not just in code). `run --standalone` starts its own server.
- Credentials: the user's `oc_...` key was copied from OpenCode's `opencode.db`
  `credential` row into Reef's local store; `reef models` then listed the Go provider and
  a real call authenticated. The rig's isolated data dir holds the same copy, and the
  mock saw an `authorization` header. `reef auth list` still fails there (debt).

## Current state

Phase 0 is closed with the baseline deferred (ADR 0011). The fork is at `code/`, tagged
`phase-0-base`, with identity, rig and prefix measurement done. The rig has 22 tasks,
verified failing on untouched fixtures, and a runner that reads `--format json` events.

A paid baseline was attempted on 2026-10-31: 34 sessions against
`opencode-go/deepseek-v4.1-flash`, 2.36M tokens, real tasks 23/24, controls 6/10
"passed". The control result invalidated the run: five controls were solvable by design,
because their expected values lived in the test file. The attempt was cancelled by the
owner and is not the baseline. The rig now restores acceptance tests before scoring and
records `testsModified`; five controls were rewritten to be contradictory. Those changes
are committed but have not been re-run.

Phase 1 is closed. The cache monitor and the step meter live in
`code/packages/core/src/session/` and are enabled by `REEF_CACHE_MONITOR` and `REEF_METER`,
each pointing at a JSONL file. Ten tests pass and the end-to-end mock run showed the meter
matching the event stream exactly and request kinds compared separately. See
`docs/05-phases/phase-1-instrumentation.md`.

Phase 2 is built and measured. The resident surface is `execute` and `question`; the other
thirteen tools are code-mode catalog entries, with a cap of three direct definitions plus
`execute` and overflow falling back into the catalog. The first request dropped from
24,205 to 14,232 bytes and from ~6,051 to ~3,558 estimated tokens.

The paid A/B ran on 2026-10-31: six tasks, two runs each, current build against a
`phase-1-ok` worktree. Current 11/12 passed, 464,537 tokens, 42,231 per pass. Old 12/12,
526,280, 43,857 per pass. Median tokens per run 31,668 against 45,585 (−30.5%), median wall
clock 42.7s against 46.6s. The mean is only −3.7% because two runs on one task blew up
(125k fail, 287k pass) at 14 and 18 model calls against a median of 6.

The one failure was `rename-refactor`: the model kept `export type OldRun = Run` as a
compatibility alias because the prompt says both "rename across every file" and "keep all
exports working", and `accept.sh` forbids `OldRun`. Three reruns passed 3/3. The fixture
prompt is the defect. See `docs/05-phases/phase-2-tool-surface.md`.

Phase 3 has all three signals built and the control sweep is clean: 10 controls, 0 passed,
828,900 tokens, no false stops. One control had the model edit the tests; the guard
restored them and it still failed. Thirteen unit tests pass and the stalling mock ends in
21 seconds. The nudge path still has no live run. See
`docs/05-phases/phase-3-bounded-loop.md`.

Phase 4 is code complete: automatic compaction is off by default, so compaction happens
only on overflow or on request, and every completed compaction writes a row with its
reason, tokens before and after, tokens dropped and usage when `REEF_COMPACTION_LOG` is
set. The long-session cache ratio and pass rate wait for the measurement batch. See
`docs/05-phases/phase-4-anchoring.md`.

## Next session starts with

The measurement batch is done, 2,174,257 tokens total: controls 828,900, A/B 990,817,
rename repro 354,540. Phases 2 and 3 have evidence, phase 4 still needs a long session.

Next, in order:
1. Fix the `rename-refactor` prompt (say `OldRun` must be gone, no alias) and re-score
   that task. Then the pass-rate gate is defensible.
2. Decide on a step budget for small tasks (soft nudge at 12 model calls, hard stop at 20,
   or a no-file-change rule). The 125k and 287k runs are the reason the mean misses.
3. Add a long-session rig task so phase 4 can be measured for the cache ratio.
4. Tag phases 2 and 3 if step 1 is clean, then start phase 5 tuning.

The rig also has a counting bug: `toolCalls` is 0 on every row because the runner watches
`event.type === "tool"`, which the JSON stream never emits. Fix before the next analysis.

## Open questions

- Do `read` / `edit` really need to stay resident, or can they live in code mode? Phase 2
  measurement decides; two resident tools is the opening bet.
- Can we guarantee a retry lands on the provider that holds the cache, like Droid does?
- Does the provider in use return cache-read token counts at all? If not, that metric is
  reported unavailable, never estimated.
