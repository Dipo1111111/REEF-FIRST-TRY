# Publishing Reef

Status: the `0.1.0` Windows tarballs build, pack, and install cleanly. Publishing needs a
2FA proof that only the account owner can produce.

## Why the publish failed

```
npm error 403 ... Two-factor authentication or granular access token with bypass 2fa enabled is required
```

A normal `npm login` session is not enough to publish when the account has 2FA. The registry
wants either a one-time password at publish time, or a token that is explicitly allowed to
skip 2FA for publishing.

## Option A: granular token with bypass 2FA

1. npmjs.com, account menu, Access Tokens, Generate New Token, Granular Access Token.
2. Permissions: Read and write.
3. Packages: `reefcode` and `reefcode-*`.
4. Tick **Bypass 2FA** (npm currently limits this for account changes; publishing is still
   allowed when the box is present).
5. Add it to `%USERPROFILE%\.npmrc`:

```
//registry.npmjs.org/:_authToken=<token>
```

Then run `bin\publish.cmd`.

## Option B: one-time password

```
bin\publish.cmd 123456
```

The OTP is checked when the upload starts, so start the publish as soon as the code appears.
The launcher tarball is 2.9 KB; the Windows binary package is 96 MB, so the order matters:
platform packages first, launcher last. `bin\publish.cmd` does that.

## Package order

1. `reefcode-windows-x64` (built on this machine)
2. `reefcode-darwin-arm64` (needs a macOS runner)
3. `reefcode-darwin-x64` (needs a macOS runner)
4. `reefcode`, the launcher, which depends on the platform packages

## macOS builds

Cross-compiling on Windows is blocked: the build needs the darwin native packages
(`@ff-labs/fff-bin-darwin-*`, `@parcel/watcher-darwin-*`, `@opentui/core-darwin-*`) and
installing them here hangs on the registry. The build script supports the targets
(`OPENCODE_TARGET=darwin-arm64`), so a macOS runner or a CI job produces them without
changes. `.github/workflows/release.yml` is the prepared path.
