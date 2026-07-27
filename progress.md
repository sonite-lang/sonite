# Sonite v1.0.0 Roadmap

## Phase 1 — Cross-Platform Toolchain, Runtime & Standard Library

### Native compiler toolchain

* [x] LLVM version pinned
* [x] LLVM C API binding production-ready
* [x] LLVM object emission through `TargetMachine`
* [x] LLD integration
* [x] No `clang` subprocess
* [x] No `llc` subprocess
* [x] No `ld.lld` subprocess
* [x] No system LLVM requirement
* [x] No system Clang requirement
* [x] No system LLD requirement
* [x] Native LLVM libraries bundled
* [x] Native LLD libraries bundled
* [x] Native library loading works without environment configuration
* [x] Reproducible native toolchain builds
* [x] Platform detection
* [x] Correct target triples
* [x] Correct object formats
* [x] Correct ABI configuration
* [x] Correct system library linking

### Supported targets

* [x] Linux x64
* [x] Linux ARM64
* [x] macOS x64
* [x] macOS ARM64
* [x] Windows x64
* [x] Windows ARM64 explicitly deferred

### Native packages

* [x] `@sonite/llvm-linux-x64`
* [x] `@sonite/llvm-linux-arm64`
* [x] `@sonite/llvm-macos-x64`
* [x] `@sonite/llvm-macos-arm64`
* [x] `@sonite/llvm-win32-x64`
* [x] Automatic platform package selection
* [x] Unsupported platform diagnostics

### Runtime

* [x] Linux x64 runtime
* [x] Linux ARM64 runtime
* [x] macOS x64 runtime
* [x] macOS ARM64 runtime
* [x] Windows x64 runtime
* [x] Cross-platform runtime ABI
* [x] Memory management
* [x] Garbage collection
* [x] Exceptions
* [x] Strings
* [x] Arrays
* [x] Console I/O
* [x] Template-string formatting
* [x] Async/await
* [x] Async I/O
* [x] Byte streams
* [x] Filesystem
* [x] Paths
* [x] TCP
* [x] UDP
* [x] DNS
* [x] TLS
* [x] HTTP
* [x] HTTPS

### Standard library

* [x] Cross-platform strings
* [x] Cross-platform collections
* [x] Cross-platform math
* [x] Cross-platform filesystem
* [x] Cross-platform paths
* [x] Cross-platform networking
* [x] Cross-platform TLS
* [x] Cross-platform HTTP
* [x] Cross-platform HTTPS
* [x] Platform detection
* [x] Consistent error types
* [x] Consistent API semantics

### Cross-platform validation

* [x] All core language features compile on every target
* [x] All runtime functionality works on every target
* [x] All stdlib functionality works on every target
* [x] Async client/server round-trip on every target
* [x] HTTPS round-trip on every target
* [x] Clean-machine installation tests
* [x] No-system-LLVM tests
* [x] Native dependency inspection
* [x] Full cross-platform CI

---

# Phase 2 — Complete IDE / LSP Experience

You already have a substantial amount of this implemented, so this phase is about **finishing and hardening it**, not starting from scratch.

### Existing functionality to verify

* [x] Diagnostics
* [x] Completion
* [x] Hover
* [x] Go-to-definition
* [x] Document symbols
* [x] Go-to-references largely implemented
* [x] Auto-import largely implemented

### Complete

* [x] Go-to-references fully production-ready
* [x] Rename symbol
* [x] Signature help
* [x] Code actions
* [x] Auto-import fully production-ready
* [x] Semantic tokens
* [x] Unused-import diagnostics
* [x] Remove unused import action
* [x] Organize imports
* [x] Add missing import action
* [x] Correct import insertion
* [x] Correct import removal
* [x] Correct import sorting

### Language server robustness

* [x] Incremental document updates
* [x] Correct diagnostics after edits
* [x] Correct diagnostics after imports change
* [x] Workspace-aware module resolution
* [x] Multi-file project analysis
* [x] Dependency/package analysis
* [x] Large-project performance
* [x] Cancellation support
* [x] Graceful compiler failures
* [x] No LSP crashes on invalid code

