# Debt log

One line per deferred item. Append, don't rewrite. Strike through when resolved.

```
- [ ] what is wrong · why deferred · what would let us fix it
```

If this file grows without shrinking, the slices are too big.

---

- [ ] Fork tree at `C:\Users\USER\Documents\opencode-dev` has no `.git`, so there is no
  upstream commit to cite · the tree was delivered without history · get the source repo
  or record the archive hash in phase 0.1
- [ ] Charter (00) and contract (01) still describe the pre-recon plan · owner-only files ·
  apply ADR 0009, which carries the replacement text verbatim
- [ ] Rig fixtures are extracted copies of the fork's modules, not the monorepo itself ·
  copying 141 MB per run is not a rig · swap in real package tests at a phase boundary
  with an ADR that says why the swap does not change the bar
- [ ] Version string still prints `opencode vlocal` · ~~resolved by packaging: the build sets
  `OPENCODE_CLI_NAME` to `reef` and takes a real version from `OPENCODE_VERSION`~~
- [ ] Local database file is still named `opencode-local.db` · internal, not user-facing ·
  rename with the phase 6 polish, or when a migration for the data dir is written
- [ ] `OPENCODE_*` environment variables are still read · an env rename touches start-up
  and every test that sets them · phase 6, alongside the rest of the identity finish
- [ ] Baseline not taken (ADR 0011) · the 2026-10-31 attempt cost 2.36M tokens and was
  invalid: five controls were solvable because their answers sat in the test files · the
  rig now restores tests and records `testsModified`, and the five controls were rewritten
  as contradictions, but none of that has been re-run · re-run only with owner approval
- [ ] Rig `testsModified` guard and rewritten controls are unverified · the baseline was
  cancelled before a check run · dry-run the controls, then run 10 control sessions
- [ ] Cache monitor and meter are enabled by environment variable, not config · phase 1
  needed the gate, not a config migration · add `experimental.cache_monitor` and
  `experimental.meter` before phase 5
- [ ] Monitor state is per process · a continued session in a new CLI process starts a new
  sequence, so cross-process breaks are not attributed · acceptable while the long sessions
  that matter are single runs; persist the last snapshot if phase 4 needs it
- [ ] Meter records completed steps only · title and other internal calls do not publish
  `Step.Ended` and are absent from the stream too · provider-level accounting is the only
  fix; note the gap in any cost figure
- [ ] Phase 2 paid gate not measured · the owner cancelled the previous paid run · run 12
  real tasks twice on `phase-1-ok` and twice on the new build when approved, about 24
  sessions, or compare at phase 5
- [ ] Resident cap overflow path is untested · no plugin currently marks a fourth direct
  tool · add a registry-level test with a synthetic direct tool when the tool layer gets
  a test harness
- [ ] Stream silence has no timeout · a provider that sends headers then nothing keeps a
  step open · ~~resolved in phase 3: `stall.ts` adds a per-pull timeout, two attempts, then
  a `provider.timeout` failure~~
- [ ] Phase 2 paid gate is measured but ambiguous · A/B: median −30.5%, mean −3.7%, 11/12
  against 12/12 · fix the `rename-refactor` prompt, then re-score that task · the mean is
  dragged by two outliers on one task (125k fail, 287k pass) against a 25k-45k normal
- [ ] Rig counts `toolCalls` as 0 on every run, both builds · the runner watches
  `event.type === "tool"`, which the JSON stream never emits · count tool parts from
  `step_finish` or the session db, then re-check the code-mode vs direct tool split
- [ ] `rename-refactor` prompt is contradictory: "rename across every file" and "keep all
  exports working" · the model kept `OldRun` as an alias, `accept.sh` forbids it · say the
  old name must be gone, with no alias
- [ ] Step-count outliers on small tasks: 14 and 18 model calls against a median of 6, no
  identical calls to catch · phase 5 candidate: a soft nudge at 12 steps and a hard stop at
  20, or a no-file-change rule
- [ ] Code-mode exploration tax: one run spent six steps testing `write`/`edit` in temp
  directories before touching the repo · a short call example in the catalog may cut it ·
  measure in phase 5 before adding tokens
- [ ] Phase 3 control sweep not run · zero false stops is unproven and the rig controls are
  still the unverified rewrite · 10 paid control sessions when approved
- [ ] Phase 3 nudge path has no live run · the model would not repeat a call on request ·
  unit-covered only · induce it through a scripted provider in a later measurement
- [ ] Phase 4 long-session gate not measured · cache ratio at 95% and pass rate need a paid
  long session · same measurement batch as phases 2 and 3
- [ ] Compaction ledger is wired but only unit-tested · no live compaction has been logged ·
  force one with a manual compaction in the measurement run
- [ ] Two core config tests fail when the temp dir sits under the user profile, because
  discovery walks parents and finds the real `~/.claude` and `~/.agents` · the tests use
  `os.tmpdir()`, which is under the profile on Windows · run them with a temp root outside
  the profile, or make the test helper pick a neutral root
- [ ] `reef auth list` fails under the rig's seeded data dir ("Location plugins did not
  finish activating") while `reef run` works there · the rig db was copied whole from the
  real store, carrying location state · create a fresh rig db and insert only the
  credential row
- [ ] OpenCode Go reports `cost: 0` on `step_finish` · the provider does not return a
  price · treat cost as unknown for that provider and compare on tokens, or price the
  run from published rates
- [ ] The real environment sent 12 tool definitions where the rig sent 13 · unexplained
  capability filtering · work it out before phase 2 sets the two-tool target
- [ ] Cache monitor does not exist · nothing to diff requests with yet · phase 1

- [ ] `reefcode` 0.1.0 is built and packed locally but not published � needs an npm account and a release job � publish, host the archives, then rewrite docs/install.md from intended to real
- [ ] Frontmatter identity is only partly done: binary, package, config and data dir say reef, environment variables still say `OPENCODE_*` � the env rename touches startup and every test that sets them � do it as one change with a single accessor, not 33 inline reads
