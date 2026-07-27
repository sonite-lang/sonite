import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

/** Resolve CLI package version from the nearest package.json. */
export function readCliVersion(): string {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("../package.json") as { version?: string };
    if (pkg.version) {
      return pkg.version;
    }
  } catch {
    // Fall through to path walk (bundled / unusual layouts).
  }
  try {
    let dir = dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 5; i++) {
      try {
        const raw = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
          name?: string;
          version?: string;
        };
        if (raw.name === "@sonite/cli" && raw.version) {
          return raw.version;
        }
      } catch {
        // continue
      }
      dir = dirname(dir);
    }
  } catch {
    // ignore
  }
  return "0.0.0";
}

export const CLI_VERSION = readCliVersion();
