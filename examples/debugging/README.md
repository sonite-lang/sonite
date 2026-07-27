# Debugging example

Multi-function program for stepping through the debugger.

## Run

```bash
sn run examples/debugging/main.sn
```

## Debug in VS Code

Use a launch configuration:

```json
{
  "type": "sonite",
  "request": "launch",
  "name": "Debug debugging example",
  "program": "${workspaceFolder}/examples/debugging/main.sn",
  "cwd": "${workspaceFolder}/examples/debugging"
}
```

Set breakpoints on `print(message)` or inside `helper()` / `compute()` to inspect locals.

See [docs/debugging.md](../../docs/debugging.md).
