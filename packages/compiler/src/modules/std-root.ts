import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Locate the standard library source root (`packages/std/src` or bundled copy). */
export function discoverStdRoot(): string | null {
  const fromEnv = process.env.SONITE_STD_ROOT;
  if (fromEnv && existsSync(join(fromEnv, "prelude", "string.sn"))) {
    return fromEnv;
  }
  try {
    const require = createRequire(import.meta.url);
    const std = require("@sonite/std") as {
      getStdRoot: () => string;
    };
    return std.getStdRoot();
  } catch {
    const here = dirname(fileURLToPath(import.meta.url));
    const candidates = [
      join(here, "..", "..", "std", "src"),
      join(here, "..", "..", "..", "std", "src"),
      // Bundled beside a packaged LSP server: dist/server.js → ../stdlib
      join(here, "..", "stdlib"),
      join(here, "stdlib"),
    ];
    for (const root of candidates) {
      if (existsSync(join(root, "prelude", "string.sn"))) {
        return root;
      }
    }
    return null;
  }
}

/** Prelude module paths derived from the discovered std root. */
export function discoverPreludePaths(): readonly string[] {
  const root = discoverStdRoot();
  if (!root) {
    return [];
  }
  return [
    join(root, "prelude", "string.sn"),
    join(root, "prelude", "array.sn"),
    join(root, "prelude", "number.sn"),
    join(root, "prelude", "bool.sn"),
    join(root, "prelude", "nullable.sn"),
    join(root, "prelude", "io.sn"),
    join(root, "prelude", "bytes.sn"),
  ];
}
