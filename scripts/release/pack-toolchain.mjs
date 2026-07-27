#!/usr/bin/env node
/**
 * Pack a standalone Sonite toolchain tarball for one platform.
 *
 * Usage:
 *   node scripts/release/pack-toolchain.mjs \
 *     --platform linux-x64 \
 *     --version 1.0.0 \
 *     --out dist/release
 *
 * Prerequisites: monorepo packages built (`pnpm build` / `build:native` /
 * runtime openssl + build) for the target platform.
 */

import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  cpSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const NODE_VERSION = process.env.SONITE_BUNDLE_NODE_VERSION || "20.19.4";

const PLATFORM_NODE = {
  "linux-x64": {
    nodeArch: "linux-x64",
    archive: `node-v${NODE_VERSION}-linux-x64.tar.gz`,
    nodeBin: "bin/node",
  },
  "linux-arm64": {
    nodeArch: "linux-arm64",
    archive: `node-v${NODE_VERSION}-linux-arm64.tar.gz`,
    nodeBin: "bin/node",
  },
  "macos-x64": {
    nodeArch: "darwin-x64",
    archive: `node-v${NODE_VERSION}-darwin-x64.tar.gz`,
    nodeBin: "bin/node",
  },
  "macos-arm64": {
    nodeArch: "darwin-arm64",
    archive: `node-v${NODE_VERSION}-darwin-arm64.tar.gz`,
    nodeBin: "bin/node",
  },
  "win32-x64": {
    nodeArch: "win-x64",
    archive: `node-v${NODE_VERSION}-win-x64.zip`,
    nodeBin: "node.exe",
  },
};

function parseArgs(argv) {
  const out = {
    platform: null,
    version: null,
    outDir: join(REPO_ROOT, "dist", "release"),
    skipNode: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--platform") out.platform = argv[++i];
    else if (a === "--version") out.version = argv[++i];
    else if (a === "--out") {
      // Always resolve relative --out against the repo root (never the caller's cwd
      // alone), so accidental packaging never lands under packages/*/dist.
      const raw = argv[++i];
      out.outDir = raw.startsWith("/") || /^[A-Za-z]:[\\/]/.test(raw)
        ? resolve(raw)
        : resolve(REPO_ROOT, raw);
    }
    else if (a === "--skip-node") out.skipNode = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: pack-toolchain.mjs --platform <id> --version <ver> [--out dir]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  if (!out.platform) {
    out.platform = detectHostPlatform();
  }
  if (!out.version) {
    const pkg = JSON.parse(
      readFileSync(join(REPO_ROOT, "package.json"), "utf8"),
    );
    out.version = String(pkg.version).replace(/^v/, "");
  }
  if (!PLATFORM_NODE[out.platform]) {
    throw new Error(
      `Unsupported platform '${out.platform}'. Supported: ${Object.keys(PLATFORM_NODE).join(", ")}`,
    );
  }
  return out;
}

function detectHostPlatform() {
  const { platform, arch } = process;
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";
  if (platform === "darwin" && arch === "x64") return "macos-x64";
  if (platform === "darwin" && arch === "arm64") return "macos-arm64";
  if (platform === "win32" && arch === "x64") return "win32-x64";
  throw new Error(`Cannot detect host platform (${platform}-${arch})`);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? REPO_ROOT,
    stdio: "inherit",
    env: opts.env ?? process.env,
    shell: opts.shell ?? false,
  });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed with status ${r.status}`);
  }
}

function mustExist(path, label) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}: ${path}`);
  }
}

function sha256File(path) {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function copyPackageFiles(pkgName, srcRoot, destRoot, entries) {
  mkdirSync(destRoot, { recursive: true });
  const pkgJson = join(srcRoot, "package.json");
  mustExist(pkgJson, `${pkgName} package.json`);
  copyFileSync(pkgJson, join(destRoot, "package.json"));
  for (const entry of entries) {
    const src = join(srcRoot, entry);
    if (!existsSync(src)) continue;
    const dest = join(destRoot, entry);
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
  }
}

async function download(url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest) && statSync(dest).size > 0) {
    console.log(`Using cached ${dest}`);
    return;
  }
  console.log(`Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}: ${url}`);
  }
  const tmp = `${dest}.partial`;
  await pipeline(res.body, createWriteStream(tmp));
  renameSync(tmp, dest);
}

