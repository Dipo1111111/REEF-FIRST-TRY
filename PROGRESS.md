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
| 7 | Session view | PARTIAL | sidebar removed, prompt at the same 80% measure, session title row added, tool blocks flattened, shell output collapses to 4 lines; transcript typography still upstream |
| 8 | UX copy | PARTIAL | home, composer placeholder, dev bar, shortcuts and branding rewritten; slash descriptions untouched |
| 9 | Packaging | WINDOWS DONE, MAC BLOCKED | 0.1.0 rebuilt 06:22 and reinstalled clean; mac cross-build needs darwin native packages that the registry install here hangs on; CI workflow prepared |
| 10 | Feature research | PARTIAL | prior research in `docs/research-droid.md`; no new tools shipped this pass |
| 11 | Final visual verification | DONE | 120x40, 80x24 captures; packaged binary in a real pty |
| 12 | Final report | DONE | delivered in chat |

## Decisions log
- Internal identifiers (`@opencode/*` packages, config dir, protocol IDs) stay. Renaming breaks the dependency graph and the user's credential store. All user-visible copy says Reef.
- Publishing to npm is blocked without the user's account. Everything up to `npm publish` is prepared and verified.
- Design language: rounded frames, coral accent, hairline structure, pixel wordmark, 80% measure, transparent composer. No left rail, no floating card, no dev bar.
- The wordmark drops a cast shadow: at terminal cell density any offset shadow floods the letter counters and destroys legibility. A per-letter coral gradient carries depth instead.

## Blocked / needs the user
- npm publish: the registry returns 403 without a 2FA proof. Need either a granular token with Bypass 2FA in `%USERPROFILE%\.npmrc`, or `bin\publish.cmd <otp>` with a live code.
- macOS binaries: need a macOS runner. Cross-compiling on Windows is blocked by darwin native packages (registry install hangs). `.github/workflows/release.yml` builds all three targets.
- Session transcript typography (assistant spacing and measure) still needs a visual pass.

## Log
- Config repaired after a bad bulk edit; JSON re-validated.
- Build 0.1.0 (00:51 and 01:00), pack, and clean install all pass.
- Packaged binary boots to the new home in a pty: welcome text and the `Reef 0.1.0` line confirmed in the frame stream.
- Welcome panel now carries version and model (`Reef 0.1.0 · <model>`).
- Commits: 87dc3fc (home and composer rebuild), 5bcda12 (frames untracked), 18f5173 (version line).
