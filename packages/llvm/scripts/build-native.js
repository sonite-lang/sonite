#!/usr/bin/env node
/**
 * Build sonite_llvm.node against the pinned LLVM SDK (downloaded or SONITE_LLVM_SDK),
 * bundle required shared libraries, install into the host platform package, and validate deps.
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  symlinkSync,
  lstatSync,
} from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { ensureLlvmSdk, hostPlatformId } from "./fetch-llvm-sdk.js";
import { validateNativeDeps } from "./validate-native-deps.js";

const require = createRequire(import.meta.url);
const meta = require("./llvm-version.json");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pinned = meta.version;
const workspaceRoot = join(root, "..", "..");

function majorMinor(v) {
  const parts = String(v).split(".");
  return `${parts[0]}.${parts[1]}`;
}

function sdkLlvmConfig(sdkRoot) {
  const name =
    process.platform === "win32" ? "llvm-config.exe" : "llvm-config";
  return join(sdkRoot, "bin", name);
}

function runLlvmConfig(sdkRoot, args) {
  const bin = sdkLlvmConfig(sdkRoot);
  const r = spawnSync(bin, args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(
      `llvm-config ${args.join(" ")} failed: ${r.stderr || r.stdout}`,
    );
  }
  return r.stdout.trim();
}

function copySharedLibs(sdkLib, destLib) {
  mkdirSync(destLib, { recursive: true });
  if (!existsSync(sdkLib)) {
    throw new Error(`SDK lib dir missing: ${sdkLib}`);
  }

  const wanted = (name) =>
    /^(libLLVM|liblld)/.test(name) &&
    (name.includes(".so") || name.endsWith(".dylib") || name.endsWith(".dll")) &&
    // Skip LLDB debugger libs; we only ship libLLVM + LLD drivers.
    !/^liblldb/i.test(name);

  let copied = 0;
  for (const entry of readdirSync(sdkLib)) {
    if (!wanted(entry)) continue;
    const src = join(sdkLib, entry);
    let st;
    try {
      st = lstatSync(src);
    } catch {
      continue;
    }
    // Always materialize real files (no absolute symlinks into /usr or /tmp).
    if (st.isSymbolicLink() || st.isFile()) {
      const dest = join(destLib, entry);
      try {
        cpSync(src, dest, { dereference: true });
        copied += 1;
      } catch (err) {
        // Skip broken symlinks / static-only names
        if (st.isFile()) {
          throw err;
        }
      }
    }
  }
  return copied;
}

/** Monolithic shared libLLVM (not component archives like libLLVMCore.a). */
function findMonolithicSharedLlvm(libDir) {
  if (!existsSync(libDir)) return null;
  const names = readdirSync(libDir);
  const preferred = [
    "libLLVM.so",
    "libLLVM.dylib",
    "LLVM.dll",
    "libLLVM-22.so",
    "libLLVM-21.so",
  ];
  for (const name of preferred) {
    if (names.includes(name)) return join(libDir, name);
  }
  const versioned = names
    .filter((n) => /^libLLVM\.so\.\d/.test(n) || /^libLLVM\.\d.*\.dylib$/.test(n))
    .sort();
  if (versioned.length) return join(libDir, versioned[versioned.length - 1]);
  return null;
}

function detectLinkMode(llvmLibDir) {
  const sharedPath = findMonolithicSharedLlvm(llvmLibDir);
  if (sharedPath) return { mode: "shared", sharedPath };
  const staticCore =
    existsSync(join(llvmLibDir, "libLLVMCore.a")) ||
    existsSync(join(llvmLibDir, "LLVMCore.lib"));
  if (staticCore) return { mode: "static", sharedPath: null };
  throw new Error(
    `LLVM SDK lib dir ${llvmLibDir} has neither shared libLLVM nor static component archives`,
  );
}

function lldDriverFlags(llvmLibDir) {
  const drivers = ["lldELF", "lldMachO", "lldCOFF", "lldCommon"];
  const flags = [];
  for (const name of drivers) {
    const base = `lib${name}`;
    const has =
      existsSync(join(llvmLibDir, `${base}.a`)) ||
      existsSync(join(llvmLibDir, `${base}.so`)) ||
      existsSync(join(llvmLibDir, `${base}.dylib`)) ||
      existsSync(join(llvmLibDir, `${base}.lib`)) ||
      readdirSync(llvmLibDir).some(
        (n) => n.startsWith(`${base}.so`) || n.startsWith(`${base}.`),
      );
    if (has) flags.push(`-l${name}`);
  }
  return flags;
}

