# Install

Status: the `0.1.0` tarballs build reproducibly and install cleanly into an empty project.
Nothing is published to npm yet, so the tarball path is the working one today.

Reef ships as one standalone binary. The npm package is `reefcode`; the command it installs
is `reef`. The two names differ because npm `reef` is taken by a dead package (ADR 0005).

## Requirements

- One of: Node 20+, Bun, or nothing at all if you use the archive.
- An API key for whichever model you use. Reef ships no credential and talks to no
  service of ours. See [BYOK and local operation](04-decisions/0008-byok-local.md).

## Install

```sh
npm install -g reefcode
reef --version
```

```sh
bunx reefcode
```

From the built tarballs, without a registry:

```sh
npm install -g ./reefcode-0.1.0.tgz ./reefcode-windows-x64-0.1.0.tgz
reef --version
```

Verified on `0.1.0`: both tarballs install into an empty project and `reef v0.1.0`
runs from the local `node_modules/.bin`. The platform tarball is roughly 96 MB.

The package is a small launcher. Its postinstall step links the native binary for your
platform from the matching `reefcode-<os>-<arch>` package, or downloads it if your package
manager skipped optional dependencies. If install scripts are disabled, the launcher
prints one line telling you so rather than failing silently.

On Linux you can skip npm entirely: unpack `reef-linux-<arch>.tar.gz` and put `reef` on
`PATH`. macOS and Windows install through npm.

## First run

```sh
reef
reef run "what does this repo do"
```

`reef run` is the headless path: one prompt, a JSON event stream on stdout, exit code
carrying pass or fail. `reef` alone opens the interactive shell.

Authenticate a provider before the first run:

```sh
reef auth login
```

## Where Reef keeps things

| What | Path |
|---|---|
| Project config | `reef.json` or `reef.jsonc` in the project root |
| Global config | `$XDG_CONFIG_HOME/reef` (default `~/.config/reef`) |
| Data, logs, repos | `$XDG_DATA_HOME/reef` (default `~/.local/share/reef`) |
| Cache | `$XDG_CACHE_HOME/reef` (default `~/.cache/reef`) |

`opencode.json` is still read as a fallback for one release, so an existing config is not a
cliff. Reef's own names win when both are present.

## Known gaps at 0.1.0

- Environment variables are still `OPENCODE_*`. The rename to `REEF_*` is planned, not done.
- The interactive shell still says OpenCode in some places. Restyling is phase 6.
- No auto-update, no telemetry, no hosted service.
- Stored credentials are per channel. A `latest` build reads `opencode.db`, a preview build
  reads `opencode-<channel>.db`, both in the data directory. Copying a database between
  channels, or switching channel, looks like "no authenticated integrations" rather than a
  migration. Log in again for the channel you use, or point `OPENCODE_DB` at the database
  that holds the credential.

## Build from source

```sh
cd code
bun install
cd packages/cli
bun run build --single --skip-web-ui
bun run pack
```

Set `OPENCODE_VERSION=0.1.0` and `OPENCODE_CHANNEL=latest` when building a release binary,
otherwise the version becomes a preview string such as `0.0.0-main-202610311901`.
`--single` builds only the current platform; drop it to build all twelve targets.
`--skip-install` is safe once dependencies are installed and saves a network round trip.
