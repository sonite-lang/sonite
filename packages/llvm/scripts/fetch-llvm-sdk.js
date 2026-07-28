#!/usr/bin/env node
/**
 * Download and extract the pinned LLVM SDK for a platform into the Sonite cache.
 * Override with SONITE_LLVM_SDK to use an existing extracted tree.
 */
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  cpSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const meta = require("./llvm-version.json");

const scriptsDir = dirname(fileURLToPath(import.meta.url));

export function getCacheDir() {
  if (process.env.SN_CACHE_DIR?.trim()) {
    return process.env.SN_CACHE_DIR.trim();
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Caches", "sonite");
  }
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA?.trim();
    return join(local || join(homedir(), "AppData", "Local"), "sonite", "Cache");
  }
  const xdg = process.env.XDG_CACHE_HOME?.trim();
  return join(xdg || join(homedir(), ".cache"), "sonite");
}

export function hostPlatformId() {
  const { platform, arch } = process;
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";
  if (platform === "darwin" && arch === "x64") return "macos-x64";
  if (platform === "darwin" && arch === "arm64") return "macos-arm64";
  if (platform === "win32" && arch === "x64") return "win32-x64";
  if (platform === "win32" && arch === "arm64") return "win32-arm64";
  throw new Error(`unsupported host platform: ${platform}/${arch}`);
}

export function sdkCacheRoot(platformId = hostPlatformId()) {
  return join(
    getCacheDir(),
    `llvm-sdk-${meta.version}-${platformId}`,
  );
}

function looksLikeSdk(root) {
  const config = join(root, "bin", process.platform === "win32" ? "llvm-config.exe" : "llvm-config");
  const include = join(root, "include", "llvm-c", "Core.h");
  return existsSync(config) || existsSync(include);
}

function findExtractedRoot(staging) {
  if (looksLikeSdk(staging)) return staging;
  for (const entry of readdirSync(staging)) {
    const full = join(staging, entry);
    if (statSync(full).isDirectory() && looksLikeSdk(full)) {
      return full;
    }
  }
  return null;
}

async function downloadFile(url, dest) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) {
    throw new Error(
      `failed to download LLVM SDK: HTTP ${response.status} ${response.statusText}`,
    );
  }
  const total = Number(response.headers.get("content-length") ?? 0);
  let received = 0;
  let lastPct = -1;
  const nodeStream = Readable.fromWeb(
    /** @type {import('node:stream/web').ReadableStream} */ (response.body),
  );
  nodeStream.on("data", (chunk) => {
    received +=
      typeof chunk === "string" ? Buffer.byteLength(chunk) : chunk.length;
    if (total > 0) {
      const pct = Math.floor((received / total) * 100);
      if (pct !== lastPct && pct % 5 === 0) {
        lastPct = pct;
        console.error(`info: download ${pct}%`);
      }
    }
  });
  await pipeline(nodeStream, createWriteStream(dest));
}

function extractArchive(archivePath, destDir) {
  const result = spawnSync("tar", ["-xJf", archivePath, "-C", destDir], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `failed to extract LLVM SDK: ${result.stderr || result.stdout || "unknown"}`,
    );
  }
}

function brewPrefix(formula) {
  const r = spawnSync("brew", ["--prefix", formula], { encoding: "utf8" });
  if (r.status !== 0) {
    return null;
  }
  const prefix = r.stdout.trim();
  return prefix && existsSync(prefix) ? prefix : null;
}

function majorMinor(v) {
  const parts = String(v).split(".");
  return `${parts[0]}.${parts[1]}`;
}

function linkInto(destDir, srcPath) {
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, basename(srcPath));
  rmSync(dest, { recursive: true, force: true });
  try {
    symlinkSync(srcPath, dest);
  } catch {
    cpSync(srcPath, dest, { recursive: true, dereference: true });
  }
}

/**
 * Upstream LLVM 20+ dropped official macOS-X64 tarballs. Materialize a cache
 * SDK from Homebrew `llvm` (+ `lld`) bottles at the pinned major.minor.
 */
