import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_REGISTRY_URL = "https://api-sonite.ethann.dev";

/** Root directory name under the user home (`~/.sonite`). */
export const APP_DIR_NAME = ".sonite";

export const DEFAULT_GITHUB_REPO = "ethan-davies/sonite";

export interface Credentials {
  readonly token: string;
  readonly username?: string;
}

/**
 * Sonite home directory (`~/.sonite` on all platforms).
 * Override with `SONITE_HOME`.
 */
export function getSoniteHome(): string {
  const override = process.env.SONITE_HOME?.trim();
  if (override) {
    return override;
  }
  return join(homedir(), APP_DIR_NAME);
}

/** User config directory (`~/.sonite/config`). Override with `SN_CONFIG_DIR`. */
export function getConfigDir(): string {
  const override = process.env.SN_CONFIG_DIR?.trim();
  if (override) {
    return override;
  }
  return join(getSoniteHome(), "config");
}

/**
 * Cache directory (`~/.sonite/cache`).
 * Override with `SN_CACHE_DIR`.
 */
export function getCacheDir(): string {
  const override = process.env.SN_CACHE_DIR?.trim();
  if (override) {
    return override;
  }
  return join(getSoniteHome(), "cache");
}

/** Global registry package store: `~/.sonite/config/packages`. */
export function getPackagesStoreDir(): string {
  return join(getConfigDir(), "packages");
}

/**
 * Crash report directory (`~/.sonite/crashes`).
 * Override with `SN_CRASHES_DIR`.
 */
export function getCrashesDir(): string {
  const override = process.env.SN_CRASHES_DIR?.trim();
  if (override) {
    return override;
  }
  return join(getSoniteHome(), "crashes");
}

/** Installed toolchains directory (`~/.sonite/toolchains`). */
export function getToolchainsDir(): string {
  return join(getSoniteHome(), "toolchains");
}

/** Symlink/wrapper directory (`~/.sonite/bin`). */
export function getBinDir(): string {
  return join(getSoniteHome(), "bin");
}

export function getRegistryUrl(): string {
  const override = process.env.SN_REGISTRY_URL?.trim();
  if (override) {
    return override.replace(/\/$/, "");
  }
  return DEFAULT_REGISTRY_URL;
}

/** GitHub repo used for standalone release downloads (`owner/name`). */
export function getGithubRepo(): string {
  const override = process.env.SONITE_GITHUB_REPO?.trim();
  if (override) {
    return override.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
  }
  return DEFAULT_GITHUB_REPO;
}

function credentialsPath(): string {
  return join(getConfigDir(), "credentials.json");
}

export function loadCredentials(): Credentials | null {
  const envToken = process.env.SN_REGISTRY_TOKEN?.trim();
  if (envToken) {
    const username = process.env.SN_REGISTRY_USERNAME?.trim();
    const result: Credentials = { token: envToken };
    if (username) {
      return { ...result, username };
    }
    return result;
  }
  const path = credentialsPath();
  if (!existsSync(path)) {
    return null;
  }
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
    if (
      typeof raw !== "object" ||
      raw === null ||
      typeof (raw as { token?: unknown }).token !== "string" ||
      !(raw as { token: string }).token
    ) {
      return null;
    }
    const creds = raw as { token: string; username?: unknown };
    const result: Credentials = { token: creds.token };
    if (typeof creds.username === "string" && creds.username) {
      return { ...result, username: creds.username };
    }
    return result;
  } catch {
    return null;
  }
}

export function saveCredentials(credentials: Credentials): void {
  const dir = getConfigDir();
  mkdirSync(dir, { recursive: true });
  const path = credentialsPath();
  const body: Record<string, string> = { token: credentials.token };
  if (credentials.username) {
    body.username = credentials.username;
  }
  writeFileSync(path, `${JSON.stringify(body, null, 2)}\n`, "utf8");
  try {
    chmodSync(path, 0o600);
  } catch {
    // Windows and some FS ignore mode bits.
  }
}

export function clearCredentials(): void {
  const path = credentialsPath();
  if (!existsSync(path)) {
    return;
  }
  try {
    unlinkSync(path);
  } catch {
    // Best-effort delete.
  }
}
