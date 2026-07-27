# Installation

## Supported platforms

- Linux x64 / ARM64
- macOS x64 / ARM64
- Windows x64

Windows ARM64 is not supported. You do **not** need system LLVM, Clang, LLD, or OpenSSL — the toolchain bundles them.

## Standalone installer (recommended)

### Unix (Linux / macOS)

```bash
curl -fsSL https://sonite.dev/install.sh | sh
```

Or from this repository (after a GitHub Release exists):

```bash
curl -fsSL https://raw.githubusercontent.com/ethan-davies/sonite/main/scripts/install.sh | \
  SONITE_VERSION=1.0.0 sh
```

The installer downloads a platform tarball, verifies SHA-256, and installs under `~/.sonite/` without root.

### Windows (PowerShell)

```powershell
irm https://sonite.dev/install.ps1 | iex
```

Installs to `%USERPROFILE%\.sonite\` and updates the user `PATH`.

### Verify

Open a new terminal:

```bash
sn --version
```

### Layout

```text
~/.sonite/
├── bin/sn
├── toolchains/
├── cache/
├── config/
└── crashes/
```

Update later with:

```bash
sn self-update
```

Environment overrides: `SONITE_HOME`, `SONITE_VERSION`, `SONITE_RELEASE_BASE`, `SONITE_GITHUB_REPO`, `SONITE_MODIFY_PATH=0`.

## Install from npm (optional)

Requires Node.js 20+:

```bash
npm install -g @sonite/cli
sn --version
```

`@sonite/cli` pulls the matching `@sonite/llvm-<platform>` optional dependency.

## VS Code extension

Install **Sonite** from the Marketplace, or:

```bash
cd packages/vscode
pnpm install && pnpm package
code --install-extension sonite-vscode-*.vsix
```

See [tooling/vscode.md](tooling/vscode.md).

## Uninstall

Standalone:

```bash
rm -rf ~/.sonite
# remove PATH entry from your shell profile if added by the installer
```

npm:

```bash
npm uninstall -g @sonite/cli
```

## Offline use

After installation, `sn build` and `sn run` work offline. Package install/publish needs the registry.

## Next steps

[Getting started](getting-started.md) · [Release process](release.md)