async function extractNode(platform, cacheDir, nodeDest) {
  const meta = PLATFORM_NODE[platform];
  const url = `https://nodejs.org/dist/v${NODE_VERSION}/${meta.archive}`;
  const archivePath = join(cacheDir, meta.archive);
  await download(url, archivePath);

  const extractRoot = mkdtempSync(join(tmpdir(), "sonite-node-"));
  try {
    if (meta.archive.endsWith(".zip")) {
      // Prefer system unzip / PowerShell when available.
      if (process.platform === "win32") {
        run(
          "powershell",
          [
            "-NoProfile",
            "-Command",
            `Expand-Archive -Path '${archivePath}' -DestinationPath '${extractRoot}' -Force`,
          ],
          { shell: false },
        );
      } else {
        run("unzip", ["-q", archivePath, "-d", extractRoot]);
      }
    } else {
      run("tar", ["-xzf", archivePath, "-C", extractRoot]);
    }
    const entries = readdirSync(extractRoot);
    if (entries.length !== 1) {
      throw new Error(`Unexpected Node archive layout in ${extractRoot}`);
    }
    const unpacked = join(extractRoot, entries[0]);
    mkdirSync(nodeDest, { recursive: true });
    cpSync(unpacked, nodeDest, { recursive: true });
  } finally {
    rmSync(extractRoot, { recursive: true, force: true });
  }
}

function writeUnixWrapper(path, relativeNode, relativeCli) {
  const body = `#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export SONITE_TOOLCHAIN_ROOT="$ROOT"
export SONITE_STD_ROOT="\${SONITE_STD_ROOT:-$ROOT/packages/std/src}"
exec "$ROOT/${relativeNode}" "$ROOT/${relativeCli}" "$@"
`;
  writeFileSync(path, body, "utf8");
  chmodSync(path, 0o755);
}

function writeWindowsWrapper(path, relativeNode, relativeCli) {
  const body = `@echo off
setlocal
set "ROOT=%~dp0.."
set "SONITE_TOOLCHAIN_ROOT=%ROOT%"
if not defined SONITE_STD_ROOT set "SONITE_STD_ROOT=%ROOT%\\packages\\std\\src"
"%ROOT%\\${relativeNode.replace(/\//g, "\\")}" "%ROOT%\\${relativeCli.replace(/\//g, "\\")}" %*
`;
  writeFileSync(path, body, "utf8");
}

function writeCurrentPointer(binDir, toolchainRel, isWindows) {
  if (isWindows) {
    writeFileSync(
      join(binDir, "sn.cmd"),
      `@echo off
setlocal
set "SONITE_HOME=%~dp0.."
call "%SONITE_HOME%\\${toolchainRel.replace(/\//g, "\\")}\\bin\\sn.cmd" %*
`,
      "utf8",
    );
  } else {
    writeFileSync(
      join(binDir, "sn"),
      `#!/usr/bin/env bash
set -euo pipefail
SONITE_HOME="$(cd "$(dirname "$0")/.." && pwd)"
exec "$SONITE_HOME/${toolchainRel}/bin/sn" "$@"
`,
      "utf8",
    );
    chmodSync(join(binDir, "sn"), 0o755);
  }
}

async function createTarball(srcDir, destArchive) {
  mkdirSync(dirname(destArchive), { recursive: true });
  if (existsSync(destArchive)) rmSync(destArchive);
  // Pack contents of srcDir (not the directory name itself).
  run("tar", ["-czf", destArchive, "-C", srcDir, "."]);
}

