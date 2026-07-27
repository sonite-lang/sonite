# Dependency Security

## Vulnerability policy

1. Run `sn audit` on projects with a lockfile to check advisories
2. Update affected dependencies with `sn update <package>` or override in `project.toml`
3. Report unfixed advisories in bundled stdlib/toolchain via [SECURITY.md](../../SECURITY.md)

## Lockfile integrity

- `project.lock` records SHA-256 checksums for registry packages
- Path dependencies record `source = "path:…"` with manifest hash
- Do not commit lockfiles with hand-edited checksums

## Native dependencies

Native libraries in `[native]` are linked at build time. Review:

- Source and provenance of bundled `.a` / `.lib` artifacts
- Platform-specific paths in `project.toml`
- Use `sn audit` where native packages publish advisory metadata

## Malicious packages

If you suspect a malicious registry package:

1. Do not run untrusted binaries
2. Report to the registry operator
3. File a security report via [SECURITY.md](../../SECURITY.md)

## Provenance

Lockfiles may record `publishedBy` and `publishedAt` when the registry provides them. Use `sn tree` to inspect the dependency graph.

## Supply-chain risks

Sonite itself depends on:

- **npm packages** for the Node CLI (commander, tar, semver, …) — review `pnpm-lock.yaml` and prefer `pnpm audit` in the monorepo before releases
- **Pinned LLVM/LLD** downloads (see `packages/llvm/scripts/llvm-version.json`) with checksum validation in fetch scripts
- **Bundled OpenSSL** static libraries fetched by the runtime build
- **Registry packages** consumed by end users — integrity is enforced via `project.lock` SHA-256 hashes

Before cutting a release, confirm lockfiles are committed, LLVM/OpenSSL pins are intentional, and no unexpected new native download URLs were introduced.

## Response process

Security reports receive acknowledgment within 48 hours per [SECURITY.md](../../SECURITY.md). Patches ship in patch releases when applicable.
