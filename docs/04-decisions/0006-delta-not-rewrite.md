# 0006 — Reef is a delta on a fork that already ships code mode and cache markers

2026-10-31 · Status: accepted

## Context

The charter and draft-1 architecture were written before anyone read the source tree.
They describe replacing the loop, the request builder, and the tool presentation.

Reading the terminal path (`docs/research-code.md`) shows the fork already has:

- an append-only loop: `packages/ai/src/llm.ts:173`
- automatic cache breakpoints with a four-marker budget:
  `packages/ai/src/cache-policy.ts:17`
- a confined JavaScript code mode with a tool catalog, bridge, and limits:
  `packages/codemode/src/codemode.ts`
- tool output capped and spilled to files: `core/src/tool-output.ts:13`
- per-model prompt addenda: `core/src/plugin/optimize.ts`

"Build cache discipline" and "build the script tool" are therefore already done. Planning
them again would be duplicate work, and building them again would fork behaviour we would
then have to maintain.

## Decision

Reef is a delta, not a rewrite. The four changes are:

1. a cache monitor that names the part that broke the prefix,
2. a smaller resident tool surface,
3. stop rules in the loop,
4. anchoring as the default instead of automatic compaction.

Everything else in the fork is kept as-is unless the rig says otherwise.

## Consequences

- The old phase 2 (request discipline) and phase 3 (script tool) are dropped as build
  phases. Their intent survives as phase 2 (resident tool surface) and as verification.
- The charter's line "replaces its agent loop and request builder" is too strong. It stays
  as written because the charter is not mine to edit, but this ADR is the accurate reading.
- The rig becomes the only way to justify touching shipped code.
- Risk: we inherit upstream decisions we did not make. The monitor and the rig are how we
  find out which ones hurt.
