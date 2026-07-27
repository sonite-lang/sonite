# example-creator

Example of a publishable Sonite package layout.

## Layout

```text
example-creator/
  project.toml    # name, version, metadata
  src/main.sn     # entry point + exports
```

## Local development

```bash
sn build
sn run
```

## Publishing

```bash
sn login
sn publish
```

See [docs/packages.md](../../docs/packages.md) for dependency and lockfile details.
