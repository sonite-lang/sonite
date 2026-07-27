# Runtime Behaviour

This section summarizes runtime semantics. The full memory model is in [MEMORY_MODEL.md](../../MEMORY_MODEL.md).

## Memory management

- **Value types** (primitives, structs, enums) live on the stack or inline in aggregates; copied on assignment
- **Reference types** (classes, strings, arrays) live on the heap
- **Garbage collection** traces reachable objects; no manual `free` in safe Sonite code

## Object lifetime

Reference types remain alive while reachable from roots (globals, stack, registers spilled to GC maps). Cycles are collected.

## String representation

Immutable UTF-8 strings on the heap. Concatenation and template interpolation allocate new strings via runtime helpers (`sn_str_concat`, `sn_*_to_string`).

## Array representation

Dynamic arrays are heap objects with length and element storage. Indexing bounds-checked in safe code.

## Closure representation

Closures capture environment in heap boxes. `let` captures are by reference; `const` by value.

## Async runtime

Cooperative scheduler with stackless coroutines. I/O integrates with the event loop (epoll/kqueue/IOCP per platform).

## Exception runtime

LLVM exception handling (`landingpad`) with Sonite-specific personality. Stack traces use DWARF debug info in debug builds.

## Thread and task behaviour

User code runs on a single OS thread. Async concurrency is cooperative, not preemptive.

## Runtime panics

Signal handlers and panic paths print Sonite frames with source locations when debug info is available.

## FFI interaction

Memory allocated in native code via FFI is **not** managed by the GC unless explicitly documented. See [ffi.md](ffi.md).

## Debug builds

Debug builds emit DWARF with source locations, function names, and local variables. Release builds (`--release` / `-O2`) omit debug metadata for size and speed.
