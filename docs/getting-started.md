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

## First project tutorial

Create a project and run it end-to-end:

```bash
sn init my-app
cd my-app
sn run
```

`sn init` writes `project.toml` and `src/main.sn`. Open `src/main.sn` and change the greeting, then `sn run` again.

Build a native binary without running it:

```bash
sn build
./build/debug/my-app   # path may match the project name
```

Format sources:

```bash
sn fmt
sn fmt --check   # CI-friendly
```

### Add a local library (packages)

Sonite packages are declared in `project.toml`. For a quick path-dependency walkthrough see [Use a package](guides/use-package.md). Registry packages:

```bash
sn add some-package
sn install
```

### Call native code (FFI)

Public FFI uses `extern` / `unsafe`. Start with [FFI guide](guides/ffi.md) and the `examples/native-ffi/` tree.

## Build and run options

```bash
sn build          # writes build/debug/<name>
sn run            # build (if needed) and run entry point
sn run --release  # optimized release build
```

Pass arguments after `--`:

```bash
sn run -- arg1 arg2
```

## Project layout

```text
my-app/
  project.toml
  project.lock      # after sn install
  src/
    main.sn
  build/
    debug/
    release/
```

## Language tour

Continue with the [language guide](language-guide.md) for types, functions, structs, classes, interfaces, generics, errors, async, and modules. Practical recipes live under [guides/](guides/).

## Learn more

- [Language guide](language-guide.md)
- [Language specification](spec/README.md)
- [Examples](../examples/README.md)
- [CLI reference](reference/cli.md)
- [Guides](guides/)
