import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { InternalError, isInternalError } from "@sonite/compiler";
import { getDefaultTriple, hostPlatformId } from "@sonite/llvm";
import { getCrashesDir } from "./config.js";

export const ISSUE_TRACKER_URL =
  "https://github.com/ethan-davies/sonite/issues";

const COMPILER_VERSION = "0.0.0";

export type CrashKind = "compiler" | "runtime" | "native";

export interface CrashReportDocument {
  readonly id: string;
  readonly kind: CrashKind;
  readonly version: string;
  readonly platform: string;
  readonly targetTriple: string;
  readonly hostname: string;
  readonly nodeVersion: string;
  readonly phase: string;
  readonly timestamp: string;
  readonly message: string;
  readonly stack?: string;
  readonly sourcePath?: string;
  readonly signal?: string;
  readonly lastSoniteFrame?: {
    readonly file?: string;
    readonly line?: number;
    readonly column?: number;
    readonly function?: string;
  };
}

export interface CrashReportInput {
  readonly error: unknown;
  readonly phase?: string;
  readonly sourcePath?: string;
  readonly targetTriple?: string;
  readonly kind?: CrashKind;
  readonly signal?: string;
  readonly lastSoniteFrame?: CrashReportDocument["lastSoniteFrame"];
}

export interface CrashReportResult {
  readonly reportPath: string;
  readonly userMessage: string;
  readonly document: CrashReportDocument;
}

function stackOf(error: unknown): string | undefined {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }
  if (error instanceof Error && error.cause instanceof Error && error.cause.stack) {
    return error.cause.stack;
  }
  return undefined;
}

function messageOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function phaseOf(error: unknown, fallback?: string): string {
  if (isInternalError(error)) {
    return error.phase;
  }
  return fallback ?? "compiler";
}

function reportIdFromStamp(stamp: string): string {
  return stamp;
}

/**
 * Write a local crash report under `~/.sonite/crashes` (or `SN_CRASHES_DIR`).
 * Never uploads source or the report.
 */
export function writeCrashReport(input: CrashReportInput): CrashReportResult {
  const dir = getCrashesDir();
  mkdirSync(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const id = reportIdFromStamp(stamp);
  const reportPath = join(dir, `crash-${stamp}.json`);

  let platform = "unknown";
  let triple = input.targetTriple ?? "unknown";
  try {
    platform = hostPlatformId();
  } catch {
    platform = `${process.platform}-${process.arch}`;
  }
  if (!input.targetTriple) {
    try {
      triple = getDefaultTriple();
    } catch {
      // leave unknown
    }
  }

  const phase = phaseOf(input.error, input.phase);
  const message = messageOf(input.error);
  const stack = stackOf(input.error);
  const sourceLocation =
    (isInternalError(input.error) ? input.error.sourceLocation : undefined) ??
    input.sourcePath;

  const document: CrashReportDocument = {
    id,
    kind: input.kind ?? "compiler",
    version: COMPILER_VERSION,
    platform,
    targetTriple: triple,
    hostname: hostname(),
    nodeVersion: process.version,
    phase,
    timestamp: new Date().toISOString(),
    message,
    ...(stack !== undefined ? { stack } : {}),
    ...(sourceLocation !== undefined ? { sourcePath: sourceLocation } : {}),
    ...(input.signal !== undefined ? { signal: input.signal } : {}),
    ...(input.lastSoniteFrame !== undefined
      ? { lastSoniteFrame: input.lastSoniteFrame }
      : {}),
  };

  writeFileSync(reportPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");

  const userMessage = [
    "Sonite compiler encountered an internal error.",
    "",
    "This is likely a compiler bug.",
    "",
    `Version: ${COMPILER_VERSION}`,
    `Platform: ${platform}`,
    `Compiler commit: (local)`,
    "",
    "Crash report:",
    reportPath,
    "",
    `Please report this issue at: ${ISSUE_TRACKER_URL}`,
  ].join("\n");

  return { reportPath, userMessage, document };
}

/** Handle an ICE: write report, print user message, return exit code 1. */
export function reportInternalError(
  error: unknown,
  options: { readonly sourcePath?: string; readonly phase?: string } = {},
): number {
  const ice =
    error instanceof InternalError
      ? error
      : InternalError.fromUnknown(error, options.phase ?? "compiler");
  const { userMessage } = writeCrashReport({
    error: ice,
    kind: "compiler",
    ...(options.sourcePath !== undefined
      ? { sourcePath: options.sourcePath }
      : {}),
    ...(options.phase !== undefined ? { phase: options.phase } : {}),
  });
  console.error(userMessage);
  return 1;
}

export function listCrashReports(): CrashReportDocument[] {
  const dir = getCrashesDir();
  if (!existsSync(dir)) {
    return [];
  }
  const docs: CrashReportDocument[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json") && !name.endsWith(".txt")) {
      continue;
    }
    const full = join(dir, name);
    try {
      if (name.endsWith(".json")) {
        const parsed = JSON.parse(readFileSync(full, "utf8")) as CrashReportDocument;
        docs.push(parsed);
      } else {
        docs.push({
          id: name.replace(/\.txt$/, ""),
          kind: "compiler",
          version: COMPILER_VERSION,
          platform: "unknown",
          targetTriple: "unknown",
          hostname: "",
          nodeVersion: "",
          phase: "compiler",
          timestamp: statSync(full).mtime.toISOString(),
          message: readFileSync(full, "utf8").split("\n")[0] ?? name,
        });
      }
    } catch {
      // skip corrupt reports
    }
  }
  return docs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function showCrashReport(id: string): CrashReportDocument | null {
  const dir = getCrashesDir();
  if (!existsSync(dir)) {
    return null;
  }
  const jsonPath = join(dir, `crash-${id}.json`);
  if (existsSync(jsonPath)) {
    return JSON.parse(readFileSync(jsonPath, "utf8")) as CrashReportDocument;
  }
  for (const name of readdirSync(dir)) {
    if (name.includes(id)) {
      const full = join(dir, name);
      if (name.endsWith(".json")) {
        return JSON.parse(readFileSync(full, "utf8")) as CrashReportDocument;
      }
      return {
        id,
        kind: "compiler",
        version: COMPILER_VERSION,
        platform: "unknown",
        targetTriple: "unknown",
        hostname: "",
        nodeVersion: "",
        phase: "compiler",
        timestamp: statSync(full).mtime.toISOString(),
        message: readFileSync(full, "utf8"),
      };
    }
  }
  return null;
}

export function cleanCrashReports(olderThanDays?: number): number {
  const dir = getCrashesDir();
  if (!existsSync(dir)) {
    return 0;
  }
  const cutoff =
    olderThanDays !== undefined
      ? Date.now() - olderThanDays * 24 * 60 * 60 * 1000
      : undefined;
  let removed = 0;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (!st.isFile()) {
      continue;
    }
    if (cutoff !== undefined && st.mtimeMs > cutoff) {
      continue;
    }
    rmSync(full);
    removed += 1;
  }
  return removed;
}
