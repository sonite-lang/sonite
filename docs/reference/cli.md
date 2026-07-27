# CLI Reference

The `sn` command-line interface for Sonite.

```bash
sn --help
sn <command> --help
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (diagnostic, build failure, invalid arguments, fmt --check failed) |
| Other | Compiler internal error (crash report may be written) |

Errors print to stderr with `error:` prefix or structured compiler diagnostics.

## Stable commands

### Project

| Command | Description |
|---------|-------------|
| `sn init [dir]` | Create new project (`-f` overwrite) |
| `sn build` | Build native binary |
| `sn run [file]` | Build and run |
| `sn clean` | Remove build artifacts |
| `sn fmt` | Format source |

### Dependencies

| Command | Description |
|---------|-------------|
| `sn add <pkg>` | Add dependency |
| `sn remove <pkg>` | Remove dependency |
| `sn install` | Install from lockfile |
| `sn update [pkg]` | Refresh lockfile |
| `sn tree` | Print dependency tree |

### Registry

| Command | Description |
|---------|-------------|
| `sn login` | Device-code auth |
| `sn logout` | Revoke local token |
| `sn search [query]` | Search packages |
| `sn info <name>` | Package metadata |
| `sn publish` | Publish current project |
| `sn deprecate <pkg> --reason <text>` | Deprecate package |
| `sn owner list\|add\|remove\|transfer` | Manage owners |
| `sn audit` | Security advisories |

### Diagnostics

| Command | Description |
|---------|-------------|
| `sn crash list` | List local crash reports |
| `sn crash show <id>` | Show crash report |
| `sn crash clean` | Remove crash reports |

### Cache

| Command | Description |
|---------|-------------|
| `sn cache clean` | Clear native artifact cache |

### Toolchain

| Command | Description |
|---------|-------------|
| `sn self-update` | Update standalone install from GitHub Releases |
| `sn self-update --check` | Check for a newer release without installing |
| `sn self-update --version <ver>` | Install a specific release |

## Experimental / internal commands

| Command | Description |
|---------|-------------|
| `sn compile` | Emit LLVM IR only (experimental) |
| `sn debug-adapter` | DAP server for VS Code (internal) |
| `sn build --emit-ir` | Also write `.ll` file (experimental) |
| `sn build --ir-only` | Skip linking; IR only (experimental) |

Positional `sn file.sn` is shorthand for `sn run file.sn`.

## sn build

```
sn build [-o <file>] [--release] [--profile <name>] [--warnings-as-errors]
         [--emit-ir] [--ir-only]
```

Output defaults to `build/<profile>/<project-name>`.

Profiles: `debug` (default), `release`, or custom from `project.toml`.

## sn run

```
sn run [file] [--release] [--profile <name>] [--warnings-as-errors] [-- args...]
```

Arguments after `--` are passed to the compiled program.

## sn fmt

```
sn fmt [paths...] [--check] [--write] [--changed]
```

- `--check`: exit 1 if formatting would change files
- Default: write formatted output in place

## Environment variables

| Variable | Description |
|----------|-------------|
| `SN_REGISTRY_TOKEN` | Registry auth token (alternative to `sn login`) |
| `SN_REGISTRY_URL` | Override registry URL |
| `SONITE_BUNDLE_FROM_SYSTEM` | Dev only: allow system LLVM (not for end users) |

## Missing project

Commands that require a project (`build`, `run`, `add`, etc.) error if `project.toml` is missing in the current directory or parent.

## Network failures

Registry commands print HTTP errors with status codes. Retry after checking connectivity and authentication.

## Unsupported platform

If no native LLVM package matches the host, `sn` exits with a diagnostic listing supported platforms.

## See also

- [getting-started.md](../getting-started.md)
- [packages.md](../packages.md)
- [debugging.md](../debugging.md)
