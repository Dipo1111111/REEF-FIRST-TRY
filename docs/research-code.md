# Reef — What the fork already does

Status: written 2026-10-31. Scope: the terminal/headless path only. Desktop, web, TUI,
app, console and website packages were not read.

Source tree: `C:\Users\USER\Documents\opencode-dev` (no `.git`, so no commit to record
yet). Every claim below was checked by reading the file named. Anything I only saw in a
grep is marked *(grep only)*.

---

## 1. The terminal path

```
argv
  └─ packages/cli/src/index.ts              command table
       └─ packages/cli/src/run/run.ts       command wiring
            └─ packages/cli/src/run/noninteractive.ts   headless run, event stream
                 └─ @opencode/core session services
                      ├─ session/runner/llm.ts   turn loop (drain)
                      ├─ session/runner/step.ts  one model call + its tools
                      ├─ session/model-request.ts  request construction
                      └─ @opencode/ai/llm.ts     provider stream, one request
```

Headless output already exists in two shapes: a human stream, and `--format json`
one-JSON-object-per-line events that carry `cost` and `tokens`
(`packages/cli/src/run/noninteractive.ts:104`, `:508`, `:689`). A rig can read that
without touching the harness.

---

## 2. The turn loop

`packages/ai/src/llm.ts:135` is the whole loop: stream a response, dispatch every
client-side tool call concurrently, then build the next request as

```ts
messages: [...request.messages, response.message, ...toolResults]   // llm.ts:173
```

That is append-only by construction. There is an `until` hook for step budgets
(`llm.ts:119`).

Above it, `packages/core/src/session/runner/llm.ts:61` (`drain`) owns the outer
lifecycle: inbox promotion, manual compaction, moves, title generation, idle hooks, and
`runStep` (`:230`). Per step it:

1. estimates the prompt and runs **automatic compaction** (`:241`),
2. checks the agent step limit (`:249`),
3. builds the transcript (`:250`),
4. sends the request with tools disabled on the final allowed step (`:264`, `:268`),
5. classifies the outcome into retry, continue, output-limit, overflow-compaction, or done.

`packages/core/src/session/runner/step.ts:73` runs one attempt. Tools start as soon as
their `tool-call` event arrives (`:122`), results are truncated (`:127`), and every tool
fiber is awaited before the step settles (`:156`).

---

## 3. Request construction and caching

`packages/core/src/session/model-request.ts:101` (`baseTranscript`) builds two system
parts: the agent prompt (or a rendered default prompt), then the instruction files.
`ai.request(...)` at `:291` turns that into an `LLMRequest`. Cache TTL comes from the
model config (`:308`).

Cache markers: `packages/ai/src/cache-policy.ts`.

- Default is `"auto"` (`:17`): breakpoint on the **last tool definition**, the **first and
  last system part**, and the **conversation tail**.
- Four breakpoints maximum (`:24`), manual hints count against the budget.
- Routes that ignore inline markers are skipped entirely (`:52`), with special cases for
  OpenRouter/Vercel gateways and Qwen (`:73`).
- `applyCachePolicy` runs once at compile time (`:190`).

Images are the one deliberate history rewrite: when inline image bytes pass 25 MiB,
the oldest images are replaced with a text marker down to 15 MiB, with hysteresis so the
cut does not move every request (`model-request.ts:194`). They did this to protect the
cache, and the comment says so.

Tool history is repaired, not trusted: `packages/ai/src/tool-history.ts:6` adds missing
tool results, drops orphan results, and moves system messages that would sit between a
tool call and its result.

---

## 4. Tool surface

`packages/core/src/tool.ts:265` (`snapshot`) decides what the model sees:

- Code Mode is **on by default** (`:274`). It is off only if the `execute` permission is
  wholly disabled.
- Tools registered with `codemode: false` are sent as **direct definitions**; everything
  else goes into the code-mode catalog (`:276`–`:279`).
- Direct definitions are sorted by name and sent before the `execute` definition
  (`:310`–`:315`).

Which is which, from `packages/core/src/tool/plugin/*.ts`:

