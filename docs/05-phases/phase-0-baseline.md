# Phase 0 — Baseline

State: closed with deferral (ADR 0011) · Gate: rig verified + first request measured

## Goal

Produce an honest starting number on the fork as it stands, and freeze the thing we are
measuring.

No behaviour changes in this phase. The one edit allowed is the identity rename in 0.2,
which changes what things are called and nothing about what they do.

Reconnaissance is already done and written down: `docs/research-code.md`. It moved the
project's assumptions more than a week of building would have.

## Slices

### 0.1 Freeze the fork — done

- Fork copied into `code/` under the plan repo, one base commit `defcc61`, tag
  `phase-0-base`.
- `bun install --frozen-lockfile` completed: 1,777 packages. The only failure is the
  `husky` postinstall, which wants a `.git` at `code/` rather than one level up. Harmless.
- Headless run confirmed: `run --standalone --format json` emits NDJSON, starts its own
  server, and each `step_finish` carries `cost` and `tokens.cache.read/write`.

**Accept:** met. `git log --oneline -1` shows the base commit and a run emits metered JSON.

### 0.2 Identity — done

- Command `reef` through `bin/reef.cmd` and `bin/reef` (dev entry points; a packaged
  release uses the npm `bin` key added to `packages/cli/package.json`).
- Config discovery reads `reef.json` / `reef.jsonc` and still reads `opencode.json` /
  `opencode.jsonc` for one release, with Reef's names winning when both exist.
- Data, config, cache and state resolve under `reef`, verified with `debug paths`.
- Internal `@opencode/*` package names unchanged.

**Accept:** met, with one cosmetic exception. The version string still prints
`opencode vlocal`; it lives in the CLI framework, not in an obvious constant, and is
deferred to phase 6 with the rest of the presentation work.

### 0.3 Rig — done

- `rig/runner.ts`: setup, harness run, acceptance, token and cost accounting, dry mode,
  and a hermetic environment. Run directories live outside the user profile, because
  config discovery walks every parent and would otherwise ingest the user's skills.
- `rig/scaffold.ts`: regenerates the task set. Three fixtures, 12 real tasks, 10 controls.
- Every acceptance was run against an untouched fixture: 0 of 12 real and 0 of 10 control
  accepts pass, recorded in `rig/results/accepts-v0.json`.
- Two accepts were checked to flip to passing after the intended fix, so they test the
  bug and not the plumbing.

**Accept:** met except one deliberate deviation. Fixtures are small extractions of the
fork's own modules rather than the full monorepo, because copying 141 MB per run is not a
rig. The debt log records this.

### 0.4 Prefix — done

Measured with `rig/mock/server.ts` and `rig/measure-prefix.ts`. Full readout:
`docs/05-phases/phase-0-readout.md`.

| Component | Bytes | Est. tokens |
|---|---|---|
| System | 8,653 | 2,163 |
| Tools (13) | 15,517 | 3,879 |
| User message | 35 | 9 |
| Total | 24,205 | 6,051 |

Tool definitions are 64 percent of the first request. The earlier leading assumption that
a session sends about 15 tools was close but wrong; it sends 13.

### 0.5 Baseline — deferred (ADR 0011)

66 model sessions cost real money, and the rig has no credential of its own: the
OpenCode Go credential belongs to the running service, so a copied database authenticates
nothing. The owner directed that this run last.

When a provider key exists:

```
bun rig/runner.ts --model <provider>/<model> --runs 3 --out rig/results/baseline-<model>.json
```

## Gate

Slices 0.1 to 0.4 are accepted. Slice 0.5 is deferred by ADR 0011, so the phase is
recorded as closed-with-deferral, not complete. Consequences:

- Tag `phase-0-base` stays the reference point; no `phase-0-ok` tag until the baseline
  exists.
- The rig is frozen as v1 from here.
- Phase 1 starts now. Its gate does not depend on a baseline.
- Phase 2's "tokens per passed task not worse" bar and phase 5's target stay pending
  until the first real baseline is taken.

## What would make us reconsider

If the first real baseline shows the fork is already at or near the efficiency ceiling on
our task set, the remaining thesis is weak and we stop and talk before building anything
else.

If tool definitions turn out to be a small share of later requests once history grows,
phase 2 loses most of its point. The readout says they are 64 percent of the first
request, which is a real but bounded win, so this stays a live risk.
