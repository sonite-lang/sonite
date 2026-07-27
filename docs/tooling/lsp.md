# Language Server (LSP)

The Sonite Language Server (`sn-lsp`) provides IDE features for `.sn` files.

## Running the server

```bash
sn-lsp
```

The server communicates over stdio (JSON-RPC). VS Code and Cursor launch it automatically via the Sonite extension.

## Features

| Feature | Status |
|---------|--------|
| Diagnostics | Supported |
| Completion | Supported |
| Hover | Supported |
| Go to definition | Supported |
| Go to references | Supported |
| Rename symbol | Supported |
| Signature help | Supported |
| Code actions | Supported (organize imports, add/remove imports) |
| Semantic tokens | Supported |
| Document formatting | Supported |
| Workspace symbols | Supported |

## Workspace support

- Multi-file project analysis
- Package and dependency resolution from `project.toml` / `project.lock`
- Incremental document updates
- Cancellation support
- Graceful handling of invalid code (no server crashes)

## Configuration

Configure via VS Code `settings.json`:

```json
{
  "sonite.lsp.trace": "off"
}
```

See extension documentation for full settings.

## Development

From the monorepo:

```bash
pnpm --filter @sonite/lsp build
node packages/lsp/dist/main.js
```

## Tests

```bash
pnpm --filter @sonite/lsp test
```

Protocol, regression, and performance tests cover multi-file projects up to 1000 files.
