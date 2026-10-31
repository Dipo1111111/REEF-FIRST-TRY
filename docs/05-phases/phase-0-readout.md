# Phase 0 readout: the first request

Measured on 2026-10-31 against the frozen fork (`phase-0-base`), with the mock
provider in `rig/mock/server.ts` so no tokens were spent and no provider key was
needed.

Method: one headless run, `reef run --standalone --format json`, in an empty
project directory outside the user profile, with an isolated home and XDG roots.
The mock logged the exact request body and `rig/measure-prefix.ts` counted it.
Token estimates are bytes / 4, consistent across phases.

## Numbers

| Component | Bytes | Est. tokens |
|---|---|---|
| System prompt | 8,653 | 2,163 |
| Tool definitions | 15,517 | 3,879 |
| User message | 35 | 9 |
| **Total** | **24,205** | **6,051** |

Tool count: 13.

Largest definitions: `subagent` 2,727 B, `experimental_image_generate` 1,922 B,
`edit` 1,550 B, `shell` 1,537 B, `question` 1,459 B, `execute` 1,215 B.

## What this changes

Tool definitions are 64 percent of the first request, so the resident-surface
change (phase 2) is worth roughly 12 KB, or about 3,000 tokens, on every step
before history grows. That is smaller than the Droid comparison suggested,
because the fork's system prompt is lean: 8.6 KB, not 20 KB.

It also kills one assumption: a default session sends 13 tools, not 15. The
difference is not worth chasing.

## Two traps found while measuring

A run started under the user's own home is not a default run. Config discovery
walks every parent of the project, so a temp directory under
`C:\Users\<name>\AppData` picks up that user's `.agents` and `.claude` skill
folders. The first measurement read 397,788 system characters because of it,
almost all of it 1,377 installed skills. Run directories now live outside the
profile by default (`C:\reef-rig`), and the runner sets its own home, config,
data, cache and state.

The second trap is credentials. `opencode-go` lives inside the running OpenCode
service, not in `opencode.db`. Copying the database into an isolated data
directory yields "No authenticated integrations", so the rig needs its own
provider key for real runs. That is why the baseline is deferred.
