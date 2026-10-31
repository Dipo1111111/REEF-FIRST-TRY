# 0007 — Phase order after recon

2026-10-31 · Status: accepted · Supersedes the ordering in the phase table only

## Context

The original order was: request discipline, script tool, bounded loop, anchoring.

After recon (ADR 0006), request discipline and the script tool are already shipped. What is
left is measurement, a smaller tool surface, stop rules, and anchoring. The order of
those four is a real decision, because each one changes the numbers the next one is
measured against.

## Decision

0. Baseline and prefix measurement.
1. Instrumentation and the cache monitor.
2. Resident tool surface.
3. Bounded loop.
4. Anchoring.
5. Per-model tuning and the v1 bar.

## Consequences

- The monitor ships before anything that can break the cache, so every later change has an
  attribution tool on day one.
- Tool surface goes before stop rules because it is the change most likely to move tokens
  per task, and the most likely to silently break the prefix.
- Stop rules go before anchoring so a long session cannot burn its budget inside a stuck
  loop while compaction is being debugged.
- Tuning is last because it depends on a stable harness and a chosen model family. Tuning
  a moving target measures noise.
- If phase 0 shows tool definitions are a small share of the request, phase 2 is cut and
  the order collapses to 0, 1, 3, 4, 5. That is allowed and expected.

## Contract amendment (needs the owner's hand)

`docs/01-contract.md` 1.4 still reads "request discipline, script tool, bounded loop,
anchoring". That no longer matches reality. Proposed replacement, to be applied by the
owner, not by an agent:

> 1.4 Work proceeds in the order set by the current phase table. The order changes only by
> ADR at a phase boundary.
