# Build a CLI

Walk through [`examples/cli-app/`](../../examples/cli-app/).

```bash
cd examples/cli-app
sn run -- --help
sn run -- greet Ada
```

The example reads `std/process` / argv-style arguments and prints usage. Extend it by adding subcommands in `src/main.sn`.

See also: [CLI reference](../reference/cli.md), [stdlib process](../reference/stdlib.md).
