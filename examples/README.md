# Sonite Examples

Official and feature examples for Sonite.

## Quick start

```bash
sn run examples/hello.sn
```

## Official examples

| Example | Run command | Description |
|---------|-------------|-------------|
| [hello.sn](hello.sn) | `sn run examples/hello.sn` | Hello World |
| [cli-app/](cli-app/) | `sn run -- greet Alice` | CLI with subcommands |
| [filestream.sn](filestream.sn) | `sn run examples/filestream.sn` | Filesystem / FileStream |
| [async-sleep.sn](async-sleep.sn) | `sn run examples/async-sleep.sn` | Async basics |
| [async-tcp.sn](async-tcp.sn) | `sn run examples/async-tcp.sn` | TCP client/server |
| [http-server.sn](http-server.sn) | `sn run examples/http-server.sn` | HTTP server |
| [https-server.sn](https-server.sn) | `sn run examples/https-server.sn` | HTTPS server |
| [http-fetch.sn](http-fetch.sn) | `sn run examples/http-fetch.sn` | HTTP client |
| [packages/consumer/](packages/consumer/) | `sn run` (from dir) | Path dependency usage |
| [packages/creator/](packages/creator/) | `sn publish` (after login) | Publishable package layout |
| [native-ffi/](native-ffi/) | `sn build && sn run` | FFI and native linking |
| [debugging/](debugging/) | VS Code debugger | Breakpoints and stepping |

## Language features

| File | Topic |
|------|-------|
| `generics.sn` | Generics and constraints |
| `classes.sn`, `interfaces.sn`, `inheritance.sn` | OOP |
| `structs.sn`, `enums.sn` | Value types |
| `lambdas.sn`, `function-types.sn` | Functions and closures |
| `async-*.sn` | Async I/O patterns |
| `errors.sn`, `async-try-catch.sn`, `finally-return.sn` | Error handling |
| `modules/` | Multi-file imports |
| `unions.sn`, `nullability.sn` | Type system |

## Standard library

| File | Module |
|------|--------|
| `std-math.sn` | `std/math` |
| `std-random.sn` | `std/random` |
| `std-collections.sn` | `std/collections` |
| `std-core.sn` | fs, process, time, encoding |
| `json-stringify.sn` | `std/json` (stringify only) |

## CI

All compile targets are tested in `packages/compiler/tests/examples.test.ts`. Networking examples have e2e run tests in `packages/cli/tests/async-run.test.ts`.

## Documentation

- [Getting started](../docs/getting-started.md)
- [Language guide](../docs/language-guide.md)
- [Networking](../docs/networking.md)
