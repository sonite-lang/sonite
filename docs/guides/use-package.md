# Use a package

Consumer example: [`examples/packages/consumer/`](../../examples/packages/consumer/).

```bash
cd examples/packages/consumer
sn install
sn run
```

Add a registry dependency:

```bash
sn add greet-lib
sn install
```

Path dependencies are declared in `project.toml` — see [Packages](../packages.md).
