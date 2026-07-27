# Standard Library API Stability

This document describes the stability guarantees for the Sonite standard library.

## Stability policy

All public APIs listed in [reference/stdlib.md](reference/stdlib.md) are **stable within the current major version**. Breaking changes require a new major version with deprecation in a prior minor release.

## Public API inventory

| Module | Public surface | Notes |
|--------|----------------|-------|
| Prelude | string/array/number/bool/nullable extensions, builtins | Auto-loaded |
| `std/math` | 30+ functions and constants | Stable |
| `std/random` | 5 functions | Stable; not crypto-safe |
| `std/collections` | Stack, Queue, Deque, Set, List, Map | Stable |
| `std/encoding` | utf8, base64, hex | Stable |
| `std/bytes` | Bytes | Stable |
| `std/io` | ByteStream, console helpers | Stable |
| `std/fs` | file, directory, path, FileStream | Stable |
| `std/os` | platform, architecture | Stable |
| `std/process` | args, env, cwd, exit | Stable |
| `std/time` | Instant, Duration, sleep | Stable |
| `std/async` | sleep, spawn, all, race, timeout | Stable |
| `std/errors` | 7 error classes | Stable |
| `std/net` | TCP, UDP, DNS | Stable |
| `std/tls` | TlsStream, certs | Stable |
| `std/http` | Server, fetch, streaming | Stable |
| `std/json` | stringify only | Stable subset; no parser |

Approximately 180 exported symbols across 16 modules. No accidental internal re-exports in `index.sn` barrels.

## Naming consistency

| Convention | Status |
|------------|--------|
| Modules: lowercase (`std/math`) | Consistent |
| Types: PascalCase (`TcpStream`) | Consistent |
| Functions/methods: camelCase | Consistent |
| Error types: PascalCase in `std/errors` | Consistent |
| Async APIs return `Future<T>` | Consistent |

## Error type consistency

Portable OS errors are centralized in `std/errors`. All extend `Error` with a `message` field. Network, filesystem, and TLS code throws these types rather than ad-hoc errors.

## JSON policy

`std/json` provides serialization only:

- **Included:** `Json` value type, `stringify*` functions
- **Not included:** JSON parser, `parse()` functions

The core standard library stays focused on essentials. Full JSON parsing is expected to live in a separate ecosystem package when available.

## Deprecated APIs

None currently. See [CHANGELOG.md](../CHANGELOG.md) for future deprecations.

## Unstable / experimental APIs

None marked unstable. Internal runtime `sn_*` symbols are not part of the public stdlib surface.

## Future changes

New modules and functions may be added in minor releases. Removals or signature changes follow [versioning.md](versioning.md).