/**
 * llvm-config on static SDKs may emit absolute paths to system .a files that
 * are not installed. Prefer shared -lFoo for the Node addon.
 */
function normalizeSystemLibs(sysLibs) {
  return sysLibs
    .split(/\s+/)
    .filter(Boolean)
    .map((flag) => {
      if ((flag.endsWith(".a") || flag.endsWith(".lib")) && flag.includes("/")) {
        const base = basename(flag)
          .replace(/^lib/, "")
          .replace(/\.(a|lib)$/i, "");
        return `-l${base}`;
      }
      return flag;
    });
}

function platformPackageDir(platformId) {
  // packages/llvm-linux-x64 etc.
  return join(workspaceRoot, "packages", `llvm-${platformId}`);
}

function napiIncludeDir() {
  const r = spawnSync(
    process.execPath,
    ["-p", "require('node-addon-api').include"],
    { cwd: root, encoding: "utf8" },
  );
  if (r.status !== 0) {
    throw new Error("node-addon-api not installed in @sonite/llvm");
  }
  return r.stdout.trim().replace(/^"|"$/g, "");
}

function findNodeIncludeDir() {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const execDir = dirname(process.execPath);
  const candidates = [
    "/usr/include/node",
    join(execDir, "..", "include", "node"),
    join(execDir, "include", "node"),
  ];
  for (const inc of candidates) {
    if (existsSync(join(inc, "node_api.h"))) return inc;
  }
  // Bundled Node-API headers (always available after pnpm install).
  try {
    const apiHeaders = require("node-api-headers");
    if (
      apiHeaders?.include_dir &&
      existsSync(join(apiHeaders.include_dir, "node_api.h"))
    ) {
      return apiHeaders.include_dir;
    }
  } catch {
    // optional until dependency is installed
  }
  // node-gyp headers cache (Linux/macOS + Windows)
  for (const base of [
    join(home, ".cache/node-gyp"),
    join(home, "Library/Caches/node-gyp"),
    join(home, "AppData/Local/node-gyp/Cache"),
  ]) {
    if (!existsSync(base)) continue;
    for (const ver of readdirSync(base)) {
      const inc = join(base, ver, "include", "node");
      if (existsSync(join(inc, "node_api.h"))) return inc;
    }
  }
  return null;
}

function nodeIncludeDir() {
  const existing = findNodeIncludeDir();
  if (existing) return existing;

  // setup-node omits system headers; fetch a matching node-gyp cache as last resort.
  console.error("info: Node headers missing; installing via node-gyp…");
  const install = spawnSync(
    "npx",
    ["--yes", "node-gyp@11", "install", `v${process.versions.node}`],
    { cwd: root, stdio: "inherit", env: process.env, shell: true },
  );
  if (install.status !== 0) {
    throw new Error(
      "Node headers not found (install node-api-headers or ensure node-gyp can fetch headers)",
    );
  }

  const after = findNodeIncludeDir();
  if (after) return after;
  throw new Error(
    "Node headers not found after node-gyp install (expected /usr/include/node, node-api-headers, or node-gyp cache)",
  );
}

