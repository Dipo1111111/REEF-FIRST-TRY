# Reef

A terminal coding agent built to spend fewer tokens than the harness it came from, and to finish.

Reef is a fork of OpenCode v2. The engine, the plugin surface, and the session model are inherited. The product, the prompt, the context policy, and the speed work are Reef's.

Current self-score: **80 / 100**. Droid 89, Claude Code 79, OpenCode 77.

---

## 1. The thesis

Three ideas, in order of importance.

**Script mode beats chat mode.** A chat-mode agent makes one tool call, waits, reads the result, decides again. Every round trip resends the whole conversation. Reef hands the model a JavaScript sandbox and a catalog, so one program can do twenty tool calls locally and return one answer. The landing-page run made two model calls. The head-to-head run finished a twelve-file page in 19 steps where native OpenCode was still going at 61.

**The transcript is the bill.** The system prompt is not the cost. On the measured run it was **3.4k tokens**. The cost was the conversation growing: one step carried 53 KB of the model's own tool arguments, and every later step paid for it again. Reef now attacks that directly instead of optimising the prompt.

**The harness should be boring.** One accent colour, one obvious command, no dashboard. A coding agent is a tool you talk to, not a product you visit.

---

## 2. Architecture at a glance

Bun monorepo, Effect-based services, SQLite for durable state.

| Package | Role |
|---|---|
| `schema` | Wire and storage contracts shared by everything |
| `protocol` | HTTP surface and event shapes |
| `server` | Hosts sessions, tools, plugins, providers |
| `core` | The engine: session runner, tools, Code Mode, permissions, skills, compaction, revert |
| `client` / `sdk` | Typed client and generated API |
| `tui` | Terminal UI, OpenTUI renderer |
| `app` / `desktop` | Web and desktop surfaces |
| `session-ui` | Shared session components and tool renderers |
| `codemode` | Sandboxed JS runtime, tool bindings, catalog |
| `plugins/figma` | Example of a first-party plugin with skills |
| `simulation` | Provider simulation for tests |

The dependency direction is deliberate: `schema` <- `protocol` <- `server`, with `core` owning runtime behaviour. Client code never imports core or server.

### The session runner

One step is one model call. There is no in-memory tool loop. After a tool call, the runner reloads durable history and builds a fresh request, which is what makes crash recovery and revert possible.

- **Durable messages.** Every assistant message, tool call, and result is persisted before the next step. Killing the process does not lose the session.
- **Step budget.** A nudge at step 12 tells the model to wrap up. A hard ceiling at 24 forces a text-only summary. Per-agent limits override both.
- **Compaction.** Automatic by default, with a 25 percent buffer. Session length is bounded, not left to hope.
- **Revert.** Snapshot-based undo and redo at the session level, surfaced as `/undo` and `/redo`.
- **Watchdog.** Stops a model that produces three empty turns with no text and no tool call.
- **Provider cache discipline.** History is append-only where possible, and provider metadata is reused, so the prefix stays warm.

### Code Mode

The model gets at most **three direct tools** (`RESIDENT_LIMIT = 3` in `tool.ts`). Everything else lives in the Code Mode catalog, called as JavaScript inside `execute`.

```
const files = await tools.glob({ pattern: "**/*.md" })
const hits = await Promise.all(files.map((f) => tools.grep({ pattern: "TODO", path: f })))
return hits.map((h) => h.path)
```

- `search` finds catalog entries the model cannot see.
- `fetch` is available for HTTP; filesystem access is not.
- The catalog is lazy. It costs a few lines until the model asks for more.
- The UI shows inner calls as rows under one `execute`, which is why a scripted run looks like many tool calls but bills as one step.

---

## 3. The context economy

Five layers, each measurable.

| Layer | What it does | Effect |
|---|---|---|
| Lazy catalog | Only 3 tool schemas resident; the rest discoverable | Startup prompt ~3.4k |
| Tool argument elision | Completed calls over 4 KB replay as a note | Removed 26 KB and 37 KB of inline HTML/CSS from every later step |
| Read dedupe | Same file, same range, same content returns one line | Stops the "read it again to be sure" loop |
| Return cap | `execute` returns over 16 KB are truncated with a note | Stops a script dumping a file or log into the transcript |
| Compaction | Auto at 25 percent headroom | Bounds the long tail |