| Direct (`codemode: false`) | Inside Code Mode |
|---|---|
| read, write, edit, patch, glob, grep, shell, todo, question, skill, subagent, webfetch, websearch, image-generate | the `opencode` namespace (artifact, mcp-resource, schedule, and the rest), plus MCP tools |

So a default session sends **about 15 tool definitions up front**, not two. Droid sends
two and costs 8,528 tokens for them. We have not measured ours yet. This is the largest
untested assumption in the plan.

The `execute` tool's own description is deliberately invariant
(`packages/core/src/codemode/tool.ts:74`): the changing catalog is delivered through
instructions instead. `packages/core/src/codemode/instructions.ts:32` computes a
**delta** between the previous and current catalog *(grep only)*, which is how tool
discovery avoids moving the cached prefix.

`packages/codemode` is the runtime: a confined JS interpreter, a tool catalog, per-call
bridging, and explicit limits (`timeoutMs`, `maxToolCalls`, `maxOutputBytes`, all
undefined by default — `codemode.ts:26`). Programs return `{ ok, value, logs, toolCalls }`.

---

## 5. Tool output

`packages/core/src/tool-output.ts:13`: 2,000 lines or 50 KiB, whichever hits first. Over
the limit, the full text is written to `tool_<id>` under the data directory and the model
sees the head plus `[showing lines 1-N of M; full output saved to <path>]` (`:88`–`:114`).
This already matches Droid's "keep large results in files" principle.

---

## 6. Compaction

`packages/core/src/session/compaction.ts`:

- defaults: `auto: true`, `keep: 15_000`, `precompute: false` (`:263`)
- reserve: 15% of the window, minimum 16,000 tokens (`:130`, `:136`)
- ceiling check at `:431`; automatic compaction fires before a step at >15% headroom
- summaries shrink through four transcript levels (`:149`) and a summary template
  (`:167`)
- precomputed summaries exist but are off by default (`:157`, `:344`)

Automatic compaction is therefore the normal path today, and it rewrites the request
prefix every time it fires. That is the opposite of the anchoring decision in ADR 0004.

---

## 7. Retries and timeouts

- header timeout 300 s, chunk timeout 900 s, both defaults
  (`packages/ai/src/schema/options.ts:56`, `:62`)
- retry-after capped at 15 minutes (`packages/core/src/model-retry.ts:12`)
- timeout attempts capped at 3 (`:40`); one-shot calls capped at 3 (`:77`)
- partial output is discarded only on the full-retry path (`step.ts:187`–`:193`);
  a stream that broke after output started goes through `Continue` with the existing
  partial assistant message kept

## 8. Per-model tuning

`packages/core/src/plugin/optimize.ts` swaps extra prompt text by model family:
OpenAI (`gpt.txt`), GPT-Astra, Kimi, Arcee/Trinity, Meta/Muse, Anthropic
(`anthropic.txt`, which is only a code-comment rule). This is the hook a tuning phase
would use, and it already exists.

---

## 9. What is missing versus Droid

| Droid behaviour | Ours |
|---|---|
| Cache monitor; names the part that broke the cache | **Missing.** No diff of consecutive requests anywhere. |
| Tool discovery appended, prefix untouched | **Half there.** Catalog ships as instruction deltas, but tool *definitions* still change when the direct set changes. |
| 2 tool definitions up front | **~15.** Most workhorse tools bypass Code Mode. |
| 4 min stream silence → drop and retry | **Missing.** Only a 900 s chunk timeout. |
| 3 empty turns → stop | **Missing.** |
| 3 identical calls → nudge, 6 → stop | **Missing.** |
| Partial response removed before retry | **Partial.** Only on the full-retry path. |
| Compaction is rare and deliberate | **Not ours.** Auto compaction is on by default. |
| Script mode chosen by the model over direct calls | **Untested.** We have the runtime, not the evidence the model prefers it. |

## 10. What this means

The spine the charter said we would replace already exists: append-only loop, cache
markers, sandboxed code mode, tool output to files, per-model prompt hooks.

Reef is therefore a **delta**, not a rewrite:

1. a cache monitor,
2. a small resident tool surface,
3. stop rules in the loop,
4. an anchoring default instead of automatic compaction,
5. a rig that measures all of it.

Anything that restates items the fork already ships is dead weight in the plan.
