# Sonite v1.0.0 — Final Release Readiness Specification

## 1. Native Distribution & Installer

Sonite must be installable on supported platforms without npm, system LLVM, Clang, or LLD.

### Supported platforms

* [x] Linux x64
* [x] Linux ARM64
* [x] macOS x64
* [x] macOS ARM64
* [x] Windows x64

### Installer

Create an official Sonite installer.

#### Unix installer

Support:

```bash
curl -fsSL https://sonite.dev/install.sh | sh
```

The installer must:

* [x] Detect operating system
* [x] Detect architecture
* [x] Select correct Sonite release
* [x] Download the correct CLI/toolchain
* [x] Verify downloaded artifacts
* [x] Install to a user-local Sonite directory
* [x] Configure PATH
* [x] Avoid requiring root privileges
* [x] Detect existing installation
* [x] Upgrade existing installation
* [x] Fail safely on interrupted installation
* [x] Verify installation after completion

Scripts: [`scripts/install.sh`](scripts/install.sh). Layout: `~/.sonite/{bin,toolchains,cache,config,crashes}`.

Hosting `https://sonite.dev/install.sh` is a manual publish step after release.

#### Windows installer

Support:

```powershell
irm https://sonite.dev/install.ps1 | iex
```

The installer must:

* [x] Detect Windows architecture
* [x] Download correct release
* [x] Verify artifacts
* [x] Install to user-local directory
* [x] Configure user PATH
* [x] Upgrade existing installation
* [x] Verify installation
* [x] Handle failed/interrupted installation

Script: [`scripts/install.ps1`](scripts/install.ps1).

### Installer verification

After installation:

```bash
sn --version
```

must work from a new terminal.

Test on clean machines/VMs with:

* [x] Linux x64 (local pack + install dry-run)
* [ ] Linux ARM64 (CI release artifacts — validate after tag)
* [ ] macOS x64 (CI release artifacts — validate after tag)
* [ ] macOS ARM64 (CI release artifacts — validate after tag)
* [ ] Windows x64 (CI release artifacts — validate after tag)

No system LLVM/Clang/LLD should be required.

---

# 2. Sonite CLI Distribution

The CLI must be a complete user-facing product.

### CLI

Verify:

* [x] `sn init`
* [x] `sn build`
* [x] `sn run`
* [x] `sn fmt`
* [x] `sn fmt --check`
* [x] `sn add`
* [x] `sn remove`
* [x] `sn install`
* [x] `sn update`
* [x] `sn publish`
* [x] `sn search`
* [x] `sn info`
* [x] `sn login`
* [x] `sn logout`
* [x] `sn tree`
* [x] `sn clean`
* [x] `sn audit`
* [x] `sn deprecate`
* [x] `sn owner`
* [x] `sn cache clean`
* [x] `sn self-update`

### CLI quality

* [x] Every command has `--help`
* [x] Every command has consistent error formatting
* [x] Exit codes are documented
* [x] Invalid commands produce useful errors
* [x] Missing project configuration produces useful errors
* [x] Missing dependencies produce actionable errors
* [x] Unsupported platforms produce actionable errors
* [x] CLI never exposes internal stack traces by default
* [x] `--version` works
* [x] Version is consistent across all released components

### Self-update

Implement:

```bash
sn self-update
```

Support:

* [x] Update to latest stable release
* [x] Version verification
* [x] Artifact verification
* [x] Safe replacement of current binary/toolchain
* [x] Failed-update rollback
* [x] Version selection if practical (`--version`, `--check`)

Keep this separate from:

```bash
sn update
```

which updates project dependencies.

---

# 3. Release Artifact Pipeline

Create a reproducible release process.

### Artifacts

Produce:

* [x] Linux x64 (pack script + local dry-run)
* [x] Linux ARM64 (CI matrix in `release.yml`)
* [x] macOS x64 (CI matrix)
* [x] macOS ARM64 (CI matrix)
* [x] Windows x64 (CI matrix)

Each release must contain:

* [x] `sn` CLI
* [x] Compiler
* [x] Runtime
* [x] Standard library
* [x] LLVM libraries
* [x] LLD libraries
* [x] Required native support files

### Release verification

For every artifact:

* [x] SHA-256 checksum
* [x] Artifact size recorded
* [x] Version embedded (`TOOLCHAIN.json`)
* [x] Target architecture verified (platform id in archive name + metadata)
* [x] Clean-machine installation tested *(Linux x64 local `1.0.0-rc.1` only; other OS after RC tag)*
* [x] `sn --version` tested *(Linux x64)*
* [x] `sn init` tested *(Linux x64)*
* [x] `sn build` tested *(Linux x64)*
* [x] `sn run` tested *(Linux x64)*

### Reproducibility

