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

## Gate status

- Two resident tools: met. The measurement shows exactly two definitions.
- Hard cap: implemented at three direct plus `execute`; overflow joins the catalog.
- Tokens per passed task not worse: not measured. The first request is 41 percent smaller,
  which is the mechanism the gate cares about, but token per passed task needs a paid
  before-and-after on the rig.
- Pass rate held: not measured. Same reason.

The paid A/B is 12 real tasks twice on the current build and the same 12 twice on the new
build, about 24 sessions, roughly 1M tokens and half an hour. It waits for the owner,
because the previous paid run was cancelled and the baseline is still deferred.

## Test state

- `bun test test/codemode` in `packages/core`: 23 pass.
- `bun typecheck` in `packages/core`: no errors across 1,863 files.
- One live run, described above.

## Files

- `packages/core/src/tool.ts` (resident cap, overflow into the catalog)
- thirteen `packages/core/src/tool/plugin/*.ts` files (codemode true)
