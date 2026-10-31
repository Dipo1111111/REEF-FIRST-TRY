# 0004 — Anchoring is the default, compaction the exception

2026-10-31 · Status: accepted

## Context

The charter targets 95%+ prompt cache retention. Compaction and caching are in direct
conflict: compaction rewrites history, and a rewritten prefix invalidates the cache
from the first changed token onward.

Droid reports 98% per-request reuse and 91.5% token-weighted, which means their
compaction is rare and deliberate, not a background process.

## Decision

History is append-only. Compaction happens only:

1. when the context limit is actually approached, not on a token-count schedule;
2. at a declared boundary (a task completes, a tool batch ends);
3. with its cost recorded: tokens saved minus cache invalidated.

## Consequences

- Long sessions cost more per turn than an aggressively compacting harness, but far
  less than one that loses its cache every few turns.
- We need a compaction trigger that is a real limit, not a heuristic.
- Compaction quality becomes a second-order problem we can defer.
- If a provider offers no caching at all, this decision is neutral rather than
  harmful, which is a good property for a default.