async function main() {
  const args = parseArgs(process.argv);
  const { platform, version, outDir, skipNode } = args;
  const isWindows = platform.startsWith("win32");
  const llvmPkg = `llvm-${platform}`;
  const llvmSrc = join(REPO_ROOT, "packages", llvmPkg);
  const runtimePrebuilt = join(
    REPO_ROOT,
    "packages",
    "runtime",
    "prebuilt",
    platform,
  );

  mustExist(join(llvmSrc, "native"), `${llvmPkg}/native`);
  mustExist(join(llvmSrc, "lib"), `${llvmPkg}/lib`);
  mustExist(runtimePrebuilt, `runtime prebuilt ${platform}`);
  mustExist(join(REPO_ROOT, "packages", "cli", "dist", "cli.js"), "cli build");
  mustExist(
    join(REPO_ROOT, "packages", "compiler", "dist", "index.js"),
    "compiler build",
  );
  mustExist(
    join(REPO_ROOT, "packages", "llvm", "dist", "index.js"),
    "llvm JS build",
  );
  mustExist(
    join(REPO_ROOT, "packages", "runtime", "dist", "index.js"),
    "runtime JS build",
  );
  mustExist(
    join(REPO_ROOT, "packages", "std", "dist", "index.js"),
    "std build",
  );

  mkdirSync(outDir, { recursive: true });
  const stageRoot = mkdtempSync(join(outDir, ".staging-"));
  const toolchainName = `${version}-${platform}`;
  const toolchainDir = join(stageRoot, "toolchains", toolchainName);
  const cacheDir = join(
    process.env.SN_CACHE_DIR || join(REPO_ROOT, ".cache", "sonite"),
    "release-node",
  );

  console.log(`Staging toolchain ${toolchainName} in ${stageRoot}`);

  try {
    mkdirSync(join(toolchainDir, "packages"), { recursive: true });
    mkdirSync(join(stageRoot, "bin"), { recursive: true });
    mkdirSync(join(stageRoot, "cache"), { recursive: true });
    mkdirSync(join(stageRoot, "config"), { recursive: true });
    mkdirSync(join(stageRoot, "crashes"), { recursive: true });

    // Deploy CLI with production node_modules (workspace deps resolved).
    // Deploy into a sibling dir then dereference-copy so the tarball has no
    // absolute symlinks into a deleted staging path.
    const deployDir = join(stageRoot, "_deploy");
    mkdirSync(deployDir, { recursive: true });
    run("pnpm", [
      "--filter",
      "@sonite/cli",
      "deploy",
      "--prod",
      "--legacy",
      deployDir,
    ]);

    const deployedModules = join(deployDir, "node_modules");
    mustExist(deployedModules, "pnpm deploy node_modules");

    // Dereference symlinks into real files for a portable archive.
    run("cp", ["-aL", `${deployedModules}/.`, join(toolchainDir, "node_modules")]);
    for (const name of readdirSync(deployDir)) {
      if (name === "node_modules") continue;
      const src = join(deployDir, name);
      const dest = join(toolchainDir, name);
      rmSync(dest, { recursive: true, force: true });
      run("cp", ["-aL", src, dest]);
    }
    rmSync(deployDir, { recursive: true, force: true });

    // Ensure platform LLVM package has native + lib (deploy may omit large binaries).
    const llvmDest = join(
      toolchainDir,
      "node_modules",
      "@sonite",
      `llvm-${platform}`,
    );
    mkdirSync(llvmDest, { recursive: true });
    copyPackageFiles(`@sonite/llvm-${platform}`, llvmSrc, llvmDest, [
      "index.js",
      "native",
      "lib",
      "BUILD_INFO.json",
      "bin",
    ]);

    // Ensure std sources (`.sn` files) are present for compilation.
    const stdDest = join(toolchainDir, "node_modules", "@sonite", "std");
    copyPackageFiles("@sonite/std", join(REPO_ROOT, "packages", "std"), stdDest, [
      "dist",
      "src",
    ]);

    // Ensure runtime prebuilt for this platform is present.
    const runtimeDest = join(
      toolchainDir,
      "node_modules",
      "@sonite",
      "runtime",
    );
    copyPackageFiles(
      "@sonite/runtime",
      join(REPO_ROOT, "packages", "runtime"),
      runtimeDest,
      ["dist", "include", "prebuilt"],
    );

    // Convenience copy for SONITE_STD_ROOT default in wrappers.
    mkdirSync(join(toolchainDir, "packages", "std"), { recursive: true });
    cpSync(join(REPO_ROOT, "packages", "std", "src"), join(toolchainDir, "packages", "std", "src"), {
      recursive: true,
    });

    // Bundle Node
    const nodeDest = join(toolchainDir, "node");
    if (!skipNode) {
      await extractNode(platform, cacheDir, nodeDest);
    } else {
      mkdirSync(nodeDest, { recursive: true });
      writeFileSync(
        join(nodeDest, "README"),
        "Node skipped (--skip-node); use system node.\n",
      );
    }

    const nodeRel = skipNode
      ? null
      : join("node", PLATFORM_NODE[platform].nodeBin).replace(/\\/g, "/");
    // After pnpm deploy, CLI entry is at package root dist/cli.js (filter deploy)
    // or under node_modules/@sonite/cli. Prefer package root if present.
    let cliRel = "dist/cli.js";
    if (!existsSync(join(toolchainDir, cliRel))) {
      cliRel = "node_modules/@sonite/cli/dist/cli.js";
    }
    mustExist(join(toolchainDir, cliRel), "CLI entry in staged toolchain");

    const binDir = join(toolchainDir, "bin");
    mkdirSync(binDir, { recursive: true });
    if (isWindows) {
      const nodePath = skipNode ? "node" : nodeRel.replace(/\//g, "\\");
      if (skipNode) {
        writeFileSync(
          join(binDir, "sn.cmd"),
          `@echo off
setlocal
set "ROOT=%~dp0.."
set "SONITE_TOOLCHAIN_ROOT=%ROOT%"
if not defined SONITE_STD_ROOT set "SONITE_STD_ROOT=%ROOT%\\packages\\std\\src"
node "%ROOT%\\${cliRel.replace(/\//g, "\\")}" %*
`,
          "utf8",
        );
      } else {
        writeWindowsWrapper(join(binDir, "sn.cmd"), nodeRel, cliRel);
      }
    } else {
      if (skipNode) {
        writeFileSync(
          join(binDir, "sn"),
          `#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export SONITE_TOOLCHAIN_ROOT="$ROOT"
export SONITE_STD_ROOT="\${SONITE_STD_ROOT:-$ROOT/packages/std/src}"
exec node "$ROOT/${cliRel}" "$@"
`,
          "utf8",
        );
        chmodSync(join(binDir, "sn"), 0o755);
      } else {
        writeUnixWrapper(join(binDir, "sn"), nodeRel, cliRel);
      }
    }

    // Top-level bin pointer used after extract into ~/.sonite
    writeCurrentPointer(
      join(stageRoot, "bin"),
      `toolchains/${toolchainName}`,
      isWindows,
    );

    const llvmMeta = JSON.parse(
      readFileSync(
        join(REPO_ROOT, "packages", "llvm", "scripts", "llvm-version.json"),
        "utf8",
      ),
    );

    const toolchainJson = {
      version,
      platform,
      nodeVersion: skipNode ? null : NODE_VERSION,
      llvmVersion: llvmMeta.version,
      createdAt: new Date().toISOString(),
    };
    writeFileSync(
      join(toolchainDir, "TOOLCHAIN.json"),
      `${JSON.stringify(toolchainJson, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(
      join(stageRoot, "TOOLCHAIN.json"),
      `${JSON.stringify({ ...toolchainJson, current: toolchainName }, null, 2)}\n`,
      "utf8",
    );

    // Disable llvm postinstall in the packed copy (native already present).
    const llvmJsPkg = join(
      toolchainDir,
      "node_modules",
      "@sonite",
      "llvm",
      "package.json",
    );
    if (existsSync(llvmJsPkg)) {
      const pj = JSON.parse(readFileSync(llvmJsPkg, "utf8"));
      if (pj.scripts?.install) {
        delete pj.scripts.install;
        writeFileSync(llvmJsPkg, `${JSON.stringify(pj, null, 2)}\n`);
      }
    }

    // Drop non-host llvm platform stubs to shrink the archive.
    const soniteMods = join(toolchainDir, "node_modules", "@sonite");
    if (existsSync(soniteMods)) {
      for (const name of readdirSync(soniteMods)) {
        if (name.startsWith("llvm-") && name !== `llvm-${platform}`) {
          rmSync(join(soniteMods, name), { recursive: true, force: true });
        }
      }
    }

    mkdirSync(outDir, { recursive: true });
    const archiveName = `sonite-${version}-${platform}.tar.gz`;
    const archivePath = join(outDir, archiveName);
    console.log(`Creating ${archivePath}`);
    await createTarball(stageRoot, archivePath);

    const digest = sha256File(archivePath);
    const size = statSync(archivePath).size;
    const shaPath = join(outDir, `${archiveName}.sha256`);
    writeFileSync(shaPath, `${digest}  ${archiveName}\n`, "utf8");

    const sumsPath = join(outDir, "SHA256SUMS");
    let sums = "";
    if (existsSync(sumsPath)) {
      sums = readFileSync(sumsPath, "utf8");
      sums = sums
        .split("\n")
        .filter((line) => line && !line.endsWith(`  ${archiveName}`))
        .join("\n");
      if (sums && !sums.endsWith("\n")) sums += "\n";
    }
    writeFileSync(sumsPath, `${sums}${digest}  ${archiveName}\n`, "utf8");

    writeFileSync(
      join(outDir, `${archiveName}.json`),
      `${JSON.stringify({ ...toolchainJson, archive: archiveName, sha256: digest, size }, null, 2)}\n`,
    );

    console.log(`Packed ${archiveName} (${size} bytes)`);
    console.log(`SHA-256: ${digest}`);
  } finally {
    rmSync(stageRoot, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
