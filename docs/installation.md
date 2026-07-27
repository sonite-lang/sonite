# Installation

## Requirements

- **Node.js** 20 or later
- **Supported OS/arch:** Linux x64/ARM64, macOS x64/ARM64, Windows x64

You do **not** need system LLVM, Clang, LLD, or OpenSSL installed. The Sonite toolchain bundles native LLVM libraries and links the runtime automatically.

Windows ARM64 is not supported.

## Install from npm

```bash
npm install -g @sonite/cli
```

Or add as a project dependency:

```bash
npm install @sonite/cli
npx sn --version
```

## Verify installation

```bash
sn --version
```

## Platform packages

`@sonite/cli` depends on `@sonite/llvm`, which automatically selects the correct platform native package:

| Platform | Package |
|----------|---------|
| Linux x64 | `@sonite/llvm-linux-x64` |
| Linux ARM64 | `@sonite/llvm-linux-arm64` |
| macOS x64 | `@sonite/llvm-macos-x64` |
| macOS ARM64 | `@sonite/llvm-macos-arm64` |
| Windows x64 | `@sonite/llvm-win32-x64` |

If your platform is unsupported, `sn` prints a diagnostic explaining which targets are available.

## VS Code extension

Install **Sonite** from the VS Code Marketplace, or build from source:

```bash
cd packages/vscode
pnpm install && pnpm build
code --install-extension sonite-vscode-*.vsix
```

See [tooling/vscode.md](tooling/vscode.md).

## Uninstall

```bash
npm uninstall -g @sonite/cli
```

Local cache (native artifacts, registry tokens, crash reports) lives in `~/.sonite/`. Remove manually if desired:

```bash
rm -rf ~/.sonite
```

## Offline use

After installation, `sn build` and `sn run` work offline. Package install/publish requires network access to the registry.

## Next steps

[Getting started](getting-started.md)
