# 0009 — Amendments to the charter and contract for the delta plan

2026-10-31 · Status: proposed (owner applies)

## Context

Two owner-only documents still describe the plan as it was before the code was read.
An executor reading top-down hits them first and will do the wrong work:

- `docs/00-charter.md:25` — "Four layers, in build order: request discipline, script tool,
  bounded loop, anchoring". Request discipline and the script tool already ship.
- `docs/00-charter.md:22` — "replaces its agent loop and request builder".
- `docs/00-charter.md:73` and `docs/01-contract.md:16` — "one model family at a time".
  ADR 0008 makes the harness model-agnostic and user-supplied.
- `docs/01-contract.md:22` — the same four-layer order.

ADR 0006 and 0007 correct the plan. These documents have not caught up, and I am not
allowed to edit them.

## Decision

Replace the following text, verbatim. Nothing else in either file changes.

**Charter, the "What we are building" opening paragraph** becomes:

> A fork of OpenCode. The loop, the request builder, and the sandbox already exist and
> match the design; we keep them and change four things: a cache monitor, a two-tool
> resident surface, stop rules in the loop, and anchoring as the default. Everything else
> that OpenCode already does well, we keep.

**Charter, the four layers list** becomes the four changes:

> 1. **Cache monitor.** Hash each part of every request, compare it with the previous one,
>    and name the part that broke the prefix.
> 2. **Resident tool surface.** Two tools up front, everything else reachable from a
>    program. Hard cap four.
> 3. **Bounded loop.** Deterministic stop rules: empty turns, identical calls, stream
>    silence, retry limits.
> 4. **Anchoring, then rare compaction.** Keep the prefix stable by default; compact on
>    provider overflow or on request, and record the cost.

**Charter constraint** "One model family targeted at a time" becomes:

> The harness is model-agnostic. The rig records which model and provider each run used,
> and no comparison crosses models.

**Contract 1.2** becomes:

> 1.2 The rig records model and provider per run. A comparison is only valid within one
>     model; across models, only the methodology carries over.

**Contract 1.4** becomes:

> 1.4 Work proceeds in the order set by the current phase table. The order changes only by
>     ADR at a phase boundary.

**Charter success criteria**, where it says "Measured against stock OpenCode on a frozen
rig", becomes:

> Measured against the unmodified fork on a frozen rig, same model, same tasks.

The phase 0 row in that table changes from "reproducible from a clean clone" to
"reproducible from the frozen fork". Both refer to the same thing; there is no clean clone
of a tree that arrived without git history.

**Charter v1 paragraph**, "at least 25% below the stock OpenCode baseline", becomes
"at least 25% below the unmodified fork's baseline".

## Consequences

- The charter and the ADRs stop contradicting each other, which is the one thing that
  would derail a fresh executor.
- Earlier ADRs 0001 and 0003 say "stock OpenCode". Read that as the unmodified fork. Past
  ADRs are not edited.
- No scope is added. These are corrections, not new goals.
- Until the owner applies them, the phase table and ADR 0006/0007 are the authoritative
  order, and `README.md` says so under "Known contradictions".
