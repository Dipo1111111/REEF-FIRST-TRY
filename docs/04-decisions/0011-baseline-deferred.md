# 0011 — Baseline deferred

Status: accepted · 2026-10-31

## Context

Phase 0 ends with a three-run baseline over the full rig: 22 tasks times three
runs, 66 model sessions. At the token prices of the models worth measuring, that
is a real bill for a number we already know the shape of from the prefix
measurement.

Two smaller facts sit next to it. The rig has no provider credential of its own:
the OpenCode Go credential belongs to the running OpenCode service, so a copied
database authenticates nothing. And the owner asked for the baseline to be the
last thing we do, not the first.

## Decision

Phase 0 closes on slices 0.1 to 0.4: the frozen fork, the identity rename, the
rig with 22 tasks verified to fail on untouched fixtures, and the first-request
measurement. Slice 0.5, the three-run baseline, is deferred until a provider key
is configured and a budget is set.

Phase 1 (instrumentation and the cache monitor) starts without it. The monitor
is structural: it is verified against the mock provider and against real event
streams, not against a baseline number.

No phase that needs a baseline may close until the baseline exists. That means
phase 2's "tokens per passed task not worse" bar and phase 5's target are both
pending, and their comparisons run against the first baseline taken once a key is
available, not against a number from this phase.

## Consequences

- The work that can be verified without spending money lands now.
- The rig grows a small change: `--runs` already exists, so the deferred job is
  one command when the key arrives.
- Phase 0 is recorded as closed-with-deferral rather than complete. The phase
  table says so, and this ADR is the reason.
- If the first real baseline later shows the fork is already cheap, the thesis
  weakens and phase 2 gets reordered. That risk is accepted, not hidden.
