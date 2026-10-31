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
- [ ] Baseline not taken (ADR 0011) · 66 model sessions cost real money and the rig has no
  credential of its own · configure a provider key and run the one command in phase 0.5
- [ ] Cache monitor does not exist · nothing to diff requests with yet · phase 1
