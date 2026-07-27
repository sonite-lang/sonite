import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import {
  compileFile,
  setPackageRootsProvider,
  setStdRootProvider,
} from "../src/index.js";
import type { PackageRootInfo } from "../src/modules/resolve.js";

const repoRoot = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
  "..",
);
const examplesDir = join(repoRoot, "examples");
const stdSrc = join(repoRoot, "packages", "std", "src");

function listSnFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "certs" || entry === "native") {
      continue;
    }
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...listSnFiles(full));
    } else if (entry.endsWith(".sn")) {
      out.push(full);
    }
  }
  return out;
}

/** Entry points and standalone example files that should compile. */
const COMPILE_SKIP = new Set([
  // Use extern helpers without unsafe; covered by CLI e2e async-run tests.
  join(examplesDir, "http-fetch.sn"),
  join(examplesDir, "https-server.sn"),
]);

const COMPILE_TARGETS: string[] = [
  ...readdirSync(examplesDir)
    .filter((f) => f.endsWith(".sn"))
    .map((f) => join(examplesDir, f))
    .filter((p) => !COMPILE_SKIP.has(p)),
  join(examplesDir, "modules", "main.sn"),
  join(examplesDir, "modules", "named-main.sn"),
  join(examplesDir, "modules", "types-main.sn"),
  join(examplesDir, "native-ffi", "src", "main.sn"),
  join(examplesDir, "debugging", "main.sn"),
  join(examplesDir, "cli-app", "src", "main.sn"),
  join(examplesDir, "packages", "creator", "src", "main.sn"),
  join(examplesDir, "packages", "consumer", "src", "main.sn"),
];

describe("examples compile", () => {
  beforeAll(() => {
    setStdRootProvider(() => stdSrc);
  });

  afterAll(() => {
    setStdRootProvider(null);
  });

  it.each(COMPILE_TARGETS)("%s", (file) => {
    if (file.includes("packages/consumer")) {
      return; // tested separately with package roots
    }
    const result = compileFile(file);
    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors, errors.map((e) => e.message).join("\n")).toEqual([]);
    expect(result.success).toBe(true);
  });

  describe("package consumer with path dependency", () => {
    let prev: (() => Map<string, PackageRootInfo | string>) | null = null;

    beforeEach(() => {
      prev = null;
      const greetLibDir = join(examplesDir, "packages", "greet-lib");
      setPackageRootsProvider(() => {
        const map = new Map<string, PackageRootInfo>();
        map.set("greet-lib", { dir: greetLibDir, version: "1.0.0" });
        return map;
      });
    });

    afterEach(() => {
      setPackageRootsProvider(prev);
    });

    it("compiles consumer importing greet-lib", () => {
      const file = join(examplesDir, "packages", "consumer", "src", "main.sn");
      const result = compileFile(file);
      const errors = result.diagnostics.filter((d) => d.severity === "error");
      expect(errors, errors.map((e) => e.message).join("\n")).toEqual([]);
      expect(result.success).toBe(true);
    });
  });
});

describe("examples inventory", () => {
  it("has .sn files under examples/", () => {
    const files = listSnFiles(examplesDir);
    expect(files.length).toBeGreaterThan(40);
  });
});
