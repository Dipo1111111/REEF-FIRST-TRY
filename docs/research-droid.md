# Reef — What Droid 1.0 actually does

Status: written 2026-10-31 from primary sources. Every number here is Factory's, not ours.
Our own numbers come from the rig and nowhere else.

Main source: *Droid 1.0: Building a Frontier Harness*, Factory Research, 29 October 2026,
https://factory.com/news/frontier-harness — including its methodology section.
Secondary checks: Vals AI Terminal-Bench 4 leaderboard (22 Oct 2026), CodingFleet's
leaderboard summary (23 Oct 2026).

---

## 0. How they measured

- Harnesses compared: `codex@0.163.0`, `claude-code@2.1.306`,
  `cursor-cli@2026.10.19-6bbf2c4`, `devin@3000.11.92`, `opencode@2.1.2`.
- Models: Claude Opus 5.5 and GPT-6.1 Sol, both at high reasoning.
- Benchmark: Terminal-Bench 4, all tasks, default limits, 3 trials per task, run 23–28 Oct.
- Cost and time are per **passed** task, at list price, counted only on tasks both
  harnesses passed in all three trials.
- Cache numbers come from 20.4M production Droid CLI requests over the 7 days to 22 Oct,
  with CI and evals excluded.

That last line matters. Their cache claim is measured on real traffic, not a benchmark.

---

## 1. Script tool (programmatic tool calling)

The model writes JavaScript. The JavaScript runs in a sandbox with no file, network, or
system access. Tool calls go out through a bridge to the real tools. One model request
can contain hundreds of tool calls.

Details that are easy to miss:

- Printed output is capped. Full results are written to files the model can search later.
- Independent calls run concurrently, so a batch costs as much as its slowest call.
- A program waits up to 5 minutes, then hands back its output so far. It can also start
  in the background and return immediately.
- A dedicated tool checks on, waits for, or stops a running program. Droid wakes the
  model when background work finishes. No polling.
- Programs get real data: whole files, structured typed search results.
- Literal text travels raw (`<content>` blocks), not JSON-escaped strings.
- An edit inside a program returns the same short summary as a direct edit. The file
  never comes back into context.

Measured on one replayed session (fixing a failing unit test, GPT-6.1 Sol, high reasoning):

| | Direct calls | Script tool |
|---|---|---|
| Tool calls | 15 | 15 |
| Model calls | 10 | 5 |
| Wall clock | 56.8 s | 41.6 s |
| Time inside model calls | 42.3 s | 28.0 s |

Cost: Script mode cut Droid's cost **15% on Opus 5.5**. The savings are concentrated:
**12.5% of scripts make six or more calls**, and that tail carries the win. Most scripts
are small.

Two worked examples from their own sessions:

- Linear cleanup: 151 issues, 312 tool calls. Two requests and about 61,000 tokens.
  Direct calls would have been about 36 requests and 3.1M input tokens.
- CI sweep: 5,384 jobs, 550 tool calls. Two requests. Under 0.1% of tool results reached
  the model's context. Ran in the background for about 8 minutes.

Script mode is on by default for: GPT-6.1 Sol, GPT-6.1 Terra, GPT-6 Astra, GPT-6 Sol,
GPT-5.6 Sol, Claude Fable 5.1, Claude Fable 5, Claude Opus 5.5, Claude Opus 5, Kimi K3.

They say a goal of tuning was that **given both Script and direct tools, the model picks
Script**. That is a prompt and description problem, not just a runtime problem.

---

## 2. Prompt cache discipline

Providers cache by prefix. Change anything early in the request and everything after it
is processed again.

Droid's requests were already append-only **except tool discovery**. Tool definitions sit
near the top, so loading an MCP tool mid-session reprocessed the whole conversation.

The fix: append newly discovered tools at the **end** of the request, leaving the cached
prefix untouched.

