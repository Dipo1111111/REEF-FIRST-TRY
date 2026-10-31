# 0002 — v1 is headless only

2026-10-31 · Status: accepted

## Context

The interesting work is the loop. The TUI, desktop app, web client, and marketplace are
surface. Every hour spent on surface is an hour not spent on the thing that makes this
project exist.

There is also a measurement argument: a headless harness produces clean numbers. An
interactive one produces screenshots, and screenshots feel like progress.

## Decision

v1 runs non-interactively only. No TUI work, no desktop, no web, no mobile. If the fork
ships a TUI we do not break it, but we do not improve it either.

## Consequences

- We can measure from week one.
- Day-to-day use is worse than a mature harness until v1 is done. This is accepted.
- The TUI may break as a side effect of the loop change. Acceptable; it is not a gate.
- Surface work becomes a v2 conversation with its own charter.
