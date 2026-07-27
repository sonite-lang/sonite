# Sonite — VS Code / Cursor

Language support for **Sonite** (`.sn` files).

## Features

- Syntax highlighting (TextMate grammar)
- Diagnostics while you type
- Completion with auto-import
- Hover, go-to-definition, find all references, rename
- Signature help, code actions, organize imports
- Semantic highlighting
- Document formatting
- Debug adapter integration (LLDB backend)

The extension **bundles** the Sonite language server and standard library. You do
not need the `sn` CLI installed for editor features.

Install the [Sonite CLI](https://github.com/ethan-davies/sonite) separately when
you want to build and run projects from the terminal (`sn build`, `sn run`, …).

## Install

### Marketplace

Search for **Sonite** in the Extensions view, or install from the Visual Studio
Marketplace (publisher `sonite`).

### From a VSIX

```bash
pnpm --filter sonite-vscode package
code --install-extension packages/vscode/sonite-vscode-1.0.0.vsix
```

### Development (monorepo)

1. Build:

```bash
pnpm --filter @sonite/compiler build
pnpm --filter sonite-vscode build
```

2. Run **Launch SN Extension** (F5), or
   **Developer: Install Extension from Location…** → `packages/vscode`.

## Screenshots

Add Marketplace gallery images under `images/` (editor with diagnostics,
completions, and debug session) when capturing for publication. The extension
icon is `images/icon.png`.

## Troubleshooting

- No language features → open Output → **Sonite** and check for server start errors.
- After rebuilding from source → **Developer: Reload Window**.
- Completions → press **Ctrl+Space**; member completions also trigger after `.`.

See [PUBLISH.md](./PUBLISH.md) for packaging and Marketplace release steps.
