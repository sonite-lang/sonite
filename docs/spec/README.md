# Sonite Language Specification

This directory is the **authoritative language specification** for Sonite.

## Normative vs informative

- **Normative** sections define required compiler and runtime behavior.
- **Informative** notes (marked with *Informative*) provide rationale or examples.
- The compiler test suite in `packages/compiler/tests/` is the conformance reference when ambiguity exists.

## Specification index

| Document | Scope |
|----------|-------|
| [lexical.md](lexical.md) | Tokens, identifiers, keywords, literals, operators |
| [types.md](types.md) | Type system, inference, compatibility, conversions |
| [generics.md](generics.md) | Generic declarations, constraints, monomorphisation |
| [expressions-statements.md](expressions-statements.md) | Expressions, statements, control flow, functions |
| [classes-interfaces.md](classes-interfaces.md) | Structs, classes, interfaces, enums |
| [async.md](async.md) | Async functions, await, futures, concurrency |
| [errors.md](errors.md) | Exceptions, try/catch/finally, panics |
| [modules.md](modules.md) | Imports, exports, resolution, visibility |
| [packages.md](packages.md) | `project.toml`, lockfiles, dependency resolution |
| [runtime.md](runtime.md) | Memory model, GC, runtime representations |
| [ffi.md](ffi.md) | Extern, unsafe, pointers, C ABI |

## Unsupported features

- Function overloads (duplicate names are rejected with `E0311`)
- Default exports
- Git URL dependencies
- Generic lambdas
- External variables in FFI
- Windows ARM64 target

See [KNOWN_ISSUES.md](../../KNOWN_ISSUES.md) for tracked limitations.
