# Getting Started

## Hello World

Create `hello.sn`:

```sn
function main(): void {
    print("Hello, Sonite!");
}
```

Run it:

```bash
sn run hello.sn
```

## Create a project

```bash
sn init my-app
cd my-app
```

This creates `project.toml` and `src/main.sn`.

## Build and run

```bash
sn build          # writes build/debug/my-app (or project name)
sn run            # build (if needed) and run entry point
sn run --release  # optimized release build
```

Pass arguments after `--`:

```bash
sn run -- arg1 arg2
```

## Format code

```bash
sn fmt              # format project in place
sn fmt --check      # CI: exit non-zero if formatting needed
sn fmt path/to/file.sn
```

## Add dependencies

```bash
sn add some-package
sn install
```

See [packages.md](packages.md).

## Project layout

```text
my-app/
  project.toml
  project.lock      # after sn install
  src/
    main.sn
  build/
    debug/          # default output
    release/
```

## Learn more

- [Language guide](language-guide.md)
- [Language specification](spec/README.md)
- [Examples](../examples/README.md)
- [CLI reference](reference/cli.md)
