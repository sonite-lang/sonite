# Migration Guide

## Upgrading Sonite

Install the latest CLI:

```bash
npm install -g @sonite/cli
sn --version
```

Pin a specific version when reproducibility matters:

```bash
npm install -g @sonite/cli@<version>
```

## Lockfiles

After upgrading the toolchain, refresh dependencies if resolution changed:

```bash
sn install
```

To force a full re-resolve:

```bash
rm project.lock
sn install
```

## Project checklist

When moving to a newer Sonite version:

1. Ensure `project.toml` has `name` and `version`
2. Run `sn install` to refresh the lockfile
3. Run `sn build` and address any new diagnostics

## Semver expectations

Within a major version:

- **Patch** releases: bug fixes only, fully compatible
- **Minor** releases: new features, backward compatible; deprecations may be added
- **Major** releases: breaking changes with a migration guide

See [versioning.md](versioning.md).

## Deprecated APIs

Deprecated APIs are listed in [CHANGELOG.md](../CHANGELOG.md). The compiler may emit warnings before removal in the next major version.

## Reporting issues

- Bugs: [GitHub Issues](https://github.com/ethan-davies/sonite/issues)
- Security: [SECURITY.md](../SECURITY.md)
