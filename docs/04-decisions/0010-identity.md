# 0010 — User-facing identity is Reef; internal package names stay @opencode

2026-10-31 · Status: accepted

## Context

ADR 0005 fixed the name. Nothing in the plan implements it, and the fork currently presents
itself as OpenCode everywhere a user can see: the binary, the config file names, the data
directory, and the environment variables.

Checked in the tree:

- config discovery looks for `opencode.json` / `opencode.jsonc`
  (`packages/core/src/config/discovery.ts:12`)
- environment variables are `OPENCODE_*` (`packages/util/src/global.ts:17`, `:79`)
- packages are published as `@opencode/*`

Renaming the packages is a wide mechanical change: every import, every build reference,
every lockfile entry. It also makes pulling upstream fixes into the fork much harder,
because every file that touches a package name conflicts.

## Decision

1. **Keep `@opencode/*` as internal package names.** The fork stays mergeable.
2. **Rename the user-visible surface.** In a headless run, the only things a user sees are
   the command, the config file, the data directory, and the environment variables.
   Those become:

   | Surface | Before | After |
   |---|---|---|
   | command | `opencode run` | `reef run` |
   | npm package | `opencode-ai` | `reefcode` |
   | config | `opencode.json[c]` | `reef.json[c]` |
   | data dir | `…/opencode` | `…/reef` |
   | env | `OPENCODE_*` | `REEF_*` |
   | user agent | `opencode/…` | `reef/…` |

3. **Read the old config name as a fallback** for one release, so a migration is not a
   cliff.
4. **The TUI is not rebranded in v1.** It is out of scope (ADR 0002). If it is invoked it
   may still say OpenCode. That is accepted, not overlooked. Restyling is phase 6, after
   the v1 bar is met.

## Consequences

- No v1 user ever needs to type `opencode`, and no internal import churn.
- The rename is contained: one constant for config names, one for global paths, one for
  the environment prefix, one for the binary entry.
- Anyone reading `@opencode/ai` inside the repo sees the upstream name and understands why.
- A full `@reef/*` rename remains possible later, as its own phase, with its own cost
  written down first.
- Upstream merges stay practical, which is the main reason this ADR exists.
