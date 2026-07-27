# Error Handling

## Exception model

All thrown values must be `Error` or a subclass:

```sn
class Error {
    message: string;
    constructor(message: string) { this.message = message; }
}

throw new Error("something went wrong");
```

Built-in and stdlib errors (`std/errors`) extend `Error`.

## Try / catch / finally

```sn
try {
    risky();
} catch (e) {
    print(e.message);
} finally {
    cleanup();
}
```

- `catch` binds the caught `Error`
- `finally` runs on all exit paths (including `return` from `try` or `catch`)
- `try` / `catch` / `finally` may span `await` in async functions

## Error propagation

Uncaught exceptions unwind the call stack, printing a stack trace with source locations and function names.

## Unhandled exceptions

An unhandled exception terminates the program with a non-zero exit code after printing diagnostics.

## Runtime panics

Internal runtime failures (null dereference on reference types, assertion failures, etc.) produce structured panic output with stack traces. Local crash reports may be written to `~/.sonite/crashes` (see [debugging.md](../debugging.md)).

## Async errors

Failed or cancelled `Future` results throw when `await`ed. Use `try` / `catch` around `await` to handle them.

## Standard error types

`std/errors` defines portable OS errors:

- `FileNotFound`, `PermissionDenied`
- `ConnectionRefused`, `ConnectionReset`, `Timeout`, `DnsFailure`, `TlsError`

These are catchable like any `Error` subclass.