Plus two inherited limits: tool output is capped at 50 KiB or 2,000 lines, and images are resized before they enter context.

### Read dedupe

The read tool hashes the body it returned, keyed by session, absolute path, offset, and limit. A second identical read returns:

```
Read file README.md, lines 1-120: unchanged since the earlier read in this session. Use the content you already have; do not read it again.
```

A file change, a different range, or a new session returns the body. The map holds 256 entries and only tracks reads over 200 characters.

### Sandbox filtering

Raw tool results stay inside the JS runtime. Only the returned value crosses into the conversation. The prompt now says so explicitly, and the harness enforces a 16 KB ceiling rather than trusting the model to summarise.

This is the same mechanism Droid describes. Reef had the sandbox; it did not have the discipline. It does now.

---

## 4. Tools, permissions, skills

**Tools.** `read`, `write`, `edit`, `patch`, `glob`, `grep`, `shell`, `webfetch`, `websearch`, `subagent`, `todo`, `question`, `skill`, `schedule`, MCP tools, and plugin tools. Built-ins are registered through one transform; the registry validates input and output at runtime.

**Permissions.** Rules are `(action, resource, effect)` triples with wildcards. Last match wins, so `deny *` followed by `allow x` is a clean allowlist. Permission prompts are typed and survive interruption.

**Skills.** `SKILL.md` with frontmatter, progressive disclosure, scripts allowed. Reef reads its own config directory plus any configured sources. The OpenCode skill folder is mounted read-only through `skills: ["~/.config/opencode/skills"]`, with deny-by-default permissions. Ten skills are advertised: architect, debug, design-taste-frontend, fleet, frontend-design, grilling, humanizer, impeccable, opencode, remember. Two more are allowed but marked user-invoked, so the model does not auto-load them.

The system prompt tells the model to load a matching skill **without asking first**, and to skip only when the user says not to or nothing matches.

**Agents.** Build and Plan ship by default. Plan is read-only and refuses edits. Custom agents are config objects with their own prompt, tools, permissions, and step limit.

**MCP.** Remote and local servers, with descriptions and instructions injected into the prompt and Code Mode wrapping their tools by default.

**Plugins.** Skills, agents, tools, commands, and hooks are all plugin surfaces. The Figma plugin is the reference implementation.

---

## 5. UI and UX

Design language: terminal-native, quiet chrome, one accent.

- **Home.** A redesigned landing state: wordmark, the composer, a short hint line. No dashboard, no cards.
- **Session.** User turns, thinking, tool rows, and answers in one column. Thinking is collapsed by default. Tool rows group under the call that produced them.
- **Colour.** Red is the interactive hue in both themes, used for focus and the live cursor. No warning orange in the thinking header.
- **Dialogs.** Rounded frames, centred, one decision each.
- **Palette.** Titled "Command palette", flat list, fuzzy match.
- **Copy.** The product says Reef everywhere a user can see it. Internal `@opencode/*` identifiers stay, because renaming the package graph buys nothing.
- **Update check.** Disabled. A harness should not phone home.

Commands that matter: `/undo`, `/redo`, `/compact`, `/fork`, `/review` (planned). Modes: Build and Plan. Skills can be invoked directly or loaded by the model.

### Inspiration

- **Droid** for the architecture bet: programmatic tool calling, sandbox filtering, a tiny resident tool set, and the claim that a harness can be measured on tokens instead of vibes.
- **Claude Code** for the calm surface: one column, obvious commands, Plan mode, undo.
- **OpenCode** for the engine and the plugin model, which Reef inherits rather than rebuilds.
- **The skill ecosystem** for progressive disclosure: a short description in the prompt, the full playbook only when needed.

Reef does not copy a visual style. It copies the constraint: the interface should disappear behind the work.

