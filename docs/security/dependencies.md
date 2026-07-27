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

## Response process

Security reports receive acknowledgment within 48 hours per [SECURITY.md](../../SECURITY.md). Patches ship in patch releases when applicable.
