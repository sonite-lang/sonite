# Performance Baselines

Sonite toolchain benchmarks using [benched](https://github.com/ethan-davies/benched).

## Running benchmarks

Build the CLI, then run:

```bash
pnpm benchmark
```

This executes `scripts/benchmarks/toolchain.bench.ts` with the [benched](https://github.com/ethan-davies/benched) runner (`--no-ui` for CI-friendly output).

For a local interactive run with statistics:

```bash
pnpm --filter @sonite/cli build
benched run scripts/benchmarks/toolchain.bench.ts --verbose
```

Export JSON for comparison:

```bash
benched run scripts/benchmarks/toolchain.bench.ts --no-ui --export json
benched compare baseline.json scripts/benchmarks/benched-results-*.json
```

Benchmark output is written to `scripts/benchmarks/` and is **not committed** (see `.gitignore`).

## What is measured

| Benchmark | Description |
|-----------|-------------|
| `hello.sn cold compile + run` | Clean build dir, compile and run Hello World |
| `hello.sn warm compile + run` | Repeat compile + run with warm artifacts |
| `modules project compile + run` | Multi-file project under `examples/modules/` |
| `large multi-file compile + run` | Several heavier examples (collections, classes, generics) |
| `async-concurrent.sn compile + run` | Async task scheduling smoke |
| `async throughput (sleep tasks)` | Async sleep/task completion proxy |
| `CLI --version` / `CLI --help` | CLI process startup |
| `runtime startup (hello binary)` | Minimal program time-to-exit |
| `path-dep install (consumer fixture)` | `sn install` on `examples/packages/consumer` |
| `GC churn proxy (std-collections)` | Allocation-heavy stdlib exercise |

Configuration: [benched.config.ts](../benched.config.ts) at the repo root.

## Sample baselines (Linux x64)

Recorded on a development Linux x64 host (2026-07-27, `pnpm benchmark`):

| Benchmark | Median (approx.) |
|-----------|------------------|
| CLI `--version` | ~58 ms |
| CLI `--help` | ~60 ms |
| hello cold/warm compile+run | ~105–108 ms |
| modules compile+run | ~108 ms |
| large multi-file compile+run | ~337 ms |
| async-concurrent | ~157 ms |
| async sleep throughput proxy | ~129 ms |
| runtime startup (hello) | ~109 ms |
| path-dep install (consumer) | ~66 ms |
| GC churn proxy (std-collections) | ~120 ms |

Absolute times vary by machine — use these as order-of-magnitude anchors, not hard gates. Re-run `pnpm benchmark` after toolchain changes and compare with `benched compare`.

## Interpreting results

Benched reports mean, median, min, max, standard deviation, and ops/s per benchmark. Results vary by hardware — compare runs on the same machine over time.

See also [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) for tracked performance-related limitations.
