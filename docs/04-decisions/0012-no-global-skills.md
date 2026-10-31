# 0012 — No global skill ingestion

Status: accepted · 2026-10-31

## Context

The fork reads skill folders from other tools' homes: `~/.claude/skills` and
`~/.agents/skills`, then injects every skill's id, name and description into the
system prompt on every step.

On this machine that is 1,377 skills. Measured: 397,788 characters of system
text, about 99,000 tokens, on every request. The same run with an empty home
sends 8,652 characters.

That is not a fork default anyone chose for Reef. It is a compatibility feature
whose cost scales with how much unrelated tooling a developer has installed.

## Decision

Reef does not read the global `.claude` and `.agents` skill folders by default.

Project-local `.claude` and `.agents` directories still load, as do Reef's own
skills and anything listed under `skills` in the config. The upstream behaviour
is one environment variable away: `REEF_COMPAT_SKILLS=1`.

## Consequences

- A real request on this machine drops from about 99,000 system tokens to about
  2,100. That is larger than every other planned optimisation combined.
- The cut is a behaviour change, not a rename, so it is recorded here rather than
  hidden inside the identity work.
- Users who rely on a shared skill folder can set the variable, or point `skills`
  at the exact folder they want.
- The rig never saw this cost, because it runs with an isolated home. The change
  matters for real use, and it is now measured there.

## Method

The comparison used the mock provider, so it cost nothing:

1. Real home, normal config: 1,377 skills, 397,788 system characters.
2. Real home, after the change: 2 `<skill>` markers (the wrapper text), 8,652
   system characters, 12 tools, 22,700 bytes total.

The `authorization` header was present in both cases, so this is not an auth
difference.
