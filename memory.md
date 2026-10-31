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
the answer, no em dashes. Prose for short replies. **For long replies, use hierarchy:
headers, short sections, one idea per block.** Updated 2026-10-31 after the user said the
wall of text was unreadable in the terminal and that people skim, not read. The old
"no headers" rule still applies to anything that fits in two or three paragraphs.

**How the user wants work done:** do not hand-hold. Do the research and the writing
yourself. No subagents. Use the `architect` skill for planning and `grill-me` to stress
test, but only bring back decisions that genuinely need the user.

**Standing constraint:** test only with `opencode-go/deepseek-v4.1-flash`. No paid runs
without approval. The user forbade further measurement on 2026-10-31; free packaging and
design work may proceed.

**Agreed order of work (do not reorder):**
1. Learn how Droid works, in depth. DONE.
2. Write that into one plain file. DONE.
3. User forks OpenCode and points at it. DONE (`opencode-dev`).
4. Read the parts of the codebase that matter. DONE (terminal path only).
5. Write the real plan docs against the real code. DONE.
6. A capable model builds it, phase by phase. IN PROGRESS (phases 0-4 done).

## What was built

Under `C:\Users\USER\Documents\reef` (git repo, base commit `defcc61`, tag `phase-0-base`):

- `README.md` — entry point, status board, known contradictions
- `docs/00-charter.md` — unchanged (owner-only)
- `docs/01-contract.md` — unchanged; its 1.4 phase order is stale, amendment proposed
- `docs/research-droid.md` — Droid 1.0 facts from Factory's own 29 Oct 2026 post
- `docs/research-code.md` — what the fork already ships, with file:line anchors
- `docs/02-architecture.md` — target state, rewritten against the real code
- `docs/03-rig.md` — task set, metrics; pass bars updated to the new phases
- `docs/04-decisions/0006` … `0012` — delta, order, BYOK, amendments, identity, deferral,
  compat skills
- `docs/05-phases/` — phase table, phase 0 through 4 files, readout
- `docs/debt.md` — open items
- `code/` — the fork, 1,777 packages installed
- `bin/reef.cmd`, `bin/reef` — dev entry points: `bin\reef.cmd --standalone` interactive,
  `bin\reef.cmd run --standalone --model opencode-go/deepseek-v4.1-flash "..."` one-shot
- `rig/runner.ts`, `rig/scaffold.ts`, `rig/mock/server.ts`, `rig/measure-prefix.ts`,
  `rig/results/` (gitignored)
- `code/packages/core/src/session/cache-monitor.ts`, `meter.ts`, `runner/watchdog.ts`
- `code/packages/core/src/session/compaction.ts` — event-driven, ledger row per compaction

## Decisions made

- **Reef is a delta, not a rewrite (ADR 0006).** The fork already has an append-only loop,
  four-breakpoint cache markers, sandboxed code mode, file-backed tool output, and
  per-model prompt addenda.
- **Four changes only:** cache monitor, resident tool surface (two tools, cap four),
  bounded loop, anchoring default.
- **Phase order (ADR 0007):** 0 baseline → 1 monitor → 2 tool surface → 3 bounded loop →
  4 anchoring → 5 tuning → 6 polish. No reordering.
- **Baseline deferred (ADR 0011).** 66 paid sessions was too expensive; the A/B against
  the `phase-1-ok` worktree is the substitute.
- **No keys, no payment, no telemetry (ADR 0008).** BYOK, local, no shipped credential.
- **Identity is Reef at the surface (ADR 0010).** `reef`, `reefcode`, `reef.json` (with
  one release of `opencode.json` fallback), `reef` data dir, `REEF_*`. Internal
  `@opencode/*` package names stay for mergeability.
- **No global skill ingestion (ADR 0012).** Ignores `~/.claude/skills` and
  `~/.agents/skills`; `REEF_COMPAT_SKILLS=1` restores upstream. Cut 397,788 → 8,652
  system chars; one live call dropped 101,306 → 5,378 input tokens.
- **Resident surface is `execute` + `question`, cap three direct definitions plus
  `execute`.** Thirteen tools moved into the code-mode catalog; overflow joins the catalog.
- **Automatic compaction is off by default.** Compact only on overflow or on request; log
  each compaction with reason, before/after, tokens dropped and usage when
  `REEF_COMPACTION_LOG` is set.
- **Runs are hermetic.** Run dirs outside `C:\Users\<name>` (`C:\reef-rig`, `C:\reef-rig-b`)
  because config discovery walks parents and ingests user skills.
- **Rig auth is seeded from the local credential store**, not configured.
- **Charter and contract amendments are pending with the owner (ADR 0009).**
- **Packaging comes before more engine work (user decision, 2026-10-31).** Unlocks a
  Reef-vs-Claude-Code head-to-head. UI is a focused readability pass after packaging, not
  a full restyle first.

## Key facts, carrying forward

Droid (Factory, 29 Oct 2026):

