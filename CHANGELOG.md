# Changelog

All notable changes to Sonite are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-07-27

First public release of Sonite.

### Language

- TypeScript-inspired syntax with static typing and inference
- Primitives, structs, classes, interfaces, enums, generics, unions, intersections
- Async/await with cooperative single-threaded tasks
- Exceptions (`try` / `catch` / `finally`)
- Modules with named imports/exports (no default exports)
- Lambdas, closures, function types, default and named arguments
- Public FFI: `extern`, `unsafe`, C ABI structs and pointers

### Toolchain

- Native compilation via bundled LLVM/LLD (no system LLVM required)
- Targets: Linux x64/ARM64, macOS x64/ARM64, Windows x64
- `sn` CLI: init, build, run, fmt, package management, registry auth
- Compiler diagnostics with error codes and source spans
- Debug builds with DWARF; release profile with `-O2`

### Standard library

- `std/math`, `std/random`, `std/collections`, `std/fs`, `std/io`, `std/os`
- `std/process`, `std/time`, `std/async`, `std/bytes`, `std/encoding`
- `std/net`, `std/tls`, `std/http`, `std/errors`, `std/json` (stringify only)
- Auto-loaded prelude for strings, arrays, and console I/O

### Ecosystem

- Package registry client with lockfiles, integrity verification, and semver resolution
- Path, override, and dev-dependencies
- Native library linking via `[native]` metadata
- `sn audit` for advisory lookup

### Tooling

- Language Server Protocol (`sn-lsp`)
- VS Code / Cursor extension with semantic tokens, rename, format-on-save
- Sonite Debug Adapter (DAP) with LLDB backend
- Local crash reports (`sn crash list/show/clean`)

### Documentation

- Language specification: [docs/spec/](docs/spec/)
- User guides: [docs/README.md](docs/README.md)
- FFI, packages, debugging, security guides

[1.0.0]: https://github.com/ethan-davies/sonite/releases/tag/v1.0.0