async function main() {
  const platformId = process.env.SONITE_TARGET_PLATFORM || hostPlatformId();
  if (meta.deferredPlatforms?.includes(platformId)) {
    console.error(
      `error: platform ${platformId} is deferred; no native artifact in this milestone`,
    );
    process.exit(1);
  }

  console.error(`info: ensuring LLVM ${pinned} SDK for ${platformId}…`);
  let sdkRoot;
  if (process.env.SONITE_BUNDLE_FROM_SYSTEM === "1") {
    console.error(
      "warning: SONITE_BUNDLE_FROM_SYSTEM=1 — building against system LLVM and bundling its libs",
    );
    const cfg = spawnSync("llvm-config", ["--prefix"], { encoding: "utf8" });
    if (cfg.status !== 0) {
      throw new Error("system llvm-config not found");
    }
    sdkRoot = cfg.stdout.trim();
  } else {
    try {
      sdkRoot = await ensureLlvmSdk(platformId);
    } catch (err) {
      throw err;
    }
  }
  const sdkConfig = sdkLlvmConfig(sdkRoot);
  if (!existsSync(sdkConfig)) {
    // Some layouts only have headers/libs; try system llvm-config only for version check via header
    console.error(
      `warning: ${sdkConfig} missing; using include/lib from SDK with compiler defaults`,
    );
  }

  let sdkVersion = pinned;
  if (existsSync(sdkConfig)) {
    sdkVersion = runLlvmConfig(sdkRoot, ["--version"]);
    if (majorMinor(sdkVersion) !== majorMinor(pinned)) {
      console.error(
        `error: incompatible LLVM SDK version: found ${sdkVersion}, Sonite requires ${pinned}`,
      );
      process.exit(1);
    }
  }

  const llvmInclude = existsSync(sdkConfig)
    ? runLlvmConfig(sdkRoot, ["--includedir"])
    : join(sdkRoot, "include");
  const llvmLibDir = existsSync(sdkConfig)
    ? runLlvmConfig(sdkRoot, ["--libdir"])
    : join(sdkRoot, "lib");
  const llvmLdflags = existsSync(sdkConfig)
    ? runLlvmConfig(sdkRoot, ["--ldflags"])
    : `-L${llvmLibDir}`;
  const llvmSys = existsSync(sdkConfig)
    ? runLlvmConfig(sdkRoot, ["--system-libs"])
    : "";
  const llvmCxx = existsSync(sdkConfig)
    ? runLlvmConfig(sdkRoot, ["--cxxflags"])
        .split(/\s+/)
        .filter((f) => f && f !== "-fno-exceptions" && f !== "-fno-rtti")
        .join(" ")
    : `-I${llvmInclude} -std=c++17`;

  const link = detectLinkMode(llvmLibDir);
  console.error(`info: LLVM link mode: ${link.mode}`);

  // Official Linux tarballs are often static-only (no libLLVM.so). Prefer
  // llvm-config --link-static/--link-shared when available.
  let llvmLibs = "";
  if (existsSync(sdkConfig)) {
    try {
      llvmLibs = runLlvmConfig(sdkRoot, [
        link.mode === "static" ? "--link-static" : "--link-shared",
        "--libs",
      ]);
    } catch {
      llvmLibs = runLlvmConfig(sdkRoot, ["--libs"]);
    }
  } else if (link.mode === "shared") {
    llvmLibs = "";
  } else {
    throw new Error("static LLVM SDK requires llvm-config --libs");
  }

  const buildDir = join(root, "build", "Release");
  mkdirSync(buildDir, { recursive: true });
  const out = join(buildDir, "sonite_llvm.node");

  const napiDir = napiIncludeDir();
  const nodeInc = nodeIncludeDir();
  const cxx = process.env.CXX || "c++";

  // Bundle libs into platform package lib/ with rpath relative to .node in native/
  const pkgDir = platformPackageDir(platformId);
  const pkgNative = join(pkgDir, "native");
  const pkgLib = join(pkgDir, "lib");
  mkdirSync(pkgNative, { recursive: true });
  mkdirSync(pkgLib, { recursive: true });

  const rpathFlag =
    process.platform === "darwin"
      ? "-Wl,-rpath,@loader_path/../lib"
      : "-Wl,-rpath,$ORIGIN/../lib";

  const lldFlags = lldDriverFlags(llvmLibDir);
  const llvmLibFlags = llvmLibs.split(/\s+/).filter(Boolean);
  // Drop a bare -lLLVM when the SDK has no libLLVM.so / libLLVM.a (component
  // archives only). We'll pass the shared object path explicitly if needed.
  const filteredLlvmLibs = llvmLibFlags.filter((f) => f !== "-lLLVM");

  /** @type {string[]} */
  const linkLibs = [];
  if (link.mode === "static") {
    // Component archives have circular deps; group them on ELF linkers.
    if (process.platform === "linux") {
      linkLibs.push("-Wl,--start-group", ...lldFlags, ...filteredLlvmLibs, "-Wl,--end-group");
    } else {
      linkLibs.push(...lldFlags, ...filteredLlvmLibs);
    }
  } else {
    linkLibs.push(...lldFlags);
    if (filteredLlvmLibs.length) {
      linkLibs.push(...filteredLlvmLibs);
    } else if (link.sharedPath) {
      linkLibs.push(link.sharedPath);
    } else {
      linkLibs.push("-lLLVM");
    }
  }

  const compileArgs = [
    "-shared",
    "-fPIC",
    "-std=c++17",
    "-fexceptions",
    "-frtti",
    "-O2",
    `-I${napiDir}`,
    `-I${nodeInc}`,
    `-I${llvmInclude}`,
    `-DSONITE_LLVM_VERSION_EXPECTED="${pinned}"`,
    "-DNAPI_DISABLE_CPP_EXCEPTIONS",
    "-DNODE_ADDON_API_DISABLE_DEPRECATED",
    ...llvmCxx.split(/\s+/).filter(Boolean),
    ...["native/addon.cpp", "native/backend.cpp", "native/linker.cpp"].map((s) =>
      join(root, s),
    ),
    `-o${out}`,
    ...llvmLdflags.split(/\s+/).filter(Boolean),
    `-L${llvmLibDir}`,
    ...linkLibs,
    ...normalizeSystemLibs(llvmSys),
  ];
  if (link.mode === "shared") {
    compileArgs.push(rpathFlag);
  }

  console.error("info: compiling native addon against pinned SDK…");
  const compile = spawnSync(cxx, compileArgs, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  if (compile.status !== 0) {
    if (compile.stdout) process.stdout.write(compile.stdout);
    if (compile.stderr) process.stderr.write(compile.stderr);
    process.exit(compile.status ?? 1);
  }

  // Copy shared LLVM/LLD libraries into package lib/ (skipped for static link).
  rmSync(pkgLib, { recursive: true, force: true });
  mkdirSync(pkgLib, { recursive: true });
  if (link.mode === "shared") {
    let n = copySharedLibs(llvmLibDir, pkgLib);
    if (n === 0) {
      const lib64 = join(sdkRoot, "lib64");
      if (existsSync(lib64)) {
        n = copySharedLibs(lib64, pkgLib);
      }
    }
    const bundled = readdirSync(pkgLib);
    if (bundled.length === 0) {
      console.error(
        `error: no LLVM/LLD shared libraries found in ${llvmLibDir} to bundle`,
      );
      process.exit(1);
    }
    console.error(`info: bundled ${bundled.length} library files into ${pkgLib}`);
  } else {
    writeFileSync(
      join(pkgLib, "LINK_MODE.txt"),
      "static\n# LLVM/LLD were statically linked into sonite_llvm.node; no shared libs to ship.\n",
    );
    console.error(
      "info: static link — LLVM/LLD archived into sonite_llvm.node (no shared lib bundle)",
    );
  }

  copyFileSync(out, join(pkgNative, "sonite_llvm.node"));
  // Dev fallback prebuild
  const prebuilds = join(root, "prebuilds");
  mkdirSync(prebuilds, { recursive: true });
  copyFileSync(out, join(prebuilds, `sonite_llvm-${process.platform}-${process.arch}.node`));

  // Also place a copy of libs under prebuilds/lib for local loadNative fallback
  const preLib = join(prebuilds, "lib");
  rmSync(preLib, { recursive: true, force: true });
  cpSync(pkgLib, preLib, { recursive: true });

  const sdkBin = join(sdkRoot, "bin");
  const pkgBin = join(pkgDir, "bin");
  if (existsSync(sdkBin)) {
    mkdirSync(pkgBin, { recursive: true });
    const lldbNames =
      process.platform === "win32"
        ? ["lldb.exe", "lldb-dap.exe"]
        : ["lldb", "lldb-dap"];
    for (const name of lldbNames) {
      const src = join(sdkBin, name);
      if (existsSync(src)) {
        copyFileSync(src, join(pkgBin, name));
        console.error(`info: bundled ${name}`);
      }
    }
  }

  writeFileSync(
    join(pkgDir, "BUILD_INFO.json"),
    JSON.stringify(
      { platformId, llvm: sdkVersion, pinned, sdkRoot },
      null,
      2,
    ) + "\n",
  );

  try {
    validateNativeDeps(join(pkgNative, "sonite_llvm.node"), pkgLib);
    console.error("info: native dependency validation passed");
  } catch (err) {
    console.error(`error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  console.log(`built ${join(pkgNative, "sonite_llvm.node")}`);
}

main().catch((err) => {
  console.error(`error: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
