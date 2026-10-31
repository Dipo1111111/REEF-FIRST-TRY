# Reef

An open agent harness built for one thing: more work per token, faster.

- Binary: `reef`
- Package: `reefcode` (npm `reef` is taken by a dead 0.0.1 package)
- Repo: `reefcode/reef`
- Status: pre-code. Research and plan done, rig not built yet.

## Start here

Read in this order. Do not skip 01.

| File | Purpose |
|---|---|
| [docs/00-charter.md](docs/00-charter.md) | What this is, what it is not, success criteria |
| [docs/01-contract.md](docs/01-contract.md) | Invariants. Read at the start of every session |
| [docs/research-droid.md](docs/research-droid.md) | What Droid 1.0 actually does, from Factory's own post |
| [docs/research-code.md](docs/research-code.md) | What our fork already ships, file by file |
| [docs/02-architecture.md](docs/02-architecture.md) | Target state and the four changes we make |
| [docs/03-rig.md](docs/03-rig.md) | Measurement: task set, metrics, pass bars |
| [docs/04-decisions/](docs/04-decisions/) | ADRs. Append-only |
| [docs/05-phases/](docs/05-phases/) | One file per phase, written when the phase starts |

Two facts from the research shape everything else:

- The fork already ships the append-only loop, cache breakpoints, and a sandboxed code
  mode. Reef is a delta, not a rewrite (ADR 0006).
- A default session still sends about 15 tool definitions up front. Droid sends two. That
  is the biggest untested gap we have.

## The rule that makes this work

Every document must produce a command. If a section cannot be reduced to something
that exits 0 or fails, it is a wish and it gets cut.

## Status board

| Phase | State |
|---|---|
| 0 Baseline | closed with deferral: rig verified, first request measured, 3-run baseline deferred (ADR 0011) |
| 1 Instrumentation + cache monitor | not started |
| 2 Resident tool surface | not started |
| 3 Bounded loop | not started |
| 4 Anchoring | not started |
| 5 Tuning and finish | not started |
| 6 Polish (post-v1) | deferred — TUI restyle, brand strings, theme |

## Known contradictions

The charter (00) and contract (01) still describe the pre-recon plan: rebuild the loop and
the script tool, one model family at a time. ADR 0009 carries the exact replacement text.
Only the owner applies it. Until then, the phase table and ADR 0006/0007/0008 win.
