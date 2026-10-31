# 0003 — Rig before features

2026-10-31 · Status: accepted

## Context

The standard failure: build the exciting feature (PTC), then discover it made things
worse on half the tasks, with no baseline to compare against and no way to attribute
the regression.

Factory's advantage is not that they had the idea. It is that they have a continuous
measurement loop that tells them whether an idea worked, per model.

We cannot clone their loop on day one. We can clone its prerequisite.

## Decision

No optimization lands before the rig exists and stock OpenCode is measured on it.
Phase 0 is rig plus baseline. Nothing else happens in Phase 0.

## Consequences

- Roughly 2-3 days of work before anything interesting happens. Accepted.
- Every later argument becomes decidable: we compare numbers, not impressions.
- The rig becomes the thing we maintain most carefully, because everything depends on
  it being honest.
- Risk: the rig is built by the same person being measured. Mitigated by the control
  set and by freezing it per phase.