### VS Code extension

* [x] Syntax highlighting
* [x] LSP integration
* [x] Semantic tokens
* [x] Completion UI
* [x] Diagnostics UI
* [x] Code actions
* [x] Formatting integration
* [x] Rename integration
* [x] Signature help
* [x] Auto-import
* [x] Marketplace-ready packaging

---

# Phase 3 — Formatter & Code Quality

This should be a dedicated milestone because a formatter becomes important once the language is used by multiple people.

### Formatter

* [x] Formatter implementation
* [x] Parse source
* [x] Format AST
* [x] Preserve comments
* [x] Preserve string contents
* [x] Stable output
* [x] Idempotent formatting
* [x] Configurable indentation
* [x] Configurable line width
* [x] Import formatting
* [x] Import ordering
* [x] Multiline formatting
* [x] Function formatting
* [x] Type formatting
* [x] Generic formatting
* [x] Struct/class formatting
* [x] Interface formatting
* [x] Async/await formatting
* [x] Error recovery on incomplete source

### CLI

* [x] `sn fmt`
* [x] `sn fmt --check`
* [x] Format individual files
* [x] Format entire projects
* [x] Format only changed files where practical
* [x] CI-friendly exit codes

### LSP

* [x] Document formatting
* [x] Format on save
* [x] Range formatting if practical

### Code quality

* [x] Compiler warnings framework
* [x] Unused-variable diagnostics
* [x] Unreachable-code diagnostics
* [x] Other useful static diagnostics
* [x] Configurable warning levels

---

# Phase 4 — Compiler & Language Stabilisation

Before adding major new features, make the language you already have reliable.

### Compiler correctness

* [x] Parser edge cases (existing suite + fuzz / invalid-input stability)
* [x] Scanner edge cases (existing suite + fuzz / invalid-input stability)
* [x] Typechecker edge cases (existing suite + fuzz / invalid-input stability)
* [x] Generic typechecking edge cases (existing suite + fuzz / invalid-input stability)
* [x] Generic inference correctness
* [x] Interface checking
* [x] Async typechecking
* [x] Exception checking
* [x] Module resolution
* [x] Circular dependency handling
* [x] Import/export correctness
* [x] Closure correctness
* [x] Lambda correctness
* [x] Function overload/dispatch — **N/A** (Sonite rejects duplicate function names with `E0311`; overloads are not part of the language)

### Code generation

* [x] Correct LLVM IR generation
* [x] Correct ABI lowering
* [x] Correct struct layout
* [x] Correct array layout
* [x] Correct string representation
* [x] Correct closure representation
* [x] Correct generic monomorphisation/code generation
* [x] Correct async state-machine generation
* [x] Correct exception handling
* [x] Correct debug location generation (textual DI / `!dbg`; omitted under `--release`)

### Compiler stability

* [x] Compiler never crashes on normal invalid input (fuzz + stability + crash-regressions)
* [x] Structured compiler diagnostics
* [x] Source spans on all major errors
* [x] Error codes
* [x] Helpful error messages
* [x] Suggestions where practical (high-confidence “did you mean?”)
* [x] Panic/crash reporting for compiler bugs (`~/.sonite/crashes`, no upload)
* [x] Compiler frontend fuzzing (`pnpm test:fuzz` / `test:fuzz:long`)
* [x] Crash regression fixtures (`packages/compiler/tests/crash-regressions/`)

### Cross-platform

* [x] Linux x64 / ARM64, macOS x64 / ARM64, Windows x64 — covered by existing Phase 1 CI (`native-toolchain.yml`)

### Deferred from Phase 4

Runtime stress and sanitizer work is tracked separately below so Phase 4 can close on compiler product gaps without blocking on a distinct engineering effort.

---

# Runtime Stress & Hardening (pre-v1.0)

Complete before the v1.0 release gate. Not required to close Phase 4.

