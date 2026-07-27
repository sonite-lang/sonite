# Versioning and Compatibility

Sonite follows [Semantic Versioning 2.0.0](https://semver.org/) for all published packages.

## Package versions

| Package | Version policy |
|---------|----------------|
| `@sonite/cli` | Matches the Sonite toolchain release |
| `@sonite/compiler` | Same as CLI |
| `@sonite/runtime` | Same as CLI |
| `@sonite/std` | Same as CLI |
| `@sonite/lsp` | Same as CLI |
| `@sonite/llvm` + platform packages | Same as CLI |
| `sonite-vscode` | Independent semver, released alongside toolchain updates |

## What a major version guarantees

### Language

- Source that compiles on a given major version continues to compile on later minor/patch releases unless documented otherwise
- New keywords or syntax may be added in minor releases with advance notice
- Breaking syntax changes require a new major version

### Standard library

- Public APIs in [docs/reference/stdlib.md](reference/stdlib.md) are stable within a major version
- New modules or functions may be added in minor releases
- Removal or signature changes require deprecation in at least one minor release, then removal in the next major

### Runtime ABI

- The C runtime ABI (`sn_*` symbols used by compiled programs) is stable within a major version
- Breaking ABI changes require a new major version and a migration guide

### Compiler / CLI

- `project.toml` schema is backward compatible within a major version
- `project.lock` format is backward compatible within a major version; lockfiles may gain optional fields
- CLI commands listed in [docs/reference/cli.md](reference/cli.md) remain available; flags may be added but not removed without deprecation

### Packages and registry

- Published package tarballs are immutable (no public delete)
- Semver constraints (`^`, `~`, exact) behave as documented in [packages.md](packages.md)
- Lockfile integrity hashes remain SHA-256

### FFI

- `@repr("C")`, `@abi("C")`, and `@symbol("…")` semantics are stable within a major version
- Native dependency metadata in `project.toml` `[native]` is backward compatible

## Deprecation policy

1. Mark API or CLI flag as deprecated in the changelog and docs
2. Emit compiler or CLI warning where practical
3. Remove in the next **major** version only

## Breaking-change policy

Breaking changes are reserved for major versions. They require:

- Entry in [CHANGELOG.md](../CHANGELOG.md)
- Migration guide update in [migration.md](migration.md)
- Minimum one minor release of deprecation when feasible
