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
- [ ] Version string still prints `opencode vlocal` · presentation work is phase 6 · find
  the CLI framework's name constant (or set it at build time) and print `reef`
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
  step open · add a per-event idle timeout at the transport boundary, not an overall step
  timeout, which would kill long tool calls
- [ ] Phase 3 control sweep not run · zero false stops is unproven and the rig controls are
  still the unverified rewrite · 10 paid control sessions when approved
- [ ] Phase 3 nudge path has no live run · the model would not repeat a call on request ·
  unit-covered only · induce it through a scripted provider in a later measurement
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
