# Reef — Contract

Read this at the start of every session before touching anything.
This file is read-only to me. Only you amend it, by ADR.

Purpose: this is the document that stops drift. Drift is not malice or incompetence.
It is the natural result of a capable agent with a big codebase and an open-ended goal.
These rules make drift visible and cheap to correct.

---

## 1. Scope invariants

1.1 v1 is headless. No TUI work, no desktop, no web, no mobile.

1.2 One model family at a time. Switching families invalidates the rig and requires
    re-baselining.

1.3 Work happens one slice at a time. A slice is the smallest unit that has an
    acceptance command.

1.4 The four layers are built in order: request discipline, script tool, bounded loop,
    anchoring. A later layer does not begin while an earlier gate is unmet.

1.5 Anything on the non-goals list in the charter requires an ADR to even discuss.

## 2. Code invariants

2.1 **File allowlist.** Every slice declares the files it may touch. Outside that
    list, I stop and ask. This is the single highest-value rule here.

2.2 No new runtime dependencies without explicit approval. Dev dependencies need a
    one-line justification.

2.3 No refactors that are not required by the slice. If I see something ugly that
    isn't in scope, I write it in the debt log and leave it alone.

2.4 Vendored upstream code, lockfiles, and this contract are read-only. I propose
    diffs; you apply them.

2.5 Every behavioral change ships with a test that fails before it and passes after.

2.6 No commented-out code, no dead branches, no "temporary" shims. If it's temporary,
    it goes in the debt log with a removal condition.

## 3. Measurement invariants

3.1 No optimization lands without a before and after number on the rig.

3.2 The rig is frozen within a phase. Tasks may be added or changed only at a phase
    boundary, and only with a version bump.

3.3 A change that improves tokens but lowers pass rate is a regression, not an
    optimization.

3.4 Cache reuse is always reported token-weighted, never request-weighted. Request-
    weighted numbers flatter you, because cheap requests are the majority.

3.5 Claims of speed use wall clock per passed task, excluding setup and grading.
    Time-to-first-token is tracked separately and reported separately.

3.6 No benchmark number is quoted without: rig version, model id, date, and whether
    it was a single run or a median of N.

## 4. Process invariants

4.1 One slice per session. A session never spans two slices. The written plan carries
    context; the transcript does not.

4.2 Done means a command exits 0. Not "it works." If a slice cannot be expressed as a
    command, it is too vague to start.

4.3 Every slice starts from a tagged commit and ends with a tag or a revert.

4.4 Every irreversible or non-obvious decision gets an ADR: what we chose, why, and
    what it rules out. Short is fine. Missing is not.

4.5 **Three-strike rule.** Three failed attempts at the same acceptance test and I
    stop, write what we know and what we tried, and wait. Thrashing is the expensive
    failure mode.

4.6 I do not edit the charter, the contract, the rig definition, or a past ADR. Those
    are yours.

## 5. Security invariants

5.1 The script sandbox has no filesystem, network, or process access. It reaches tools
    only through the bridge. This is not a setting; it is the design.

5.2 The bridge enforces the same permission model as direct tool calls. A script does
    not get privileges a single call would not get.

5.3 No secrets in logs, traces, or error messages. Keys are redacted at the logging
    boundary, not at the call site.

5.4 Nothing in Reef phones home. No telemetry by default, ever.

## 6. Stop conditions

I stop and ask, rather than proceeding, when any of these is true:

- The slice requires touching a file outside the allowlist.
- Two plausible designs exist and the choice changes the architecture.
- The acceptance command is missing, ambiguous, or cannot fail.
- A test passes but I cannot explain why.
- The rig shows a regression I cannot attribute.
- I have failed the same acceptance test three times.
- I am about to add a dependency.
- I am about to change the request prefix in a way that could break caching.
- I notice I am doing work nobody asked for.

## 7. Debt log

Anything deferred, skipped, or hacked gets one line in `docs/debt.md`:

```
- [ ] what is wrong · why deferred · what would let us fix it
```

If the debt log grows without shrinking, that is a signal the slices are too big.

## 8. Amendment

The contract changes only by ADR, and only at a phase boundary. Mid-phase amendments
are how a contract becomes decoration.

---

## Quick check before any change

1. Is this in the current slice's allowlist?
2. Is there a command that proves it?
3. Is there a before number?
4. Does it touch the request prefix?
5. Would I be embarrassed to explain this line in the ADR?

If any answer is "no" or "I don't know," stop.
