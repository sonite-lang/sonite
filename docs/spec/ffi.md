# FFI (Normative)

This document normatively extends [ffi.md](../ffi.md).

## extern declarations

```sn
@symbol("strlen")
@abi("C")
extern function c_strlen(value: Ptr<u8>): usize;
```

- C ABI only (`@abi("C")` default for extern)
- Link symbol defaults to function name; override with `@symbol`
- External **variables** are not supported
- Application code must not declare `extern function sn_*` (internal runtime ABI)

## unsafe

Required for:

- Pointer dereference and stores
- Pointer / integer `as` casts
- Calling `extern` functions (outside trusted std boundary)
- Calling through `FnPtr`
- Converting top-level functions to `FnPtr`

## Pointers

`Ptr<T>` and `Ptr<void>`; `null` assignable to any pointer type. The compiler does not track native retention of pointers.

## C-compatible structs

```sn
@repr("C")
struct NativePoint {
    x: i32;
    y: i32;
}
```

Field order and layout match C ABI. Padding follows platform rules.

## Function pointers

`FnPtr<(i32) => void>` for callbacks. Lifetime is caller-managed.

## Native libraries

Declared in `project.toml`:

```toml
[native]
libraries = ["m"]
librarySearchPaths = ["/usr/local/lib"]
linkArgs = []
```

Platform-specific tables supported (see [native-packages.md](../native-packages.md)).

## Ownership rules

| Boundary | Rule |
|----------|------|
| Sonite → native | Pointers must remain valid for the duration of the call unless API says otherwise |
| Native → Sonite | Caller owns memory unless API documents transfer |
| Callbacks | Must not outlive the `FnPtr` registration unless documented |
| Strings passed to C | NUL-terminated UTF-8 unless API uses length-prefixed buffers |

## ABI annotations

- `@repr("C")` on structs
- `@abi("C")` on extern functions
- `@symbol("name")` for link name override

## Diagnostics

ABI mismatches (wrong struct layout, incompatible pointer types) are caught at compile time where possible.

## Security

FFI bypasses memory safety. See [security/ffi.md](../security/ffi.md).
