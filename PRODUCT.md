# Product
<!-- impeccable:product-schema 1 -->
## Platform
web

## Stack
Plain static HTML, CSS, and vanilla JS in `site/`. No build step, no framework, no runtime dependencies. Chosen by the agent as the default for one marketing page; not confirmed by the owner.

## Users
Developers who run coding agents from a terminal and pay per token, either directly or through a metered plan. They evaluate a harness the way they evaluate a compiler: by what it sends, what it costs, and whether the run finishes. Secondary: engineers who want to read or fork the loop.

## Product Purpose
Reef is an open agent harness built for one thing: more work per token, faster. It exists because the model is not the lever, the harness is. Success is measured on a frozen rig: tokens per passed task 25% below stock OpenCode, wall clock 15% below, pass rate not lower.

## Positioning
Most harnesses compete on model choice and features. Reef competes on request discipline: an append-only, byte-stable prefix, a resident two-entry tool surface, a single sandboxed script that makes many tool calls in one turn, deterministic stop rules, and rare deliberate compaction. The claim is provable on a rig, not asserted on a feature list.

## Operating Context
Installed as one standalone binary named `reef` from the npm package `reefcode` (the npm name `reef` is taken by a dead package). Built on a fork of OpenCode, so existing OpenCode habits and config transfer. Bring your own model key; Reef talks to no service of the Reef project. Runs headless. The owner builds and tests on Windows, Node 20+ or Bun.

## Capabilities and Constraints
Built and tested: phases 0 through 4, meaning instrumentation with a cache monitor, the resident tool surface, the bounded loop, and anchoring. Phase 5 (tuning and packaging) is in progress. Nothing is published to npm; version 0.1.0 installs from local tarballs only. The platform tarball is about 96 MB. Docs are the product record and live in `docs/`; the charter is `docs/00-charter.md`, the invariants are `docs/01-contract.md`.

## Brand Commitments
Name: Reef. Lowercase wordmark. Binary `reef`, package `reefcode`, platform packages `reefcode-<os>-<arch>`. Voice: plain words, short sentences, the number before the adjective, no em dashes. The product refuses feature-list marketing; it argues from measurement.

## Evidence on Hand
Real and usable: the 25%/15%/pass-rate bar from the charter; the 30% token and 25% wall-clock spread between harnesses on the same model; the phase table; 15 tool definitions in a default session against 2 in a resident surface; a 96 MB platform tarball; the install commands. Not available and never to be invented: customer names, quotes, benchmark results not produced by the rig, pricing, licensing terms, publication dates.

## Product Principles
1. The rig is the only source of truth for a progress claim.
2. Every document must produce a command. If a section cannot exit 0 or fail, it is a wish and it gets cut.
3. Surface area is where scope dies, so v1 has one install path and one model family at a time.
4. Keep what already works; Reef is a delta on OpenCode, not a rewrite.

## Accessibility & Inclusion
Target WCAG 2.2 AA on the marketing page: contrast, keyboard focus, reduced motion support, semantic landmarks. No product-specific requirement established.
