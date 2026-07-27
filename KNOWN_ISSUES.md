# Known Issues

Tracked limitations and planned improvements. Severity: **blocker**, **critical**, **major**, **minor**, **informational** / known limitation / post-v1.

Validated locally on Linux x64 (2026-07-27): ASAN, UBSAN, LSAN, runtime stress (incl. GC), net/TLS stress + TLS smoke/e2e, `test:fuzz:long` (10k iters), crash-regressions, full `pnpm test`, local `1.0.0-rc.1` pack + isolated installer, npm publish dry-run, VSIX package + Cursor install.

| ID | Issue | Severity | Platforms | Affected features | Workaround | Planned |
|----|-------|----------|-----------|-------------------|------------|---------|
| KI-001 | Runtime sanitizer jobs are not permanent CI gates | informational | all | runtime hardening | Run `pnpm --filter @sonite/runtime test:asan` / `test:ubsan` / `test:stress` as part of release validation | Keep as release checklist |
| KI-002 | GC stress suite is lightweight (not a full heap fuzzer) | minor | all | GC | Stress + smoke tests pass | Expand stress coverage |
| KI-003 | Network/TLS stress is example-scale, not load-test grade | minor | all | async, networking | `examples/stress/` + e2e suites | Load tests post-v1 |
| KI-004 | JSON parser not in `std/json` (stringify only) | informational | all | JSON | Use an ecosystem package when available | `@sonite/json` or community package |
| KI-005 | Logpoints unsupported in debugger | informational | Linux, macOS | debugging | Use breakpoints + conditional expressions | Debugger improvements |
| KI-006 | Async task DAP polling deferred | minor | all | async debugging | Inspect via runtime task registry / stack traces | Debugger improvements |
| KI-007 | Windows ARM64 target not supported | informational | Windows ARM64 | compilation | Use Windows x64 | Platform expansion |
| KI-008 | Workspace monorepos not supported | minor | all | package management | Path dependencies for local packages | Workspaces |
| KI-009 | Git URL dependencies unsupported | informational | all | package management | Publish to registry or use path deps | Git dependencies |
| KI-010 | Compiler fuzz tests not in CI | minor | all | compiler stability | Run `pnpm test:fuzz` / `test:fuzz:long` locally | CI fuzz job |
| KI-011 | No function overloads (by design) | informational | all | language | Use distinct function names or union parameters | — |
| KI-012 | Generic lambdas not supported | minor | all | lambdas | Use named functions with explicit types | Language |
| KI-013 | External variables in FFI not supported | informational | all | FFI | Use getter functions | FFI |
| KI-014 | Registry server-side abuse controls | informational | all | registry | Client-side rate limits documented | Registry ops |
| KI-015 | Official website not shipped | informational | all | docs | Use [docs/README.md](docs/README.md) | Website |
| KI-016 | Official install URLs on sonite.dev may lag GitHub Releases | informational | all | install | Use GitHub raw URL or `SONITE_RELEASE_BASE` | Website / CDN |
| KI-017 | Debug builds emit `invalid !dbg metadata attachment` warnings; LLVM ignores bad debug info | major | all | debugging, DWARF | Use `sn build --release` when debug info is not needed; binaries still link and run | Fix DILocalVariable / dbg attach scopes |
| KI-019 | Official LLVM 20+ releases omit macOS-X64 tarballs | informational | macos-x64 | native toolchain | CI/dev use Homebrew `llvm`+`lld` bottles via `source: homebrew` in `llvm-version.json`; release tarball still bundles libs | Host our own SDK or restore if upstream returns |

## Stability

There are **no known blocker-severity** issues in:

- Compiler crashes on normal invalid input (fuzz + crash-regression suite; `test:fuzz:long` passed 2026-07-27)
- Runtime smoke / stress tests on Linux (ASAN/UBSAN/LSAN/stress harnesses pass locally)
- Package manager lockfile integrity and tarball verification
- Local linux-x64 standalone installer (`file://` pack of `1.0.0-rc.1`)

**Before tagging `v1.0.0-rc.1`:** push CI fixes (KI-018: Node headers + `macos-15-intel`) and confirm `native-toolchain.yml` is green on all five platforms. Multi-OS installer validation still pending after the Release workflow publishes artifacts.

`sn_map_set` copies keys into GC-managed strings (ASAN stack-use-after-scope fix, 2026-07-27).

Report new issues via [GitHub Issues](https://github.com/ethan-davies/sonite/issues). Security issues: see [SECURITY.md](SECURITY.md).