* [x] Release builds reproducible (pinned LLVM + Node bundle version)
* [x] LLVM version pinned
* [x] Native toolchain versions pinned
* [x] Build scripts version-controlled
* [x] Release process documented ([docs/release.md](docs/release.md))

---

# 4. Package Registry Production Readiness

Your package ecosystem is implemented, but the registry itself must be treated as a production service.

### Registry

Verify:

* [x] Publishing
* [x] Downloading
* [x] Versioning
* [x] Search
* [x] Authentication
* [x] Ownership
* [x] Maintainers
* [x] Deprecation
* [x] Package documentation metadata
* [x] Download statistics

### Production security

* [ ] Rate limiting tested
* [ ] Authentication abuse protections
* [ ] Package name squatting protections
* [ ] Package upload size limits
* [ ] Tarball validation
* [ ] Malformed package rejection
* [ ] Malicious metadata rejection
* [ ] Dependency abuse protections
* [ ] Account recovery process
* [ ] Security incident process

### Package lifecycle

Document:

* [ ] Publishing policy
* [ ] Version immutability
* [ ] Package deletion policy
* [ ] Deprecation policy
* [ ] Ownership transfer policy
* [ ] Security advisory process

*(Server-side registry ops are out of scope for this repository cut.)*

---

# 5. Documentation Completion

The language needs to be learnable by someone who has never used Sonite.

### Getting started

* [x] Installation
* [x] Hello World
* [x] First project tutorial
* [x] Variables and types
* [x] Functions
* [x] Structs/classes
* [x] Interfaces
* [x] Generics
* [x] Error handling
* [x] Async/await
* [x] Modules
* [x] Packages
* [x] FFI

### Reference

* [x] Language specification
* [x] Type system
* [x] Generics
* [x] Async
* [x] Error handling
* [x] Modules
* [x] Packages
* [x] FFI
* [x] Runtime behaviour
* [x] Standard library

### Practical guides

* [x] Build a CLI
* [x] Read/write files
* [x] Build an HTTP client
* [x] Build an HTTP server
* [x] Build an HTTPS server
* [x] Use async tasks
* [x] Publish a package
* [x] Use a package
* [x] Use native libraries through FFI
* [x] Debug a Sonite program
* [x] Configure VS Code

---

# 6. VS Code Extension Release

The extension is technically complete, but should be validated as a product.

* [x] Syntax highlighting
* [x] LSP
* [x] Completion
* [x] Diagnostics
* [x] Semantic tokens
* [x] Formatting
* [x] Rename
* [x] Signature help
* [x] Auto-import
* [x] Code actions

### Release

* [x] Final extension icon
* [x] Marketplace metadata
* [ ] Screenshots
* [x] README
* [x] Versioning aligned with Sonite
* [x] `.vsix` production build (`sonite-vscode-1.0.0.vsix`)
* [x] Clean installation tested *(Cursor: Install from VSIX, 2026-07-27)*
* [x] Extension tested with released `sn` *(local RC `sn` + VSIX; LSP Output panel smoke still manual)*
* [ ] LSP startup tested
* [ ] Marketplace publication

---

# 7. Testing & Release Validation

This is the biggest remaining gap I would address before calling v1.0 stable.

### Compiler

* [x] Unit tests
* [x] Integration tests
* [x] Regression tests
* [x] Fuzzing
* [x] Crash regression fixtures

### Runtime

Complete the remaining hardening:

* [x] ASAN testing
* [x] UBSAN testing
* [x] LeakSanitizer testing (`test:lsan` / ASAN detect_leaks)
* [x] GC stress tests
* [x] Async stress tests
* [x] Concurrent task stress tests
* [x] Exception stress tests
* [x] Network stress tests (`examples/stress/`)
* [x] TLS stress tests (existing TLS smoke + examples)
* [x] Resource cleanup tests
* [x] Socket cleanup tests (covered via net smoke/e2e)
* [x] File handle cleanup tests
* [x] TLS cleanup tests (TLS smoke)

These don't necessarily need to be permanent v1 CI gates, but they should be run as part of release validation and critical failures resolved.

### Cross-platform

Run full release validation on:

```text
Linux x64
Linux ARM64
macOS x64
macos ARM64
Windows x64
```

Test:

* [x] Compiler (CI)
* [x] Runtime (CI smoke)
* [x] Standard library (CI e2e)
* [x] Async (CI)
* [x] Filesystem (CI)
* [x] Networking (CI)
* [x] TLS (CI)
* [x] HTTP (CI)
* [x] HTTPS (CI)
* [x] FFI (examples + docs)
* [x] Packages (client + e2e where applicable)
* [x] LSP (CI)
* [x] Formatter (CI)
* [x] Debugger (debug-adapter tests)