function ensureHomebrewSdk(platformId, asset) {
  const formula = asset.formula || "llvm";
  const lldFormula = asset.lldFormula || "lld";
  console.error(
    `info: ${platformId} has no official LLVM tarball; resolving via Homebrew ${formula}…`,
  );

  let llvmPrefix = brewPrefix(formula);
  if (!llvmPrefix) {
    console.error(`info: brew install ${formula} ${lldFormula}…`);
    const install = spawnSync(
      "brew",
      ["install", formula, lldFormula],
      { stdio: "inherit", env: process.env },
    );
    if (install.status !== 0) {
      throw new Error(
        `Homebrew install of ${formula}/${lldFormula} failed. On Intel Macs install manually: brew install llvm lld`,
      );
    }
    llvmPrefix = brewPrefix(formula);
  }
  if (!llvmPrefix) {
    throw new Error(
      `Homebrew ${formula} not found. Install with: brew install ${formula} ${lldFormula}`,
    );
  }

  const llvmConfig = join(llvmPrefix, "bin", "llvm-config");
  if (!existsSync(llvmConfig)) {
    throw new Error(`Homebrew ${formula} is missing bin/llvm-config at ${llvmPrefix}`);
  }
  const ver = spawnSync(llvmConfig, ["--version"], { encoding: "utf8" });
  if (ver.status !== 0) {
    throw new Error(`llvm-config --version failed: ${ver.stderr || ver.stdout}`);
  }
  const found = ver.stdout.trim();
  if (majorMinor(found) !== majorMinor(meta.version)) {
    throw new Error(
      `Homebrew LLVM version ${found} is incompatible; Sonite requires ${meta.version} (major.minor). Try: brew upgrade ${formula}`,
    );
  }

  const lldPrefix = brewPrefix(lldFormula);
  const cacheRoot = sdkCacheRoot(platformId);
  const marker = join(cacheRoot, ".sonite-sdk-source");
  if (
    looksLikeSdk(cacheRoot) &&
    existsSync(marker) &&
    readFileSync(marker, "utf8").includes(`homebrew:${found}`)
  ) {
    console.error(`info: reusing Homebrew-backed SDK cache at ${cacheRoot}`);
    return cacheRoot;
  }

  console.error(`info: materializing Homebrew SDK cache at ${cacheRoot}`);
  rmSync(cacheRoot, { recursive: true, force: true });
  mkdirSync(join(cacheRoot, "bin"), { recursive: true });
  mkdirSync(join(cacheRoot, "lib"), { recursive: true });

  linkInto(join(cacheRoot, "bin"), llvmConfig);
  // Prefer a real include tree (llvm-config --includedir).
  const includeDir = spawnSync(llvmConfig, ["--includedir"], {
    encoding: "utf8",
  }).stdout.trim();
  if (includeDir && existsSync(includeDir)) {
    const destInclude = join(cacheRoot, "include");
    rmSync(destInclude, { recursive: true, force: true });
    try {
      symlinkSync(includeDir, destInclude);
    } catch {
      mkdirSync(destInclude, { recursive: true });
      cpSync(includeDir, destInclude, { recursive: true, dereference: true });
    }
  } else if (existsSync(join(llvmPrefix, "include"))) {
    linkInto(cacheRoot, join(llvmPrefix, "include"));
  }

  const libDirs = [join(llvmPrefix, "lib")];
  if (lldPrefix) {
    libDirs.push(join(lldPrefix, "lib"));
  }
  const wanted = (name) =>
    /^(libLLVM|liblld)/.test(name) &&
    (name.includes(".dylib") || name.includes(".so") || name.endsWith(".a"));

  for (const libDir of libDirs) {
    if (!existsSync(libDir)) continue;
    for (const entry of readdirSync(libDir)) {
      if (!wanted(entry)) continue;
      linkInto(join(cacheRoot, "lib"), join(libDir, entry));
    }
  }

  writeFileSync(
    marker,
    `homebrew:${found}\nformula=${formula}\nllvmPrefix=${llvmPrefix}\nlldPrefix=${lldPrefix || ""}\n`,
  );

  if (!looksLikeSdk(cacheRoot)) {
    throw new Error(`Homebrew SDK materialization incomplete at ${cacheRoot}`);
  }
  console.error(`info: LLVM SDK ready at ${cacheRoot} (Homebrew ${found})`);
  return cacheRoot;
}

/**
 * Ensure the pinned LLVM SDK is available; return its root path.
 */
export async function ensureLlvmSdk(platformId = hostPlatformId()) {
  const override = process.env.SONITE_LLVM_SDK?.trim();
  if (override) {
    if (!looksLikeSdk(override)) {
      throw new Error(
        `SONITE_LLVM_SDK=${override} does not look like an LLVM ${meta.version} SDK`,
      );
    }
    return override;
  }

  const asset = meta.assets[platformId];
  if (!asset) {
    throw new Error(`no LLVM SDK asset mapped for platform ${platformId}`);
  }

  if (asset.source === "homebrew") {
    return ensureHomebrewSdk(platformId, asset);
  }

  const cacheRoot = sdkCacheRoot(platformId);
  if (looksLikeSdk(cacheRoot)) {
    return cacheRoot;
  }

  if (!asset.url || !asset.fileName) {
    throw new Error(
      `LLVM SDK asset for ${platformId} is missing url/fileName (and is not a homebrew source)`,
    );
  }

  mkdirSync(dirname(cacheRoot), { recursive: true });
  const staging = join(
    tmpdir(),
    `sn-llvm-sdk-${meta.version}-${platformId}-${process.pid}`,
  );
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });
  const archivePath = join(staging, asset.fileName);

  console.error(
    `info: downloading LLVM ${meta.version} SDK for ${platformId}…`,
  );
  console.error(`info: ${asset.url}`);
  console.error(`info: caching under ${cacheRoot}`);

  try {
    await downloadFile(asset.url, archivePath);
    extractArchive(archivePath, staging);
    const extracted = findExtractedRoot(staging);
    if (!extracted) {
      throw new Error("extracted LLVM archive but could not find SDK root");
    }
    rmSync(cacheRoot, { recursive: true, force: true });
    mkdirSync(dirname(cacheRoot), { recursive: true });
    // cpSync handles cross-device moves (rename can throw EXDEV).
    cpSync(extracted, cacheRoot, { recursive: true, dereference: true });
    rmSync(extracted, { recursive: true, force: true });
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }

  if (!looksLikeSdk(cacheRoot)) {
    throw new Error(`LLVM SDK install incomplete at ${cacheRoot}`);
  }
  console.error(`info: LLVM SDK ready at ${cacheRoot}`);
  return cacheRoot;
}

// CLI: node fetch-llvm-sdk.js [platformId]
if (process.argv[1] && process.argv[1].includes("fetch-llvm-sdk")) {
  const id = process.argv[2] || hostPlatformId();
  ensureLlvmSdk(id)
    .then((root) => {
      console.log(root);
    })
    .catch((err) => {
      console.error(`error: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    });
}
