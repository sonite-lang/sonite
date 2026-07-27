# Releasing Sonite

This document covers cutting a release candidate and a final `v1.0.0` from this repository. After CI produces artifacts, publish npm packages, the VS Code Marketplace extension, and host `install.sh` / `install.ps1` on `sonite.dev`.

## Prerequisites

- Five supported platforms build in CI: Linux x64/ARM64, macOS x64/ARM64, Windows x64
- LLVM version pinned in [`packages/llvm/scripts/llvm-version.json`](../packages/llvm/scripts/llvm-version.json)
- Packages versioned at `1.0.0` in `package.json` files (tag may be `v1.0.0-rc.1` or `v1.0.0`)

## Standalone artifacts

Per-platform tarballs are built by [`.github/workflows/release.yml`](../.github/workflows/release.yml):

| Asset | Contents |
|-------|----------|
| `sonite-<ver>-<platform>.tar.gz` | Bundled Node 20, CLI + deps, LLVM native libs, runtime prebuilt, stdlib |
| `*.tar.gz.sha256` | SHA-256 of the archive |
| `SHA256SUMS` | Combined checksums |

Local dry-run (current platform only):

```bash
pnpm build:native
pnpm --filter @sonite/compiler build
pnpm --filter @sonite/llvm build:ts
pnpm --filter @sonite/runtime openssl && pnpm --filter @sonite/runtime build
pnpm --filter @sonite/std build
pnpm --filter @sonite/debug-adapter build
pnpm --filter @sonite/cli build
pnpm pack:toolchain
```

Install from a local `dist/release` directory:

```bash
SONITE_VERSION=1.0.0 \
SONITE_RELEASE_BASE="file://$(pwd)/dist/release" \
SONITE_MODIFY_PATH=0 \
./scripts/install.sh
```

## Cut a release candidate

1. Ensure `main` is green (`native-toolchain.yml`).
2. Tag and push:

```bash
git tag v1.0.0-rc.1
git push origin v1.0.0-rc.1
```

3. Wait for **Release** workflow to pack all platforms and attach assets to the GitHub Release.
4. Point installers at the release:

```bash
curl -fsSL https://raw.githubusercontent.com/ethan-davies/sonite/v1.0.0-rc.1/scripts/install.sh | \
  SONITE_VERSION=1.0.0-rc.1 sh
```

Or set `SONITE_RELEASE_BASE` to the release download base URL.

5. Run the [RC validation checklist](#rc-validation-checklist) on each supported platform.

## Promote to v1.0.0

1. Fix any RC blockers; update [`CHANGELOG.md`](../CHANGELOG.md) and [`KNOWN_ISSUES.md`](../KNOWN_ISSUES.md) if needed.
2. Tag `v1.0.0` and push (same release workflow).
3. Publish npm packages (see below).
4. Publish the VS Code VSIX ([`packages/vscode/PUBLISH.md`](../packages/vscode/PUBLISH.md)).
5. Point `https://sonite.dev/install.sh` and `install.ps1` at the scripts in this repo (or mirrored copies).

## npm publishing

Workspace packages use `workspace:*` dependencies. Publish with pnpm from the repo root so versions are rewritten:

```bash
# After authenticating to npm with access to the @sonite scope:
pnpm --filter "./packages/*" publish --access public --no-git-checks
```

Publish `@sonite/debug-adapter` as well (it is no longer private) so `@sonite/cli` resolves on npm. Platform LLVM packages (`@sonite/llvm-linux-x64`, …) must be published with their `native/` and `lib/` contents built on CI or a matching machine.

Dry-run:

```bash
pnpm --filter "./packages/*" publish --dry-run --no-git-checks
```

## RC validation checklist

On a fresh machine (or clean `SONITE_HOME`):

- [ ] Installer completes without root
- [ ] `sn --version` matches the release
- [ ] `sn init demo && cd demo`
- [ ] `sn add` / `sn install` (registry reachable)
- [ ] `sn build` and `sn run`
- [ ] `sn fmt` / `sn fmt --check`
- [ ] Upgrade path: re-run installer or `sn self-update`
- [ ] VS Code: install VSIX, open `.sn`, LSP starts
- [ ] Debug adapter launch
- [ ] FFI example under `examples/native-ffi/`

Also validate an existing `~/.sonite` upgrade (config/credentials preserved).

## Runtime stress and sanitizers

Run these before calling an RC green:

```bash
pnpm --filter @sonite/runtime test:stress
# Sanitizers (Linux):
pnpm --filter @sonite/runtime test:asan
pnpm --filter @sonite/runtime test:ubsan
```

Critical failures should be fixed or classified in `KNOWN_ISSUES.md`.

## Layout after install

```text
~/.sonite/
├── bin/sn
├── toolchains/<version>-<platform>/
├── cache/
├── config/
└── crashes/
```