| Change during a session | Next request read from cache |
|---|---|
| Git status changes | 99.1% (176 new tokens out of ~20k) |
| Session rolled back | 99.8% |
| Second subagent, same type | 96.5% |
| New tool loaded (26,400 tokens) | 100% |

Production: **98% of input read from cache per request**, **98.6% of requests strictly
append-only**, **91.5% token-weighted**.

They run a monitor that compares every request with the one before it and **names the
part that broke the cache**. The monitor is what finds the regressions worth fixing.
Errors do not reset the cache, because a failed request is retried on the provider that
already holds it.

---

## 3. Prompt budget

Between 0.170.0 and 0.250.0, the first request of a session (user types "hi"):

| Part | Before | After | Change |
|---|---|---|---|
| Tool definitions | 15,798 | 8,528 | −46% |
| Startup reminders | 3,463 | 2,362 | −32% |
| System prompt | 1,618 | 2,155 | +33% |
| The message "hi" | 8 | 10 | +2 |
| **Total** | **20,887** | **13,055** | **−37%** |

Tool definitions sent up front: **11 → 2**. Rarely used tools load on demand.

The system prompt grew on purpose: more guidance on how the agent talks to the user, and
on environment details (images, connected apps, personal data). Everything else was
shortened.

Caveat they publish themselves: the two releases ran on different models, so tokenizers
differ. Counted in characters the drop is 57,035 → 36,802 (−35%), not −37%.

---

## 4. Bounded autonomy

Rules live in the loop, not the prompt, so they apply to every provider.

| Situation | Detection | Action |
|---|---|---|
| Stream goes quiet | 4 minutes of silence (Factory-managed Anthropic streams) | treat as dropped stream, retry |
| Response hits a hard time limit | — | at most 2 attempts |
| Response breaks partway | partial output exists | remove the partial before retrying |
| Repeated empty work | 3 turns in a row with no visible output | stop |
| Repeated calls | 3 identical tool calls | nudge |
| Still repeating | 6 identical tool calls | stop |
| Repeats that return new results (polling a build) | — | allowed to continue |
| Long background work | job completes | wake the model with a reminder |

Also: compaction summaries get **16,000 tokens** of room, up from 8,000, because they
estimated a third or more were filling the old limit.

---

## 5. Benchmarks (vendor-reported)

Terminal-Bench 4, cost per passed task:

| Model | Harness | Pass rate | Cost / passed task | Time / passed task |
|---|---|---|---|---|
| Opus 5.5 | **Droid** | **65.2%** | **$4.73** | **42.6 min** |
| Opus 5.5 | Cursor | 62.1% | — | 26% slower |
| Opus 5.5 | OpenCode | 62.1% | — | 24% slower |
| Opus 5.5 | Devin | 59.6% | — | 16% slower |
| Opus 5.5 | Claude Code | 57.6% | — | 26% slower |
| GPT-6.1 Sol | **Droid** | **57.6%** | **$0.79** | **25.8 min** |
| GPT-6.1 Sol | Codex | 54.0% | 12% higher | 10% faster than Droid |
| GPT-6.1 Sol | OpenCode | 51.0% | — | 4% slower |
| GPT-6.1 Sol | Devin | 45.0% | — | 11% slower |

Read this carefully. On GPT models, Droid is cheaper but **slower** than Codex. The
speed story is a Claude-model story. Public leaderboards also disagree with each other
(Vals shows Opus 5.5 + Mini-SWE-agent at 65.15% and $13.20 per task), so treat every
harness comparison as vendor-framed until our own rig reproduces it.

---

## 6. What we copy, what we don't

Copy:

1. Append-only requests, with tool discovery appended at the end.
2. A cache monitor that diffs each request against the last and names the break.
3. A small resident tool set, with the rest reachable from inside a program.
4. Stop rules in the loop: silence, empty turns, identical calls, capped retries.
5. Tool output bounded and pushed to files; only the summary returns to the model.
6. Script mode chosen by default for models that handle it.

Don't copy:

