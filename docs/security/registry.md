# Registry Security

The Sonite package registry client enforces transport and integrity protections.

## Transport

- All registry HTTP requests use HTTPS in production
- Override with `SN_REGISTRY_URL` for local development only

## Package integrity

- Downloaded tarballs verified with SHA-256 checksums from the lockfile
- Lockfile records resolved versions and sources
- Tampered packages fail install with a clear diagnostic

## Authentication

- `sn login` uses device-code OAuth flow
- Tokens stored locally in the credentials file (see `packages/cli/src/config.ts`)
- `SN_REGISTRY_TOKEN` for CI/automation
- Tokens are **never** included in crash reports or compiler diagnostics

## Package immutability

Published packages cannot be publicly deleted. Deprecation marks packages without removing versions.

## Abuse controls (client)

The CLI respects registry rate limits and reports HTTP 429 responses. Server-side ownership and abuse policies are documented in [packages.md](../packages.md).

## Audit

Run `sn audit` to check locked dependencies against known advisories.

## Reporting

Report registry vulnerabilities via [SECURITY.md](../../SECURITY.md).