- Script tool = JS in a sandbox with no fs/net/system; tool calls via bridge; hundreds of
  calls per request; printed output capped; full results to searchable files; 5-minute wait
  then partial return; background + wake, no polling.
- 15 tool calls: 10 model calls / 56.8 s → 5 model calls / 41.6 s. Cost −15% on Opus 5.5,
  concentrated in the 12.5% of scripts with 6+ calls.
- 312-call Linear cleanup case: ~36 round trips, ~3.1M tokens → 2 requests, 61k tokens
  (vendor claim, ~98% reduction). This is the case our short rig cannot reproduce.
- Cache: 98% of input from cache per request, 98.6% of requests strictly append-only, over
  20.4M requests.
- Prompt: base 20,887 → 13,055 (−37%); tools 11 → 2; tool definitions −46%.
- Stop rules: 4 min stream silence → drop/retry; hard limit 2 attempts; 3 empty turns →
  stop; 3 identical calls → nudge, 6 → stop.
- Benchmarks (vendor): Opus 5.5 65.2%, OpenCode 62.1%, Claude Code 57.6%. GPT-6.1 Sol
  57.6% vs Codex 54.0%, but 10% slower than Codex.

Our fork and measured state:

- Loop appends (`packages/ai/src/llm.ts:173`); cache markers at 4 points
  (`cache-policy.ts:17`, cap `:24`).
- First request after phase 2: 14,232 bytes, ~3,558 tokens (13 tools, 24,205 bytes,
  ~6,051 tokens before). Tool defs are now 2,674 bytes; system is 11,548.
- **Catalog correction:** the catalog block is 2,895 bytes, about 725 tokens per request,
  not 2-3k tokens. Across six calls that is ~4,300 tokens, roughly a tenth of a small task.
- Tool output spills at 2,000 lines / 50 KiB. Timeouts 300 s headers, 900 s chunks.
  Watchdog: empty 3, nudge 3, stop 6; stall timeout 240 s with two attempts.
- OpenCode Go reports `cost: 0`; compare on tokens. Totals include cache reads, so a 287k
  run was 18 model calls with 253,952 cache reads, not 287k of fresh billing.
- **A/B vs `phase-1-ok`:** current 464,537 tokens, 42,231/pass, 11/12; old 526,280,
  43,857/pass, 12/12. Median 31,668 vs 45,585 (−30.5% tokens), median wall 42.7 s vs
  46.6 s (−8.2%). Mean only −3.7% because of two tail runs (125k fail, 287k pass) at 14
  and 18 calls against a median of 6.
- Controls: 10 controls, 0 passed, 828,900 tokens. One control edited its tests; the guard
  restored them and it still failed.
- Scores are judgement, not measurement: Droid 90, Claude Code 81, Reef 71, OpenCode 69.
  Reef subscores: efficiency 85, speed 76, reliability 70, maturity 30. Overall is 79% of
  Droid; engine axes ~86%, product ~30%. No Reef-vs-Claude-Code or Reef-vs-Droid run
  exists.

## Current state

Phases 0-4 are code complete and tested. 21 unit tests across the three additions pass.
Everything below is committed at `bce2718` except three working-tree edits:

- `rig/tasks/rename-refactor/task.yaml` and `rig/scaffold.ts` — prompt now says `OldRun`
  must not remain, no alias. Fixes the only A/B failure.
- `code/packages/cli/script/build.ts` — `OPENCODE_CLI_NAME` now `'reef'`.

Not yet done: the rename fix is uncommitted and unscored; the standalone build has never
been run; `reefcode` metadata and install docs do not exist.

Known gaps: no long-session run, no many-call task, no hard tasks, `rig/runner.ts`
`toolCalls` always 0 (watches `event.type === "tool"`, which the JSON stream never emits),
no script-first instruction, no verified-done guard, no repo map, no router, no mission
mode.

## Next session starts with

1. Commit the three working-tree edits (rename prompt and scaffold, CLI name).
2. Attempt the standalone build from `code/packages/cli`:
   `bun run build --single --skip-web-ui`, then check `--version` and one real run.
3. Finish packaging: `reef` bin, version `0.1.0`, `reefcode` package metadata, install docs.
4. Then the engine fixes in this order: script-first instruction + step budget (kill the
   14-18 call tail), verified-done guard (clean test run plus non-empty diff), lazy tool
   catalog.
5. Then one many-call task (100+ tool calls) and one long-session task, when measurement is
   approved again.
6. Then a focused TUI readability pass, then the router.

Do not run paid measurement without asking.

## Open questions

- Do `read` / `edit` need to stay resident, or can they live entirely in code mode?
- Can Reef guarantee a retry lands on the provider holding the cache, like Droid does?
- Does the provider return cache-read counts at all? If not, report unavailable, never
  estimate.
- Will the user's landing-page head-to-head be same-model? Claude Code is Anthropic-bound,
  so DeepSeek through it needs a proxy; OpenCode is the fair same-model pair.
- Is the tail a prompt problem or a model-confidence problem? The script-first instruction
  is the cheap test.