* [ ] Memory safety validation (ASAN / UBSAN / LeakSanitizer in test builds)
* [ ] GC stress tests
* [ ] Async stress tests
* [ ] Concurrent task tests
* [ ] Exception stress tests
* [ ] Network stress tests
* [ ] TLS stress tests
* [ ] Resource cleanup validation
* [ ] Socket cleanup
* [ ] File handle cleanup
* [ ] TLS cleanup

---

# Phase 5 — Public FFI & Native Interoperability

This is where `extern` evolves from primarily being an internal runtime mechanism into a supported way for Sonite packages to interact with native libraries.

### FFI language features

* [x] Public `extern` declarations
* [x] C ABI support
* [x] External functions
* [ ] External variables if needed
* [x] External structs
* [x] Native pointers
* [x] Pointer types
* [x] Native arrays/buffers
* [x] Native callbacks
* [x] Function pointers
* [x] C-compatible primitive types
* [x] C-compatible struct layout
* [x] ABI annotations
* [x] `unsafe` boundary if required

### Linking

* [x] Native library declarations
* [x] Static libraries
* [x] Dynamic libraries
* [x] Platform-specific libraries
* [x] Library search paths
* [x] Linker arguments
* [ ] Include/header metadata if needed
* [x] Package-provided native dependencies

### Package integration

Allow packages to declare native dependencies.

Conceptually:

```toml
[native]
libraries = ["sqlite3"]
```

Support:

* [x] Native dependency metadata
* [x] Platform-specific native dependencies
* [x] Native library discovery
* [x] Native library bundling
* [x] Native dependency installation
* [x] Cross-platform native package handling

### Safety

* [x] Clear FFI safety model
* [x] Unsafe FFI operations identified
* [x] Pointer lifetime rules
* [x] Memory ownership rules
* [x] Callback lifetime rules
* [x] ABI mismatch diagnostics

### Runtime

* [x] Internal runtime `extern` ABI documented internally
* [x] Runtime symbols separated from public FFI
* [x] Runtime symbol naming conventions
* [x] No accidental exposure of internal runtime APIs

---

# Phase 6 — Package Ecosystem & Build System Maturity

You already have:

* Package registry
* Package publishing API
* Package CLI commands
* Dependency system
* `project.toml`

This phase is about making the ecosystem production-ready.

### Dependency management

* [x] Lockfile implementation
* [x] Deterministic dependency resolution
* [x] Transitive dependencies
* [x] Semantic version constraints
* [x] Version conflict resolution
* [x] Dependency updates
* [x] Dependency removal
* [x] Dependency overrides
* [x] Local/path dependencies
* [ ] Git dependencies if desired — **deferred / unsupported in v1** (explicit rejection + docs)
* [x] Development dependencies if desired

### CLI

Ensure the package system has:

* [x] `sn init`
* [x] `sn add`
* [x] `sn remove`
* [x] `sn install`
* [x] `sn update`
* [x] `sn publish`
* [x] `sn search`
* [x] `sn info`
* [x] `sn login`
* [x] `sn logout`
* [x] `sn build`
* [x] `sn run`
* [x] `sn tree`
* [x] `sn clean`
* [x] `sn audit`
* [x] `sn deprecate`
* [x] `sn owner` (list/add/remove/transfer)
* [x] `sn cache clean`
* [x] `sn fmt`

### Lockfiles

* [x] Lockfile format
* [x] Dependency versions
* [x] Resolved package URLs
* [x] Integrity hashes
* [x] Transitive dependency information
* [x] Platform-specific dependency information
* [x] Reproducible installs
* [x] Lockfile validation
* [x] Override / path / dev / provenance fields

### Registry

* [x] Package publishing
* [x] Package downloading
* [x] Package metadata
* [x] Version management
* [x] Package ownership (owner + maintainers + transfer)
* [x] Authentication
* [x] Package deletion policy (documented; no public delete)
* [x] Deprecation
* [x] Package search
* [x] Package documentation metadata
* [x] Download statistics
* [x] Abuse/security controls (rate limits, name protection, report)

### Package security

* [x] Tarball integrity verification
* [x] Checksums
* [x] Registry HTTPS
* [x] Authentication tokens
* [x] Secure credential storage
* [x] Dependency provenance where practical
* [x] `sn audit` / advisory lookup

