import { spawnSync } from "node:child_process";
import {
  existsSync,
  rmSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bench, suite } from "benched-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const cli = join(root, "packages", "cli", "dist", "cli.js");
const examples = join(root, "examples");

function snRun(args: string[], cwd: string = root): void {
  if (!existsSync(cli)) {
    throw new Error("Build the CLI first: pnpm --filter @sonite/cli build");
  }
  const result = spawnSync("node", [cli, ...args], {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || "sn failed";
    throw new Error(detail);
  }
}

function snTimed(args: string[]): number {
  const start = performance.now();
  snRun(args);
  return performance.now() - start;
}

suite("Compiler", () => {
  bench(
    "hello.sn cold compile + run",
    () => {
      rmSync(join(root, "build"), { recursive: true, force: true });
      snRun(["run", join(examples, "hello.sn")]);
    },
    { tags: ["compile"] },
  );

  bench(
    "hello.sn warm compile + run",
    () => {
      snRun(["run", join(examples, "hello.sn")]);
    },
    { tags: ["compile"] },
  );

  bench(
    "modules project compile + run",
    () => {
      snRun(["run", join(examples, "modules", "main.sn")]);
    },
    { tags: ["compile"] },
  );

  bench(
    "large multi-file compile + run",
    () => {
      // Combine several example sources into one compile by building modules +
      // a second entry that imports shared patterns (stdlib-heavy).
      snRun(["run", join(examples, "std-collections.sn")]);
      snRun(["run", join(examples, "classes.sn")]);
      snRun(["run", join(examples, "generics.sn")]);
    },
    { tags: ["compile", "large"] },
  );
});

suite("Async", () => {
  bench(
    "async-concurrent.sn compile + run",
    () => {
      snRun(["run", join(examples, "async-concurrent.sn")]);
    },
    { tags: ["async"] },
  );

  bench(
    "async throughput (sleep tasks)",
    () => {
      snRun(["run", join(examples, "async-sleep.sn")]);
    },
    { tags: ["async", "throughput"] },
  );
});

suite("Startup", () => {
  bench(
    "CLI --version",
    () => {
      snRun(["--version"]);
    },
    { tags: ["cli", "startup"] },
  );

  bench(
    "CLI --help",
    () => {
      snRun(["--help"]);
    },
    { tags: ["cli", "startup"] },
  );

  bench(
    "runtime startup (hello binary)",
    () => {
      // Time-to-exit of a minimal program (includes compile on cold; warm path
      // measures mostly link+exec when artifacts exist).
      snTimed(["run", join(examples, "hello.sn")]);
    },
    { tags: ["runtime", "startup"] },
  );
});

suite("Packages", () => {
  bench(
    "path-dep install (consumer fixture)",
    () => {
      const consumer = join(examples, "packages", "consumer");
      rmSync(join(consumer, "project.lock"), { force: true });
      rmSync(join(consumer, "sn_modules"), { recursive: true, force: true });
      snRun(["install"], consumer);
    },
    { tags: ["packages"] },
  );
});

suite("MemoryProxies", () => {
  bench(
    "GC churn proxy (std-collections)",
    () => {
      snRun(["run", join(examples, "std-collections.sn")]);
    },
    { tags: ["memory", "gc"] },
  );
});
