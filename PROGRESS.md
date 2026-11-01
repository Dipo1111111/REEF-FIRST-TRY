# Reef overnight build tracker

Started: 2026-11-01. Owner: overnight agent. User asleep; no blocking on questions.

## Ground rules
- One task at a time, in order. No subagents.
- Verify each item before ticking it: typecheck, a rendered frame, or a real run.
- If something needs the user, mark it `BLOCKED` and keep going.

## Tasks

| # | Task | State | Evidence |
|---|---|---|---|
| 1 | Auto-compaction at ~300k tokens | DONE | `~/.config/opencode/opencode.jsonc` has `compaction.auto` with a 25% buffer; JSON validated after a botched first edit |
| 2 | Progress tracker | DONE | this file |
| 3 | Branding: no user-visible OpenCode | DONE for the TUI and CLI | terminal title, update dialog, config copy, terminal-pane error, sidebar tip, usage sign-in line now say Reef; `reef --help` reads "Reef command line interface" |
| 4 | REEF wordmark | DONE | 5-row pixel letters, doubled strokes, coral gradient per letter, rendered at 120x40 and 80x24 |
| 5 | Home screen | DONE | rounded welcome panel, 80% width, centred, welcome line and slash hints |
| 6 | Composer | DONE | rounded frame, transparent body, path + shortcut row inside, context/cost row outside and right-aligned |
| 7 | Session view | PARTIAL | right sidebar removed, prompt narrowed to the same 80% measure; transcript chrome still upstream |
| 8 | UX copy | PARTIAL | home, composer placeholder, dev bar, shortcuts and branding rewritten; slash descriptions untouched |
| 9 | Packaging | DONE to publish | build, pack, clean-project install, `reef v0.1.0`, packaged TUI renders the new home (pty check) |
| 10 | Feature research | PARTIAL | prior research in `docs/research-droid.md`; no new tools shipped this pass |
| 11 | Final visual verification | DONE | 120x40, 80x24 captures; packaged binary in a real pty |
| 12 | Final report | DONE | delivered in chat |

## Decisions log
- Internal identifiers (`@opencode/*` packages, config dir, protocol IDs) stay. Renaming breaks the dependency graph and the user's credential store. All user-visible copy says Reef.
- Publishing to npm is blocked without the user's account. Everything up to `npm publish` is prepared and verified.
- Design language: rounded frames, coral accent, hairline structure, pixel wordmark, 80% measure, transparent composer. No left rail, no floating card, no dev bar.
- The wordmark drops a cast shadow: at terminal cell density any offset shadow floods the letter counters and destroys legibility. A per-letter coral gradient carries depth instead.

## Blocked / needs the user
- npm publish for `reefcode` and `reefcode-windows-x64` (account credentials).
- Session transcript chrome (message roles, tool rows, headers) still carries upstream structure; a redesign needs a session fixture to iterate against without paid runs.
- Feature work: chat features Droid and Claude Code have that Reef does not.

## Log
- Config repaired after a bad bulk edit; JSON re-validated.
- Build 0.1.0 (00:51 and 01:00), pack, and clean install all pass.
- Packaged binary boots to the new home in a pty: welcome text and the `Reef 0.1.0` line confirmed in the frame stream.
- Welcome panel now carries version and model (`Reef 0.1.0 · <model>`).
- Commits: 87dc3fc (home and composer rebuild), 5bcda12 (frames untracked), 18f5173 (version line).
