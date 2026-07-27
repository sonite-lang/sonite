# Packages (Normative)

This document normatively extends the user guide [packages.md](../packages.md).

## project.toml

Required fields for a publishable package:

```toml
name = "my-lib"
version = "1.0.0"
```

Optional:

```toml
[dependencies]
other = "^1.0.0"

[dev-dependencies]
test-utils = "1.0.0"

[overrides]
other = "1.2.3"   # exact version only

[native]
libraries = ["sqlite3"]
```

## Version constraints

Supported requirement forms:

- Exact: `"1.2.3"`
- Caret: `"^1.2.3"` — compatible with same major
- Tilde: `"~1.2.3"` — compatible with same major.minor

Git URL dependencies are **rejected**.

## Lockfile (project.lock)

The lockfile is **authoritative** for reproducible installs:

- Resolved versions and tarball URLs
- SHA-256 integrity hashes
- Transitive dependency graph
- Path, override, dev, and provenance fields
- Platform-specific native dependency metadata

Install without a lockfile triggers resolution and lockfile generation.

## Dependency resolution

- Semver-compatible resolution with conflict diagnostics
- Overrides must be exact; incompatible overrides fail resolution
- Path dependencies resolve from filesystem; nested path deps supported
- Dev-dependencies are installed for local builds but not required by dependents

## Transitive dependencies

Full graph is locked. `sn tree` prints the resolved tree.

## Platform dependencies

Native libraries in `[native]` may be platform-specific (see [native-packages.md](../native-packages.md)).

## Publishing

`sn publish` uploads a tarball to the registry. Packages are **immutable** once published (no public delete).

## Authentication

Registry tokens via `sn login` (device code) or `SN_REGISTRY_TOKEN` environment variable. Tokens are stored locally and never included in crash reports.

## Workspaces

Workspace monorepos are **not supported**. Use path dependencies for related local packages.