### Project management

* [x] Project configuration validation
* [x] Build profiles
* [x] Debug build
* [x] Release build
* [x] Optimisation levels (`0`–`3`)
* [x] Project metadata
* [x] Entry point configuration
* [x] Build output configuration (`build/<profile>/`)

### Workspaces

If desired before v1:

* [ ] Workspace configuration — **deferred past v1.0.0**
* [ ] Multiple Sonite packages
* [ ] Shared lockfile
* [ ] Workspace dependencies
* [ ] Workspace builds

Workspaces remain optional for v1; use path dependencies for related local packages. See [docs/packages.md](docs/packages.md).

---

# Phase 7 — Debugging & Production Diagnostics

### Debug information

* [x] LLVM debug metadata
* [x] Source locations
* [x] Function names
* [x] Local variable information
* [x] Type information where practical
* [x] Debug builds
* [x] Release builds

### Runtime diagnostics

* [x] Stack traces
* [x] Source file locations
* [x] Line numbers
* [x] Function names
* [x] Async stack traces (logical task metadata + async stack printing)
* [x] Exception stack traces
* [x] Runtime panic reporting

### Debug Adapter Protocol

Implement a Sonite debug adapter.

* [x] DAP implementation
* [x] VS Code integration
* [x] Launch configuration
* [x] Attach configuration
* [x] Breakpoints
* [x] Conditional breakpoints (via LLDB expressions)
* [ ] Logpoints if practical (documented as unsupported in v1)
* [x] Step over
* [x] Step into
* [x] Step out
* [x] Continue
* [x] Pause
* [x] Restart (via VS Code; adapter supports relaunch)
* [x] Stop

### Debug inspection

* [x] Call stack
* [x] Local variables
* [x] Global variables (via LLDB scopes where available)
* [x] Function arguments
* [x] Object inspection
* [x] Array inspection
* [x] String inspection
* [x] Async task inspection where practical (runtime task registry; DAP polling deferred)

### Native debugger integration

Integrate with:

```text id="9xqdbk"
LLDB
```

on:

```text id="y1b39k"
Linux
macOS
```

and:

```text id="3v6x6s"
Windows debugger tooling
```

where appropriate.

* [x] LLDB via lldb-dap (bundled from LLVM SDK when available)
* [x] Sonite frame filtering (hide runtime/async internals by default)
* [x] `showNativeFrames` for FFI/advanced debugging

The Sonite developer should interact with the Sonite debugger rather than needing to understand native debugger internals.

### Crash reporting

* [x] Compiler crash reports (`~/.sonite/crashes`, JSON)
* [x] Runtime crash signal handlers with last Sonite frame
* [x] `sn crash list` / `sn crash show` / `sn crash clean`
* [x] No automatic upload

### Documentation

* [x] [docs/debugging.md](docs/debugging.md)
* [x] Debugging example ([examples/debugging/main.sn](examples/debugging/main.sn))

---

# Phase 8 — v1.0.0 Release Readiness

Release gate after Phase 7. Documentation hub: [docs/README.md](docs/README.md).

## Release prep

* [x] Known issues tracked ([KNOWN_ISSUES.md](KNOWN_ISSUES.md))
* [x] Versioning policy ([docs/versioning.md](docs/versioning.md))
* [x] CHANGELOG ([CHANGELOG.md](CHANGELOG.md))
* [ ] npm publish — **manual**

## Language specification

* [x] Core language specification ([docs/spec/](docs/spec/))
* [x] Type system specification
* [x] Generics documented
* [x] Async/await documented
* [x] Error handling documented
* [x] Module system documented
* [x] Package system documented
* [x] FFI documented
* [x] Runtime behaviour documented
* [x] Standard library API documented

## Standard library

* [x] Public API reviewed ([docs/stdlib-stability.md](docs/stdlib-stability.md))
* [x] API naming consistent
* [x] API stability review
* [x] Deprecated APIs identified (none in v1)
* [x] Unstable APIs explicitly marked (none)
* [x] Core library documentation complete ([docs/reference/stdlib.md](docs/reference/stdlib.md))
* [x] JSON intentionally excluded from core (stringify only; see stdlib-stability)

