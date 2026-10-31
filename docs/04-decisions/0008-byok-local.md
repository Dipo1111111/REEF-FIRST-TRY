# 0008 — No keys, no payment, no telemetry; the user brings the model

2026-10-31 · Status: accepted

## Context

Reef is open source. It must not ship a key, bundle credits, or require a plan. It also
must not be tuned around one vendor, because the person running it supplies whatever
provider they have.

The earlier planning had an open question, "which model family first", which implied we
would pick and pay for one. That was wrong. There is no budget and no account.

## Decision

1. Reef never holds, ships, or proxies a credential. The user's own provider config is the
   only source of keys, and it stays on their machine.
2. Nothing phones home. No telemetry, no usage reporting, no phone-home check.
3. The rig is parameterised by model id and provider config. It records which model it
   ran, and it never assumes one.
4. Published comparison numbers (Droid's Terminal-Bench figures) are a reference point,
   not a target we buy a key to reproduce.
5. Where a provider gives no cache-read counts, the rig records that fact and reports the
   metric as unavailable. It never estimates a cache figure and calls it measured.

## Consequences

- Phase 0 runs on whatever provider the owner already has configured. No spend decision.
- Per-model tuning (phase 5) becomes: ship the tuning hooks, test them on the models the
  owner can run, and document which families they were tested on.
- The v1 bar (tokens −25%, wall clock −15%) is measured relative to our own baseline on
  the same model, which is the only comparison that is honest without paying for a
  benchmark.
- Cost per task is reported only when the provider's token counts allow it, and is marked
  as list-price arithmetic, not a bill.
