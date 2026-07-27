# Changelog

## 1.0.0

### Added

- Aligned extension version with Sonite 1.0.0
- Marketplace-ready packaging with a bundled language server and standard library
- Production IDE features: diagnostics, completion (with auto-import), hover,
  go-to-definition, find-all-references, rename, signature help, code actions,
  semantic tokens, and formatting
- Incremental document sync, analysis caching, cancellation, and crash isolation
  in the language server
- Debug configurations for the Sonite debug adapter

### Notes

- The extension embeds the Sonite language server; installing the `sn` CLI is
  optional and only required for building/running projects from the terminal.

## 0.1.0

Initial preview packaging.