1. Their prompt text. Charter forbids it. Principles only.
2. Their 5-minute script wait as a default. Ours should be configurable and measured.
3. Their compaction size. We come at this from the other side: anchor by default and
   compact only when the provider forces us to.

Can't verify:

1. Whether BYOK works without a paid Factory plan. The post says the gains hold "when you
   bring your own API keys", but the pricing page was not checked.
2. Whether the 4-minute silence rule applies to providers Factory does not proxy. They
   say "on Factory-managed Anthropic streams", which may be narrower than it sounds.
3. Whether any of these numbers survive an independent replay on our tasks. That is what
   our rig is for.

---

## 7. Independent leaderboards (checked 2026-10-31)

Everything in section 5 is Factory describing Factory. These are other people's numbers for
the same benchmark, and they do not agree with each other. Read the harness column, not just
the score.

**Terminal-Bench public board** (`tbench.ai`, Terminal-Bench 4.0, 66 tasks, 5 trials per task,
8-hour limit, each harness run by its own lab):

| Harness | Model | Resolution rate |
|---|---|---|
| Claude Code | Opus 5.5 (max) | 64.8% � 3.1 |
| Claude Code | Sonnet 5.5 (max) | 61.8% � 2.9 |
| Codex | GPT-6 Astra (max) | 58.2% � 2.8 |
| Claude Code | Fable 5.1 (max) | 57.9% � 3.8 |
| Grok Build | Grok 4.7 (xhigh) | 37.6% � 3.5 |

**Vals AI** (its own harness around mini-swe-agent, three runs per task, Daytona sandboxes):
Opus 5.5 65.2%, Sonnet 5.5 64.1% � 1.01. Same benchmark, different harness, so Claude Code's
64.8% and Vals' 65.2% are not the same measurement.

**Artificial Analysis** re-ran the same 66 tasks inside mini-SWE-agent and reports Opus 5.5 at
59.6% and Sonnet 5.5 at 63.6%. Opus 5.5 therefore appears as 64.8%, 65.2% and 59.6% on three
boards. That spread is the size of the harness and methodology effect, and it is larger than
most of the gaps the vendors advertise.

Artificial Analysis also compares harnesses directly, but not on the same model: Claude Code
63% on Opus 5.5 against OpenCode 40% on GLM-5.3. That is a model comparison wearing a harness
label. The only same-model OpenCode figure we have is Factory's 62.1% on Opus 5.5.

Factory's own same-model table, for reference again: Droid 65.2, Cursor 62.1, OpenCode 62.1,
Devin 59.6, Claude Code 57.6 on Opus 5.5. Note how far Factory puts Claude Code (57.6) below
the public board's 64.8 for the same model and harness. A vendor measuring a competitor is
the least reliable row in any table, including this one.

**Our model, DeepSeek V4.1 Flash**, on the same benchmark, from three sources:

| Source | Terminal-Bench 4.0 |
|---|---|
| DeepSeek's own model card | 42.30% |
| Vals AI | 19.70% � 1.75 (cost $0.50 per task, 48m22s per task) |
| Community aggregate | 26.8% |

A 22-point spread on one model and one benchmark. DeepSeek's card is the highest and Vals,
which publishes its harness and runs three trials, is the lowest. Treat the model card figure
as marketing until it reproduces.

### What this means for us

Our rig is not Terminal-Bench 4.0 and our tasks are far smaller, so Reef's rig numbers cannot
be inserted into any table above. What the tables do give us is the size of the gap Reef would
have to close: on Opus 5.5 the harness spread runs 57.6% to 65.2%, roughly 8 points, and on
DeepSeek V4.1 Flash the same benchmark reads anywhere from 19.7% to 42.3%. Any claim that a
harness change moved scores by less than that is noise.

The one comparison worth making later is Reef against mini-swe-agent or OpenCode on DeepSeek
V4.1 Flash, on Terminal-Bench 4.0 itself. That is not this rig and not this phase.
