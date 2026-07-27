import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);

const RUNTIME_INTERNAL_PREFIXES = [
  "sn_",
  "__sn_",
  "__async",
  "sn_debug_",
];

const ASYNC_INTERNAL_SUFFIXES = ["__async__body", "__body"];

export function isSoniteInternalFrame(name: string | undefined): boolean {
  if (!name) {
    return true;
  }
  if (ASYNC_INTERNAL_SUFFIXES.some((s) => name.endsWith(s))) {
    return true;
  }
  return RUNTIME_INTERNAL_PREFIXES.some((p) => name.startsWith(p));
}

export function filterStackFrames<
  T extends { name?: string; presentationHint?: string },
>(frames: readonly T[], showNativeFrames: boolean): T[] {
  if (showNativeFrames) {
    return [...frames];
  }
  return frames.filter((f) => !isSoniteInternalFrame(f.name));
}

function platformPackageId(): string | null {
  const { platform, arch } = process;
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";
  if (platform === "darwin" && arch === "x64") return "macos-x64";
  if (platform === "darwin" && arch === "arm64") return "macos-arm64";
  if (platform === "win32" && arch === "x64") return "win32-x64";
  return null;
}

function bundledLldbDapFromPlatformPackage(): string | undefined {
  const id = platformPackageId();
  if (!id) {
    return undefined;
  }
  try {
    const pkgRoot = join(
      require.resolve(`@sonite/llvm-${id}/package.json`),
      "..",
    );
    const candidate = join(
      pkgRoot,
      "bin",
      process.platform === "win32" ? "lldb-dap.exe" : "lldb-dap",
    );
    if (existsSync(candidate)) {
      return candidate;
    }
  } catch {
    // optional package missing
  }
  return undefined;
}

export function locateLldbDap(): string {
  const env = process.env.SONITE_LLDB_DAP?.trim();
  if (env && existsSync(env)) {
    return env;
  }

  const bundled = bundledLldbDapFromPlatformPackage();
  if (bundled) {
    return bundled;
  }

  const sdk = process.env.SONITE_LLVM_SDK?.trim();
  if (sdk) {
    const candidate = join(
      sdk,
      "bin",
      process.platform === "win32" ? "lldb-dap.exe" : "lldb-dap",
    );
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  const which = spawnSync(
    process.platform === "win32" ? "where" : "which",
    ["lldb-dap"],
    { encoding: "utf8" },
  );
  if (which.status === 0) {
    const line = which.stdout.trim().split(/\r?\n/)[0]?.trim();
    if (line) {
      return line;
    }
  }

  throw new Error(
    "lldb-dap not found. Install LLDB or set SONITE_LLVM_SDK / SONITE_LLDB_DAP.",
  );
}
