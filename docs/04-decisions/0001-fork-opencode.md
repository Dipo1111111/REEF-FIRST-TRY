# 0001 — Fork OpenCode instead of building from scratch

2026-10-31 · Status: accepted

## Context

We need a harness: a loop, a tool layer, a provider layer, sessions, permissions,
MCP, an editor surface. OpenCode already has all of it, open source, in a
client/server structure that makes the loop replaceable.

Building from zero would cost months before the first measurement, and the parts we
would rebuild (provider plumbing, session persistence, permission model) are the parts
that are tedious and already correct.

## Decision

Fork OpenCode. Replace its session loop, request builder, and tool presentation.
Keep everything else.

We are not a downstream patch set. The fork diverges and stays diverged.

## Consequences

- Upstream improvements are not free; we will fall behind unless we cherry-pick.
- We inherit its provider abstraction, which may fight us on raw content blocks and
  cache breakpoints. Flagged as an open question in the architecture doc.
- Our diff stays small enough to reason about: three subsystems, not a rewrite.
- Reverting to stock OpenCode is always possible, which makes every phase cheap to
  abandon.
