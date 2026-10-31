# Phase 2 — Resident tool surface

Status: code complete · 2026-10-31 · gate partly met

Gate: two resident tools, a hard cap of four, tokens per passed task not worse, and the
pass rate held.

## What changed

Every tool that was resident (read, edit, write, patch, shell, grep, glob, todo, webfetch,
websearch, subagent, skill, image-generate) is now `codemode: true`, so it is reachable
from an `execute` program instead of sitting in the request prefix. `question` stays
resident because it has to interrupt the user synchronously, and `execute` is the code
mode entry point, so the surface is exactly those two.

`packages/core/src/tool.ts` now enforces a resident cap. `RESIDENT_LIMIT` is three direct
definitions, and `execute` makes four. Anything past the cap is added to the Code Mode
catalog instead of being dropped, so a future plugin cannot silently add prefix weight or
make a tool unreachable. When code mode is disabled by permissions the old behaviour is
kept: every tool becomes direct, because the catalog would be unreachable.

Permissions are unchanged. Code mode calls still pass through `beforeExecute` and
`executeTool`, so the edit, shell and web permission rules apply to a tool whether it is
called directly or from a program.

## Measured prefix, first real request

Same mock, same prompt, same model, measured with `rig/measure-prefix.ts`.

| | phase 0 | phase 2 | change |
|---|---|---|---|
| tool definitions | 13 | 2 | −83% |
| tool bytes | 15,517 | 2,674 | −82.8% |
| system bytes | 8,653 | 11,548 | +33.5% |
| total bytes | 24,205 | 14,232 | −41.2% |
| estimated tokens | 6,051 | 3,558 | −41.2% |

The system part grew because the Code Mode catalog is injected as instructions: one line
per moved tool with its signature. That is the trade. The catalog is still far smaller
than thirteen JSON schemas, and the net first request is 41 percent smaller.

The two remaining definitions are `question` at 1,459 bytes and `execute` at 1,215 bytes.

## Functional check

One real call against DeepSeek V4.1 Flash: "Using the tools available to you, create a
file note.txt in the current directory containing the text ok". The file was created and
the reply was `done`. Usage was 173 input tokens plus 3,840 cache-read tokens and 2 output
tokens. The run used `execute` and the moved `write` tool, so dispatch through the catalog
works end to end.

## Paid A/B, 2026-10-31

Six tasks, two runs each, current build against the `phase-1-ok` tag in a separate
worktree. The current side is phases 2, 3 and 4 together, not phase 2 alone.

| | current | phase-1-ok |
|---|---|---|
| passed | 11/12 | 12/12 |
| total tokens | 464,537 | 526,280 |
| tokens per pass | 42,231 | 43,857 (−3.7%) |
| median tokens per run | 31,668 | 45,585 (−30.5%) |
| median wall clock | 42.7s | 46.6s (−8.2%) |
| total wall clock | 597s | 605s (−1.4%) |

The median says a typical task is about 30 percent cheaper, which clears the 25 percent
bar. The mean says 3.7 percent, because two runs blew up: one failure at 125,504 tokens
and one pass at 287,355 tokens, against a normal 25,000 to 45,000. Steps explain it, 14
and 18 model calls against a median of 6. Both blow-ups are model variance, not a loop:
the calls were different, so the repeat watchdog had nothing to catch.

The single failure was `rename-refactor`. The model renamed the interface and factory but
kept `export type OldRun = Run` as a compatibility alias, because the prompt says both
"rename across every file" and "keep all exports working". `accept.sh` forbids any
`OldRun` in `src`, so it failed. Three reruns passed 3/3 (36,884 median, one at 287,355).
The task wording is ambiguous and should say the old name must be gone with no alias.

## Gate status

- Two resident tools: met. The measurement shows exactly two definitions.
- Hard cap: implemented at three direct plus `execute`; overflow joins the catalog.
- Tokens per passed task not worse: partly met. Median −30.5%, mean −3.7%. The mean is
  dominated by two outliers on one task.
- Pass rate held: not proven. The one failure is an ambiguous fixture, not a wrong fix;
  the reruns pass. Fix the prompt, then re-score that task.

The paid A/B used 990,817 tokens across 24 sessions, about 20 minutes. Controls and the
repro bring the measurement spend to 2,174,257 tokens.

## Test state

- `bun test test/codemode` in `packages/core`: 23 pass.
- `bun typecheck` in `packages/core`: no errors across 1,863 files.
- One live run, described above.

## Files

- `packages/core/src/tool.ts` (resident cap, overflow into the catalog)
- thirteen `packages/core/src/tool/plugin/*.ts` files (codemode true)
