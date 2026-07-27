# Formatter

Sonite includes an opinionated source formatter integrated into the CLI and LSP.

## CLI usage

```bash
sn fmt                  # format all .sn files in the project
sn fmt --check          # verify formatting (CI-friendly, exit 1 if changes needed)
sn fmt --write file.sn  # format specific files
sn fmt --changed        # format git-changed files only
```

## Configuration

Formatter options (indent width, line width) are read from project configuration when present. Defaults match the compiler's standard style.

## LSP / editor

The VS Code extension supports format-on-save and document formatting via the language server. See [vscode.md](vscode.md).

## Behaviour

- Parses and re-emits AST with stable formatting
- Preserves comments and string contents
- Formats imports and import ordering
- Idempotent: running twice produces identical output
- Recovers gracefully on incomplete source (best-effort format)

## CI

```bash
sn fmt --check
```

Exit code `0` if formatted; non-zero if changes would be required.

## Specification

Formatter golden fixtures live in `packages/compiler/tests/formatter/`.
