# Debugging Sonite

Sonite debugging is source-first: you work with `.sn` files, breakpoints, stack traces, and variables — not raw LLVM internals.

## Debug builds

`sn build` uses the **debug** profile by default:

```text
build/debug/<package-name>      # executable
build/debug/<package-name>.o    # object file
build/debug/symbols/            # reserved for platform symbol artifacts
```

Release builds omit most debug metadata:

```bash
sn build --release
```

Configure profiles in `project.toml` (`[profile.debug]`, `[profile.release]`, `debug-info`, `optimization`).

## Runtime diagnostics

Uncaught exceptions and runtime panics print Sonite stack traces:

```text
Uncaught Error: message

Stack trace:
  at parseUser (src/user.sn:2:11)
  at main (src/main.sn:6:5)
```

Array bounds failures use structured panics instead of silent `abort()`.

Crash reports are stored locally under `~/.sonite/crashes/`:

```bash
sn crash list
sn crash show <id>
sn crash clean --older-than 30
```

Reports are never uploaded automatically.

## VS Code

The Sonite extension registers a **Sonite** debug configuration (`type: "sonite`).

`sn init` writes `.vscode/launch.json`:

```json
{
  "type": "sonite",
  "request": "launch",
  "name": "Launch Sonite",
  "program": "${workspaceFolder}/src/main.sn"
}
```

Features:

- Build-before-launch (`buildBeforeLaunch`, default `true`)
- Breakpoints on `.sn` sources (mapped via DWARF)
- Step over / into / out, continue, pause
- Locals, arguments, scopes via LLDB
- `showNativeFrames` to reveal runtime/FFI frames

**Logpoints** are not supported in v1.

## Native debugger backend

The Sonite debug adapter (`sn debug-adapter` / `@sonite/debug-adapter`) wraps **lldb-dap** from the bundled LLVM SDK or platform package (`@sonite/llvm-*` → `bin/lldb-dap`).

Override with `SONITE_LLDB_DAP` or `SONITE_LLVM_SDK`.

## Platform symbols

| Platform | Format |
|----------|--------|
| Linux    | DWARF in executable |
| macOS    | DWARF in executable (dSYM split deferred) |
| Windows  | CodeView/PDB when targeting COFF |

## Async debugging

Async functions appear under their Sonite names; `*__async__body` frames are hidden unless `showNativeFrames` is enabled.

Async logical stacks are printed on failures when task metadata is available.

## FFI / advanced mode

Set `"showNativeFrames": true` in your launch configuration to inspect native library frames alongside Sonite code.
