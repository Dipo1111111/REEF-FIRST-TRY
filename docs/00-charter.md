# Reef — Charter

Status: draft 1 · Last reviewed: 2026-10-31 · Changes require an ADR

## One line

Reef is an open agent harness built for one thing: more work per token, faster.

## Thesis

The model is not the lever. The harness is. Two harnesses running the same model on
the same task can differ by 30% in tokens and 25% in wall clock, because the harness
decides how much history is re-sent, how many round trips a task takes, what the model
sees at each step, and when the loop stops.

Factory published enough of Droid 1.0's design for us to know the mechanism. Our job is
not to invent it. Our job is to build it carefully, on a codebase that already works,
and to prove every step with a number.

## What we are building

A fork of OpenCode that replaces its agent loop and request builder. Everything else
that OpenCode already does well, we keep.

Four layers, in build order:

1. **Request discipline.** Append-only requests, byte-stable prefix, tool discovery
   appended rather than spliced, a monitor that names the token that broke the cache.
2. **Script tool (PTC).** The model writes a program; the program calls our tools
   through a bridge; the sandbox has no ambient authority. Many tool calls, one turn.
3. **Bounded loop.** Deterministic stop rules: no-output turns, identical calls,
   stream silence, retry limits, token and wall-clock budgets.
4. **Anchoring, then minimal compaction.** Keep the prefix stable by default.
   Compact rarely, deliberately, at a boundary.

## Non-goals for v1

Explicitly out of scope. Adding any of these requires an ADR.

- Interactive TUI work beyond what the fork already ships
- Desktop app, web app, mobile app
- Missions, cloud computers, remote execution
- Plugin marketplace, custom agent markdown files
- Multi-agent orchestration beyond a single subagent primitive
- Model routing and auto-selection
- Enterprise controls: SSO, ZDR, audit, data residency
- Homebrew, Docker, and installer polish (one install path is enough)

The reason is not laziness. Surface area is where scope dies. A headless harness can be
measured cleanly. A pretty one cannot, because every screenshot feels like progress.

## Success criteria

Measured against stock OpenCode on a frozen rig, same model, same tasks.

| Phase | Bar |
|---|---|
| 0 | Baseline recorded and reproducible from a clean clone |
| 1 | Our instrumentation matches baseline within 2% |
| 2 | Token-weighted cache reuse at or above baseline + 10 points, pass rate held |
| 3 | Model calls per task down 25% on script-eligible tasks, pass rate held |
| 4 | Zero runs hit the hard cap; no false stops on the control set |
| 5 | Cache reuse at or above 95% token-weighted on long sessions, accuracy held |

**v1 ships when:** tokens per passed task are at least 25% below the stock OpenCode
baseline, wall clock per passed task is at least 15% below, and pass rate is not lower.

If we hit those three, the project is a success even if it has no UI, no cloud, and no
marketplace.

## Constraints

- One model family targeted at a time. Tuning does not transfer between families.
- The rig is the only source of truth for progress claims.
- Every phase must be revertible to a clean state.
- No new runtime dependencies without explicit approval.
- Nothing derived from Factory's proprietary prompt text or assets. Public design
  principles are fair game; their exact wording is not.

## Working agreement

You own the gates. I own the code.

You provide, per slice: the goal, the file allowlist, the acceptance command, and the
pass bar. I provide the change, the measurement, and the write-up. If a gate is missing
I stop and ask rather than inventing one.
