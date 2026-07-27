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
| `async-concurrent.sn compile + run` | Async task scheduling smoke |

Configuration: [benched.config.ts](../benched.config.ts) at the repo root.

## Interpreting results

Benched reports mean, median, min, max, standard deviation, and ops/s per benchmark. Results vary by hardware — compare runs on the same machine over time.

## Future coverage

Additional benchmarks may cover:

- Peak compiler memory
- GC / allocation throughput
- TCP/HTTP/HTTPS throughput
- Package manager resolve/install at scale
- Release profile (`--release`) compile times

Track planned work in [KNOWN_ISSUES.md](../KNOWN_ISSUES.md).
