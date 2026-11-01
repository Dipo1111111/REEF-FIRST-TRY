# Memory — Reef

Last updated: 2026-11-01

## Recurring context

**Project root:** `C:\Users\USER\Documents\reef` (git repo, branch `main`).
**Fork:** `C:\Users\USER\Documents\reef\code` — the OpenCode monorepo.
Read mainly `packages/cli`, `packages/core`, `packages/codemode`, `packages/ai`.

**Name:** Reef. Binary `reef`, npm package `reefcode`, platform packages
`reefcode-<os>-<arch>`. Internal `@opencode/*` names stay.

**How the user talks:** plain words, short sentences, lead with the answer, no em dashes.
They skim. Long replies get headers and short sections. They get impatient with process
talk, so state the number or the decision first.

**How the user wants work done:** no subagents, do the research directly. Test only with
`opencode-go/deepseek-v4.1-flash`. Keep paid runs minimal and say the cost when it matters.

**Build** (from `code/packages/cli`):

```
OPENCODE_VERSION=0.1.0 OPENCODE_CHANNEL=latest bun run build --single --skip-web-ui --skip-install
bun run pack
npm install -g code/dist/npm/reefcode-windows-x64-0.1.0.tgz code/dist/npm/reefcode-0.1.0.tgz
```

**Windows trap:** kill running `reef` processes before building or installing, or you get
EPERM/EBUSY. A failed build still lets `pack` ship the previous binary.

**Paths:** config `C:\Users\USER\.config\reef\reef.jsonc`, skills `~\..config\reef\skills`,
data `C:\Users\USER\.local\share\reef`. SQLite tables: `session_v2`, `session_message`,
`session_part`. Credential: `auth.json` key `opencode-go.key`.

**Benchmark rig:** `C:\Users\USER\AppData\Local\Temp\duel\`. Prompt `prompt.txt`, stripped
config `reef\config`, scripts `steps.ts` (per-step tokens), `imagesize.ts`, `resumecheck.ts`.
Run: `XDG_CONFIG_HOME=...\duel\reef\config; reef run --standalone --auto -m
opencode-go/deepseek-v4.1-flash --format json $prompt`.

## What was built this session

**Context diet** (commits `6ba3c51`, `19da507`):

- Replayed tool arguments over 4 KB are replaced with a note and `omittedBytes`
  (`session/runner/to-llm-message.ts`).
- Read dedupe: hash of the returned body keyed by session, absolute path, offset, limit.
  256-entry map, 20 minute TTL so compaction cannot leave a stale note
  (`tool/plugin/read.ts`). Returns "unchanged since the earlier read".
- `execute` return cap at 16 KB, head 2 KB plus tail 6 KB, marker with omitted byte count
  (`codemode/tool.ts`). Prompt section "What comes back" plus one line in the tool
  description reinforcing sandbox filtering.

**Skills parity with OpenCode:**

- `C:\Users\USER\.config\reef\reef.jsonc` mounts `~/.config/opencode/skills` and uses
  deny-all plus 12 allows. Ten are advertised (grill-me and handoff are user-invoked only).
- `frontend-design` copied into `~/.config/reef/skills` because it lives in `~/.agents`.
- Prompt now says load a matching skill without asking (`skill/instructions.ts`).

**Time sense** (commit `07373ce`):

- New `time` tool, resident, returns now, session start, elapsed.
- Prompt rule when the tool is present: call `time` before any duration answer, estimate in
  edits and minutes, days only for multi-session work.
- Step-12 nudge also injects `Elapsed: Nm` as a second synthetic line.

**Tests and images:**

- New registry test: a denied tool is absent from definitions and the sandbox catalog and
  cannot execute.
- Image defaults dropped from 2000px / 5 MB to 1280px / 256 KB (`image.ts`). Screenshots
  fell from 215 KB to under 145 KB.

**Docs:** `docs/reef.md` — 12 sections covering thesis, architecture, context economy,
UI/UX, measured results, reliability, score, gaps.

## Measured

| Metric | Before today | After |
|---|---|---|
| Context per step | 34k | **22k** |
| Cache share | 80.2% | **89.0%** |
| Landing-page run | 24 steps, 5m12s | 34 steps, 7m03s |
| Cost per run | ~2.6 cents | ~3.0 cents |

Cache resets still follow large screenshots (144 KB and 92 KB). A 135 KB screenshot did not
reset, so size is not the only trigger. Remaining cause is provider behaviour on image
requests, not Reef trimming.

## Verified

- `packages/core` typecheck clean (1,872 files).
- Runner suite: **239 pass, 4 fail** (same 4 as before: compaction trim, decline interrupt,
  two output-limit continuation counts).
- Compaction suites: **45/45**. Session execution/resume: **36/36**. Execute and codemode:
  **15/15**. Tool registry: 42 pass, 1 pre-existing fail.
- Read tool suite: **28 fail** because it asserts the pre-Code-Mode tool list. Stale tests,
  not a runtime failure. Needs a helper that invokes catalog tools through `execute`.
- Live kill test: claim survives (`time_suspended` set, messages intact) but the next
  `reef run --standalone` boot never swept it (`resume_attempts` stayed 0). Resume works at
  the service layer, not in the mode we benchmark.

## Decisions

- Self-score **81/100**: capability 76, efficiency 90, speed 85, reliability 73, product 87.
- Two tasks at a time, in this order: resume + green suite, then `/review` + checkpoint
  picker, then benchmark script + long-session gate.
- Do not chase 98% cache. 89% is enough to quote; the remaining gap is provider-side.
- Do not rewrite the read suite half-way. Fix it properly or leave it documented.

## Next session starts with

**The work for the next run is written down in `docs/handoff-pair-1-2.md`.** Hand that file to
Reef in a new terminal with this instruction:

```
Read AGENTS.md, memory.md, and docs/handoff-pair-1-2.md. Execute Pair 1 and Pair 2 in
that order. Stop and report after each pair with what changed, commands run, pass/fail
counts, and wall-clock time. Do not start anything outside those two pairs.
```

Pair 1: restart recovery in `reef run --standalone`, then the green suite. Pair 2:
`/review`, then the checkpoint picker. Expected agent time is 2 to 4 hours per pair. If a
pair passes 6 hours, stop it and inspect the diff before letting it continue.

After both pairs and a fresh benchmark row, the order is: benchmark script plus
long-session gate, then sub-agent offload plus output elision, then prefix instrumentation
plus image control, then release plumbing and Agent Factory.

## Open questions

- What exactly makes an image-bearing request miss the provider cache when the neighbouring
  one hits? Needs prefix hashing at request build.
- Is the 2-call programmatic claim real at 300 tool calls? The small task did 2; the scale
  case has never been run.
- Should `--standalone` own restart continuity, or is that reserved for the managed server?
  The current answer is the latter, and it costs us crash survival.
- npm publish remains blocked by a suspended account; macOS binaries need CI.
