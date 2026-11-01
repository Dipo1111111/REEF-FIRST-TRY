# Handoff — Pair 1 and Pair 2

Read `AGENTS.md` and `memory.md` first. This file is the whole task.

Each `##` section below is **one run**. Do the section named in your prompt, report, and
stop. Do not start the next one. Run with `reef run --steps 40 --ceiling 80 --standalone`;
the default 12-step budget cuts a section mid-investigation with nothing changed.

Repo: `C:\Users\USER\Documents\reef`. Work in `code/packages/core` unless stated.
Build and test commands are in `memory.md`.

---

## Pair 1A — Restart recovery in `reef run --standalone`

**Problem.** A killed `reef run` leaves a durable claim (`session_v2.time_suspended`) but the
next standalone boot never sweeps it. `resume_attempts` stays 0 and no restart notice is
written. The service layer works: `test/session-execution.test.ts` passes 36/36.

**Known diagnosis.** `packages/server/src/process.ts` around line 110 calls
`installRestartContinuity` only when a `lifecycle` is present. `reef run --standalone` spawns
`reef serve --stdio`, and `packages/cli/src/server-process.ts` passes a lifecycle only for
service mode. Start from that line. Do not rediscover it.

**Relevant code.**

- `packages/core/src/session/execution/restart.ts` — `resumeSuspendedSessions`
- `packages/server/src/fetch.ts` line ~47 — the sweep on the fetch handler
- `packages/server/src/process.ts` line ~246 — the managed-server sweep
- Find the boot path used by `reef run --standalone` and make it call the sweep once,
  after the session services are built, forked so it does not delay startup.

**Acceptance.**

1. Start a real run in a disposable directory, kill the process tree mid-step.
2. Confirm the claim survived: `session_v2.time_suspended` is not null.
3. Boot another standalone run. Confirm `resume_attempts` increased, a synthetic
   "server restarted" message exists, and the session gained assistant messages.
4. No duplicate user message and no duplicate assistant step at the resume point.
5. Prove it is safe when nothing is suspended: boot with no claims, no notices, no errors.

Helper scripts live in `C:\Users\USER\AppData\Local\Temp\duel` (`resumecheck.ts`). Do not
commit them.

---

## Pair 1B — Green suite

**Runner.** `bun test test/session-runner.test.ts` from `code/packages/core` currently gives
239 pass, 4 fail:

1. drops tool output in serialized compaction history before omitting exchanges
2. interrupts runner continuation on a decline after settling an ordinary tool error
3. caps output token limit continuations and resets for new input (hosted)
4. caps output token limit continuations and resets for new input (unfinished)

For each: decide whether the test or the runner is wrong, write it down in the commit body,
and fix the side that is wrong.

**Read tool.** `test/tool-read.test.ts` has 28 failures because the suite calls `read` as a
direct tool while Code Mode now keeps it in the catalog. Fix the test plumbing in
`test/lib/tool.ts` so catalog tools execute through the `execute` tool, and update the one
definitions expectation. Do not change production behavior just to satisfy the test.

**Acceptance.** `bun typecheck` clean. Runner suite 243/243. Read suite green. Tool,
codemode, compaction and execution suites unchanged or better. Paste the counts.

---

## Pair 2A — `/review`

Add a read-only review workflow over the working diff.

- A review agent that cannot edit: read-only tool set, its own prompt, concise report.
- `/review` command (or a TUI command) that gathers `git diff` against the session start
  and asks for breaking changes, missing tests, and dead code, each with file and line.
- No writes, no commits, no auto-fix.
- If the tree is clean, say so in one line.

**Acceptance.** Run it on a deliberately broken change; the report names the real problem
and does not invent one. Run it on a clean tree; it returns the one-line clean answer.

---

## Pair 2B — Checkpoint picker

The revert API already stages, clears, and commits snapshots (`session/revert.ts`).

- Expose choosing a restore point from the session, not just the latest `/undo`.
- Show each checkpoint with time, step, and a one-line summary.
- Restoring must not delete newer checkpoints; it moves the session to that point.
- Keyboard: pick, confirm, cancel.

**Acceptance.** Make three checkpoints, restore the middle one, verify the file tree and the
transcript both match that point, then move forward again.

---

## Rules

- Two pairs, in order. Stop and report after Pair 1 and after Pair 2.
- Run the acceptance checks yourself. Do not report "done" from reading code.
- Do not touch the prompt, budgets, compaction policy, or Code Mode unless a test forces it.
- Every commit gets a conventional message: `feat(scope):`, `fix(scope):`, `test(scope):`.
- Report per pair: what changed, commands run, pass/fail counts, wall-clock time, anything
  you could not prove.
