# Modules

## Import syntax

```sn
import { foo, bar as baz } from "./utils";
import * as math from "std/math";
import { User } from "my-package/models";
```

Legacy side-effect import:

```sn
import "./setup";
import "./setup" as setup;
```

## Export syntax

```sn
export function helper(): void { ... }
export const VERSION = "1.0.0";

export { Internal as Public } from "./internal";
export * from "./types";
```

## Module resolution

| Import form | Resolution |
|-------------|------------|
| `./` or `../` | Relative to importing file |
| `std/...` | Standard library (`@sonite/std`) |
| bare name or `pkg/subpath` | Installed package from `project.lock` |

- Relative imports **require** `./` or `../`
- No default exports
- Package versions come from the lockfile, not import paths

## Visibility

- Declarations without `export` are module-private
- Only exported symbols appear in export tables and are importable
- Importing a non-exported symbol is a compile error

## Circular dependencies

Circular imports and re-exports are diagnosed with clear errors. Avoid cycles by extracting shared types to a common module.

## Prelude

The compiler auto-loads prelude modules (string, array, number, bool, nullable, io, bytes extensions). No explicit import required for prelude methods.

## Multi-file projects

Projects use `project.toml` with an entry point (default `src/main.sn`). The compiler performs workspace-aware module resolution across project and dependency sources.

See [packages.md](packages.md) for package layout.
