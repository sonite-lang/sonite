import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bench, suite } from "benched-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const cli = join(root, "packages", "cli", "dist", "cli.js");
const examples = join(root, "examples");

function snRun(args: string[]): void {
  if (!existsSync(cli)) {
    throw new Error("Build the CLI first: pnpm --filter @sonite/cli build");
  }
  const result = spawnSync("node", [cli, ...args], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || "sn failed";
    throw new Error(detail);
  }
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
});

suite("Async", () => {
  bench(
    "async-concurrent.sn compile + run",
    () => {
      snRun(["run", join(examples, "async-concurrent.sn")]);
    },
    { tags: ["async"] },
  );
});