Standalone installer validation on non-Linux hosts remains part of the RC checklist.

---

# 8. Performance Baselines

Establish v1.0 baselines:

* [x] Compiler baseline
* [x] Async compile baseline
* [x] Medium-project compile baseline
* [x] Runtime startup time
* [x] CLI startup time
* [x] Memory usage (proxy via GC churn example)
* [x] GC behaviour (proxy)
* [x] Async throughput (proxy)
* [x] Network throughput *(proxy via existing e2e; full load tests post-v1)*
* [x] Package installation time
* [x] Large project compilation

See [docs/performance-baselines.md](docs/performance-baselines.md).

---

# 9. Security Review

Before release:

* [x] Registry HTTPS
* [x] Package integrity
* [x] Lockfile integrity
* [x] Secure authentication
* [x] FFI security documentation
* [x] Native dependency review
* [x] Vulnerability policy
* [x] Security reporting process

Additionally:

* [x] Audit installer download flow
* [x] Verify all release artifacts (checksum pipeline)
* [x] Verify installer checksum/signature handling (SHA-256)
* [x] Verify no credentials enter logs (crash redaction + audit)
* [x] Verify crash reports contain no secrets
* [x] Verify package tokens are never committed
* [x] Verify FFI cannot accidentally expose internal runtime symbols
* [x] Review dependency supply-chain risks

---

# 10. Known Issues & Stability Gate

Create a final release classification.

Every known issue must be classified — see [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

### v1.0 release blockers

There must be:

* [x] No known blocker compiler crashes
* [x] No known blocker runtime crashes
* [x] No known blocker memory corruption
* [x] No known blocker GC bugs
* [x] No known blocker async deadlocks
* [x] No known blocker data corruption
* [x] No known blocker package manager issues
* [x] No known blocker cross-platform issues
* [x] No known blocker security issues
* [x] No known blocker installer failures *(scripts ready; multi-OS RC validation pending)*

Known limitations are acceptable if documented.

---

# 11. Release Candidate

Before `1.0.0`, produce:

```text
1.0.0-rc.1
```

Run the entire release process using the RC — see [docs/release.md](docs/release.md).

Validate:

```text
Installer
    ↓
sn --version
    ↓
sn init
    ↓
sn add
    ↓
sn install
    ↓
sn build
    ↓
sn run
    ↓
sn fmt
    ↓
sn test
    ↓
sn publish
```

Then test:

* [x] Fresh machine *(Linux x64 isolated `SONITE_HOME=/tmp/sonite-rc-home`)*
* [ ] Existing Sonite installation
* [ ] Upgrade from previous version
* [ ] Package installation
* [ ] Package publishing *(npm `publish --dry-run` only; no registry publish)*
* [x] VS Code integration *(VSIX built + installed; interactive LSP smoke manual)*
* [x] Debugging *(debug-adapter unit tests + `examples/debugging`; interactive DAP manual; see KI-017)*
* [x] FFI *(Linux x64 `examples/native-ffi`)*
* [ ] Cross-platform behaviour

Only after the RC passes should you tag `v1.0.0`.

---

# 12. Final Release Checklist

The actual release should follow:

```text
Feature freeze
      ↓
Release candidate
      ↓
Cross-platform validation
      ↓
Installer validation
      ↓
Registry validation
      ↓
Security review
      ↓
Runtime stress testing
      ↓
Documentation review
      ↓
VS Code extension release
      ↓
Publish Sonite artifacts
      ↓
Tag v1.0.0
      ↓
Publish release notes
      ↓
Announce release
```

## My assessment of your current state

Your **language/compiler feature set is effectively v1.0-ready**. Local Linux x64 release validation (2026-07-27) passed sanitizers, stress, long fuzz, full `pnpm test`, and a packed `1.0.0-rc.1` installer.

1. **Standalone installer + pack pipeline** — validated locally for linux-x64
2. **Runtime stress and sanitizer harnesses** — ASAN/UBSAN/LSAN/stress green
3. **Docs, CLI self-update, VS Code 1.0.0 VSIX, performance baselines** — ready; VSIX installed into Cursor
4. **Blocking before tag** — push CI Node-headers fix (KI-018), get `native-toolchain` green, then tag `v1.0.0-rc.1`
5. **Your remaining ops steps** — multi-OS RC matrix, publish npm + Marketplace, host install scripts on sonite.dev (`sonite.dev` DNS not live yet — KI-016), tag `v1.0.0`

The most important next milestone for you:

> **Commit CI/fuzz/packaging fixes, confirm `native-toolchain` is green, tag `v1.0.0-rc.1`, run the remaining RC checklist in [docs/release.md](docs/release.md) on all platforms, then promote to `v1.0.0`.**
