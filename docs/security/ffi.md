# FFI Security

Sonite's memory-safety guarantees **do not extend across the FFI boundary**. Treat all native interaction as privileged code.

## Unsafe boundaries

Operations requiring `unsafe`:

- Pointer dereference and stores
- Calling `extern` functions from application code
- `FnPtr` calls and conversions
- Pointer/integer casts

The standard library is a **trusted boundary** — it may call runtime `sn_*` symbols without wrapping every call site. Application code must use `unsafe` explicitly.

## Pointer ownership

| Direction | Rule |
|-----------|------|
| Sonite → C | Pointers passed to native code must remain valid for the call duration |
| C → Sonite | Memory returned from native code is owned by the caller unless documented otherwise |
| Callbacks | `FnPtr` must not be invoked after deregistration unless native API allows |

The compiler does **not** track pointer lifetimes across calls.

## Native memory

Memory allocated by native libraries is not garbage-collected. Free according to the native API contract.

## ABI safety

- Use `@repr("C")` for structs passed to C
- Use `@abi("C")` and `@symbol("…")` for link names
- Mismatched layouts are diagnosed at compile time where possible

## Do not declare runtime symbols

Never declare `extern function sn_*` in application code. Those are internal runtime ABI.

## Reporting

Report FFI-related security issues via [SECURITY.md](../../SECURITY.md).

See also [ffi.md](../ffi.md) and [spec/ffi.md](../spec/ffi.md).
