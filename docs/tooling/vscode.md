# VS Code Extension

The **Sonite** extension (`sonite-vscode`) provides language support in VS Code and Cursor.

## Install

Install from the VS Code Marketplace, or from a VSIX:

```bash
cd packages/vscode
pnpm install && pnpm build && pnpm package
code --install-extension sonite-vscode-*.vsix
```

## Features

- Syntax highlighting for `.sn`
- Language file icons for `.sn` in the explorer
- LSP integration (diagnostics, completion, hover, go-to-definition, references, rename)
- Semantic token coloring
- Format on save
- Code actions (organize imports, fix imports)
- Debug adapter integration (`type: "sonite"`)

## Debug configuration

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "sonite",
      "request": "launch",
      "name": "Debug Sonite",
      "program": "${workspaceFolder}/src/main.sn",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

See [debugging.md](../debugging.md).

## Settings

| Setting | Description |
|---------|-------------|
| `sonite.formatOnSave` | Format when saving `.sn` files |
| `sonite.lsp.path` | Custom path to `sn-lsp` binary |

## Publishing

See `packages/vscode/PUBLISH.md` for VSIX build and marketplace publish steps.

## Related

- [LSP guide](lsp.md)
- [Formatter](formatter.md)
- [Debugging](../debugging.md)