---

## 6. Model and provider

Default: **OpenCode Go / DeepSeek V4.1 Flash**.

| | Per million tokens |
|---|---|
| Input | $0.15 |
| Output | $0.60 |
| Cache read | $0.003 |

A twelve-second landing-page turn cost **$0.0019**. The same turn on frontier pricing is about seven cents.

The harness is model-agnostic. The prompt, the budget, and the compaction policy are harness properties, not model properties.

---

## 7. Measured

Head-to-head, same prompt, same model, isolated configs, empty project, sequential runs.

| | Reef | Native OpenCode |
|---|---|---|
| Wall clock | **6m 05s** | killed at 31m 27s |
| Steps | **19** | 61 |
| Input tokens | 77k | not finished |
| Cache reads | **639k** | 3.8M |
| Tool calls | 18 scripted | 86 direct |
| Result | finished, branded page | never finished |

Landing-page run, the small case:

| | |
|---|---|
| Wall clock | 12.8s |
| Steps | 2 model calls |
| Output | ~2,200 tokens, ~1,250 of them the page |
| Cost | $0.0019 |
| Cache share | ~91 percent |

The honest caveat: the context changes shipped after that duel have not been re-measured end to end. The 639k figure is the last full run. A re-run is one benchmark row away.

---

## 8. Reliability

The core session-runner suite is the reliability signal: **243 scenarios**, each driving the real runner against a scripted model with a temp database.

Current state: **239 pass, 4 fail**.

- Two output-limit continuation tests with an off-by-one synthetic nudge count.
- One trimmed-request expectation that never trims.
- One extra assistant message after a declined tool call.

None are crashes. All four are in compaction or continuation, which are the expensive paths, which is why reliability scores 74 and not 85.

Separately, the read-tool suite still asserts the pre-Code-Mode tool list and fails as a block. That is test drift from making Code Mode the default, not a runtime failure. It should be updated, not ignored.

Missing proof: a forced long session that crosses compaction, and a kill-and-resume test.

---

## 9. Score

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Capability | 40 | 75 | 30.0 |
| Efficiency | 20 | 88 | 17.6 |
| Speed | 15 | 84 | 12.6 |
| Reliability | 15 | 74 | 11.1 |
| Product | 10 | 87 | 8.7 |
| **Total** | **100** | | **80.0** |

Capability is the biggest cost: no review workflow, no checkpoint picker, no benchmark row. Reliability is second: four failures and no long-session proof.

---

## 10. What is missing

1. **Review.** A read-only review agent plus `/review` over the working diff.
2. **Checkpoint picker.** The revert API exists; the UI does not expose choosing a point.
3. **Benchmark row.** One measured, reproducible table with the new context policy.
4. **Green suite.** Fix the four runner failures, update the read tests, add a long-session gate.
5. **Agent Factory.** Continuous harness tuning against failures. Reef has none, and it is the largest structural gap versus Droid.
6. **Distribution.** npm publish is blocked by a suspended account. macOS binaries need CI.

---

## 11. Build

```bash
cd code/packages/cli
OPENCODE_VERSION=0.1.0 OPENCODE_CHANNEL=latest bun run build --single --skip-web-ui --skip-install
bun run pack
npm install -g code/dist/npm/reefcode-windows-x64-0.1.0.tgz code/dist/npm/reefcode-0.1.0.tgz
```

Config: `~/.config/reef/reef.jsonc`. Data: `~/.local/share/reef`. Skills: `~/.config/reef/skills` plus configured sources.

---

## 12. Glossary

- **Step**: one model call.
- **Code Mode**: the sandbox where catalog tools run as JavaScript.
- **Catalog**: the searchable list of tools available inside `execute`.
- **Resident tool**: a tool the model can call directly, at most three.
- **Nudge / ceiling**: the step-12 wrap-up prompt and the step-24 hard stop.
- **Append-only history**: keeping the request prefix stable so the provider cache stays warm.
- **Elision**: replacing an oversized completed tool argument with a note in replayed history.
