import {
  chmodSync,
  cpSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { spawnSync } from "node:child_process";
import {
  getBinDir,
  getGithubRepo,
  getSoniteHome,
  getToolchainsDir,
} from "../config.js";
import { CLI_VERSION } from "../version.js";

export interface SelfUpdateOptions {
  readonly version?: string;
  readonly checkOnly?: boolean;
}

interface GithubRelease {
  readonly tag_name: string;
  readonly prerelease: boolean;
  readonly assets: ReadonlyArray<{
    readonly name: string;
    readonly browser_download_url: string;
  }>;
}

function detectPlatform(): string {
  const { platform, arch } = process;
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";
  if (platform === "darwin" && arch === "x64") return "macos-x64";
  if (platform === "darwin" && arch === "arm64") return "macos-arm64";
  if (platform === "win32" && arch === "x64") return "win32-x64";
  throw new Error(
    `self-update is not supported on ${platform}-${arch}. Supported: linux-x64, linux-arm64, macos-x64, macos-arm64, win32-x64.`,
  );
}

function normalizeVersion(tagOrVersion: string): string {
  return tagOrVersion.trim().replace(/^v/, "");
}

async function fetchJson<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "sonite-self-update",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

async function resolveRelease(version?: string): Promise<{
  version: string;
  archiveUrl: string;
  shaUrl: string;
}> {
  const repo = getGithubRepo();
  const platform = detectPlatform();
  let release: GithubRelease;
  if (version) {
    const tag = `v${normalizeVersion(version)}`;
    release = await fetchJson(
      `https://api.github.com/repos/${repo}/releases/tags/${tag}`,
    );
  } else {
    release = await fetchJson(
      `https://api.github.com/repos/${repo}/releases/latest`,
    );
  }
  const ver = normalizeVersion(release.tag_name);
  const archiveName = `sonite-${ver}-${platform}.tar.gz`;
  const archive = release.assets.find((a) => a.name === archiveName);
  const sha = release.assets.find((a) => a.name === `${archiveName}.sha256`);
  if (!archive || !sha) {
    throw new Error(
      `Release ${release.tag_name} is missing ${archiveName} (and/or .sha256).`,
    );
  }
  return {
    version: ver,
    archiveUrl: archive.browser_download_url,
    shaUrl: sha.browser_download_url,
  };
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    headers: { "User-Agent": "sonite-self-update" },
  });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed ${res.status}: ${url}`);
  }
  await pipeline(res.body, createWriteStream(dest));
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function writeBinWrapper(toolchainRel: string): void {
  const binDir = getBinDir();
  mkdirSync(binDir, { recursive: true });
  if (process.platform === "win32") {
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
    const path = join(binDir, "sn");
    writeFileSync(
      path,
      `#!/usr/bin/env bash
set -euo pipefail
SONITE_HOME="$(cd "$(dirname "$0")/.." && pwd)"
exec "$SONITE_HOME/${toolchainRel}/bin/sn" "$@"
`,
      "utf8",
    );
    chmodSync(path, 0o755);
  }
}

export async function runSelfUpdate(
  options: SelfUpdateOptions = {},
): Promise<number> {
  try {
    const current = CLI_VERSION;
    const target = await resolveRelease(options.version);
    console.log(`current: ${current}`);
    console.log(`latest:  ${target.version}`);

    if (options.checkOnly) {
      if (normalizeVersion(current) === target.version) {
        console.log("already up to date");
      } else {
        console.log(`update available: ${target.version}`);
      }
      return 0;
    }

    if (normalizeVersion(current) === target.version && !options.version) {
      console.log("already up to date");
      return 0;
    }

    const home = getSoniteHome();
    const toolchains = getToolchainsDir();
    mkdirSync(toolchains, { recursive: true });

    const tmp = mkdtempSync(join(tmpdir(), "sonite-self-update-"));
    const archivePath = join(tmp, "sonite.tar.gz");
    const shaPath = join(tmp, "sonite.tar.gz.sha256");
    const extractDir = join(tmp, "extract");
    const platform = detectPlatform();
    const toolchainName = `${target.version}-${platform}`;
    const dest = join(toolchains, toolchainName);
    const destNew = `${dest}.new`;
    const destBackup = `${dest}.bak`;

    try {
      console.log(`downloading ${target.archiveUrl}`);
      await download(target.archiveUrl, archivePath);
      await download(target.shaUrl, shaPath);
      const expected = readFileSync(shaPath, "utf8").trim().split(/\s+/)[0];
      const actual = sha256File(archivePath);
      if (!expected || expected !== actual) {
        throw new Error(
          `SHA-256 mismatch (expected ${expected}, got ${actual})`,
        );
      }

      mkdirSync(extractDir, { recursive: true });
      const tarArgs =
        process.platform === "win32"
          ? ["-xzf", archivePath, "-C", extractDir]
          : ["--no-same-owner", "-xzf", archivePath, "-C", extractDir];
      const tar = spawnSync("tar", tarArgs, { stdio: "inherit" });
      if (tar.status !== 0) {
        throw new Error("failed to extract release archive");
      }

      const toolchainSrc = join(extractDir, "toolchains", toolchainName);
      if (!existsSync(toolchainSrc)) {
        // Fallback: first directory under toolchains/
        const listing = spawnSync(
          process.platform === "win32" ? "cmd" : "ls",
          process.platform === "win32"
            ? ["/c", "dir", "/b", join(extractDir, "toolchains")]
            : [join(extractDir, "toolchains")],
          { encoding: "utf8" },
        );
        throw new Error(
          `archive missing toolchains/${toolchainName}` +
            (listing.stdout ? `\nfound: ${listing.stdout}` : ""),
        );
      }

      rmSync(destNew, { recursive: true, force: true });
      mkdirSync(dirname(destNew), { recursive: true });
      // Copy extracted toolchain into place.
      const cp = spawnSync(
        process.platform === "win32" ? "xcopy" : "cp",
        process.platform === "win32"
          ? [toolchainSrc, destNew, "/E", "/I", "/H", "/Y"]
          : ["-a", `${toolchainSrc}/.`, destNew],
        { stdio: "inherit" },
      );
      if (cp.status !== 0) {
        mkdirSync(destNew, { recursive: true });
        cpSync(toolchainSrc, destNew, { recursive: true });
      }

      // Rollback-friendly swap
      rmSync(destBackup, { recursive: true, force: true });
      if (existsSync(dest)) {
        renameSync(dest, destBackup);
      }
      try {
        renameSync(destNew, dest);
      } catch (error) {
        if (existsSync(destBackup)) {
          renameSync(destBackup, dest);
        }
        throw error;
      }

      writeBinWrapper(`toolchains/${toolchainName}`);
      const metaSrc = join(extractDir, "TOOLCHAIN.json");
      if (existsSync(metaSrc)) {
        writeFileSync(join(home, "TOOLCHAIN.json"), readFileSync(metaSrc));
      }

      // Drop previous same-platform toolchains and backup.
      rmSync(destBackup, { recursive: true, force: true });
      const suffix = `-${platform}`;
      for (const name of readdirSync(toolchains)) {
        if (name.endsWith(suffix) && name !== toolchainName) {
          rmSync(join(toolchains, name), { recursive: true, force: true });
        }
      }

      console.log(`updated to ${target.version}`);
      console.log(`toolchain: ${dest}`);
      return 0;
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    return 1;
  }
}