## CLI

* [x] All required commands implemented
* [x] CLI reference ([docs/reference/cli.md](docs/reference/cli.md))
* [x] Experimental commands marked (`compile`, `debug-adapter`, `--emit-ir`)
* [x] Version `1.0.0`

## Installation

* [x] Installation guide ([docs/installation.md](docs/installation.md))
* [x] Linux / macOS / Windows — CI cross-platform
* [x] Clean-machine installation
* [x] No system LLVM requirement
* [x] Native packages automatically selected
* [ ] npm publish smoke test — **manual**

## Documentation

* [ ] Official website — **deferred** (external; in-repo docs complete)
* [x] Getting started guide
* [x] Installation guide
* [x] Language guide
* [x] Language reference (spec)
* [x] Standard library reference
* [x] Module system documentation
* [x] Package management guide
* [x] `project.toml` reference
* [x] Lockfile documentation
* [x] FFI guide
* [x] Async/await guide
* [x] Networking guide
* [x] TLS/HTTPS guide
* [x] Debugging guide
* [x] LSP/VS Code guide
* [x] Cross-platform guide
* [x] Migration/versioning guide

## Examples

* [x] Hello World
* [x] CLI application ([examples/cli-app/](examples/cli-app/))
* [x] Filesystem application
* [x] Async application
* [x] TCP server
* [x] HTTP server
* [x] HTTPS server
* [x] HTTP client
* [x] Package usage ([examples/packages/consumer/](examples/packages/consumer/))
* [x] Package creation ([examples/packages/creator/](examples/packages/creator/))
* [x] FFI example
* [x] Debugging example (expanded)
* [x] Examples index ([examples/README.md](examples/README.md))
* [x] Compile-all CI test (`packages/compiler/tests/examples.test.ts`)

## Testing

* [x] Full compiler test suite
* [x] Full runtime test suite
* [x] Full stdlib test suite
* [x] Full LSP test suite (CI on linux-x64)
* [x] Formatter tests
* [x] Full CLI test suite (CI on linux-x64)
* [x] Registry tests (mock HTTP client)
* [x] FFI tests
* [x] Debugger tests
* [x] VS Code extension tests (CI on linux-x64)
* [x] Cross-platform CI
* [x] Clean-machine tests
* [x] End-to-end tests
* [x] Regression test suite
* [ ] Compiler fuzz in CI — **deferred** (manual `pnpm test:fuzz`)
* [ ] Runtime stress/sanitizer — **future** (see KNOWN_ISSUES)

## Performance

* [x] Compiler performance baseline ([docs/performance-baselines.md](docs/performance-baselines.md))
* [x] Async compile+run baseline
* [x] Medium-project compile baseline
* [x] `pnpm benchmark` script ([benched](https://github.com/ethan-davies/benched))
* [ ] Memory / GC / network throughput baselines — **future**

## Security

* [x] Registry HTTPS
* [x] Package integrity checks
* [x] Lockfile integrity
* [x] Secure authentication
* [x] FFI security documentation ([docs/security/ffi.md](docs/security/ffi.md))
* [x] Native dependency security review (documented)
* [x] Dependency vulnerability policy ([docs/security/dependencies.md](docs/security/dependencies.md))
* [x] Report-security process ([SECURITY.md](SECURITY.md))
* [x] Tokens excluded from crash reports (audited)

## Stability

* [x] No known **blocker** compiler crashes (fuzz + crash-regression suite)
* [x] No known **blocker** runtime crashes (CI smoke tests)
* [x] No known **blocker** package manager bugs
* [x] No known **blocker** cross-platform issues (5-target CI)
* [x] Known issues classified in [KNOWN_ISSUES.md](KNOWN_ISSUES.md)
* [ ] Runtime stress validation — **future**

## Release artifacts

* [x] All packages versioned `1.0.0`
* [x] Package metadata (repository, license)
* [ ] npm publish — **manual**
* [ ] GitHub release — **manual**

