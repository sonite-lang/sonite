# Known Issues

Tracked limitations and planned improvements. Severity: **blocker**, **critical**, **major**, **minor**, **informational** / known limitation / post-v1.

| ID | Issue | Severity | Platforms | Affected features | Workaround | Planned |
|----|-------|----------|-----------|-------------------|------------|---------|
| KI-001 | Runtime sanitizer jobs are optional (not permanent CI gates) | informational | all | runtime hardening | Run `pnpm --filter @sonite/runtime test:asan` / `test:ubsan` / `test:stress` before release | Keep as release checklist |
| KI-002 | GC stress suite is lightweight (not a full heap fuzzer) | minor | all | GC | Stress + smoke tests pass | Expand stress coverage |
| KI-003 | Network/TLS stress is example-scale, not load-test grade | minor | all | async, networking | `examples/stress/` + e2e suites | Optional load tests post-v1 |
| KI-004 | JSON parser not in `std/json` (stringify only) | informational | all | JSON | Use an ecosystem package when available | `@sonite/json` or community package |
| KI-005 | Logpoints unsupported in debugger | informational | Linux, macOS | debugging | Use breakpoints + conditional expressions | Debugger improvements |
| KI-006 | Async task DAP polling deferred | minor | all | async debugging | Inspect via runtime task registry / stack traces | Debugger improvements |
| KI-007 | Windows ARM64 target not supported | informational | Windows ARM64 | compilation | Use Windows x64 | Platform expansion |
| KI-008 | Workspace monorepos not supported | minor | all | package management | Path dependencies for local packages | Workspaces |
| KI-009 | Git URL dependencies unsupported | informational | all | package management | Publish to registry or use path deps | Git dependencies |
| KI-010 | Compiler fuzz tests not in CI | minor | all | compiler stability | Run `pnpm test:fuzz` locally | CI fuzz job |
| KI-011 | No function overloads (by design) | informational | all | language | Use distinct function names or union parameters | — |
| KI-012 | Generic lambdas not supported | minor | all | lambdas | Use named functions with explicit types | Language |
| KI-013 | External variables in FFI not supported | informational | all | FFI | Use getter functions | FFI |
| KI-014 | Registry server-side abuse controls | informational | all | registry | Client-side rate limits documented | Registry ops |
| KI-015 | Official website not shipped | informational | all | docs | Use [docs/README.md](docs/README.md) | Website |
| KI-016 | Installer scripts hosted at sonite.dev after you publish mirrors | informational | all | install | Use GitHub raw URL or `SONITE_RELEASE_BASE` | Website / CDN |

## Stability

There are **no known blocker-severity** issues in:

- Compiler crashes on normal invalid input (fuzz + crash-regression suite)
- Runtime smoke / stress tests on Linux (ASAN/UBSAN/stress harnesses pass locally)
- Package manager lockfile integrity and tarball verification
- Cross-platform native toolchain CI (five supported targets)

`sn_map_set` copies keys into GC-managed strings (ASAN stack-use-after-scope fix, 2026-07-27).

Report new issues via [GitHub Issues](https://github.com/ethan-davies/sonite/issues). Security issues: see [SECURITY.md](SECURITY.md).
