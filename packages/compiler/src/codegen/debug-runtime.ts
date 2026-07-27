import type { SourceSpan } from "../diagnostics/diagnostic.js";
import type { ValueType } from "../typecheck.js";
import { relativizeSourcePath } from "./debug-info.js";

export function debugTypeName(type: ValueType): string {
  if (typeof type === "string") {
    return type;
  }
  switch (type.kind) {
    case "array":
      return `${debugTypeName(type.element)}[]`;
    case "class":
      return type.name;
    case "struct":
      return type.name;
    case "enum":
      return type.name;
    case "interface":
      return type.name;
    case "function":
      return "function";
    case "tuple":
      return "tuple";
    case "future":
      return type.inner === "void" ? "Future<void>" : `Future<${debugTypeName(type.inner as ValueType)}>`;
    case "ptr":
      return "ptr";
    case "fnptr":
      return "fnptr";
    default:
      return "opaque";
  }
}

export interface DebugFrameEmit {
  readonly fileGlobal: string;
  readonly fileGlobalLen: number;
  readonly funcGlobal: string;
  readonly funcGlobalLen: number;
  readonly line: number;
  readonly column: number;
}

export function buildDebugFrameEmit(
  sourcePath: string,
  sourceRoot: string | undefined,
  functionName: string,
  span: SourceSpan,
  internString: (value: string) => { name: string; length: number },
): DebugFrameEmit {
  const relFile = relativizeSourcePath(sourcePath, sourceRoot);
  const file = internString(relFile);
  const func = internString(functionName);
  return {
    fileGlobal: file.name,
    fileGlobalLen: file.length,
    funcGlobal: func.name,
    funcGlobalLen: func.length,
    line: span.start.line,
    column: span.start.column,
  };
}

export function emitDebugPushLines(
  lines: string[],
  frame: DebugFrameEmit,
): void {
  lines.push(
    `  call void @sn_debug_push_frame(ptr noundef getelementptr inbounds ([${frame.fileGlobalLen} x i8], ptr @${frame.fileGlobal}, i64 0, i64 0), i32 noundef ${frame.line}, i32 noundef ${frame.column}, ptr noundef getelementptr inbounds ([${frame.funcGlobalLen} x i8], ptr @${frame.funcGlobal}, i64 0, i64 0))`,
  );
}

export function emitDebugPopLine(lines: string[]): void {
  lines.push(`  call void @sn_debug_pop_frame()`);
}

export const DEBUG_RUNTIME_DECLARES = [
  "declare void @sn_debug_push_frame(ptr noundef, i32 noundef, i32 noundef, ptr noundef) nounwind",
  "declare void @sn_debug_pop_frame() nounwind",
  "declare void @sn_panic(ptr noundef, ptr noundef, ptr noundef, i32 noundef, i32 noundef) noreturn nounwind",
  "declare void @sn_panic_bounds(ptr noundef, i32 noundef, i32 noundef, i64 noundef, i64 noundef) noreturn nounwind",
  "declare void @sn_error_attach_stack(ptr noundef, ptr noundef) nounwind",
  "declare ptr @sn_error_capture_stack_text(i32 noundef) nounwind",
] as const;

export function emitBoundsCheck(
  lines: string[],
  indexI32: string,
  lengthI32: string,
  span: SourceSpan,
  sourcePath: string,
  sourceRoot: string | undefined,
  internString: (value: string) => { name: string; length: number },
  nextLabel: (prefix: string) => string,
  nextTemp: () => string,
): string {
  const checkLt = nextLabel("bounds_lt");
  const okLabel = nextLabel("bounds_ok");
  const failLabel = nextLabel("bounds_fail");
  const ge0 = nextTemp();
  lines.push(`  ${ge0} = icmp sge i32 ${indexI32}, 0`);
  lines.push(`  br i1 ${ge0}, label %${checkLt}, label %${failLabel}`);
  lines.push(`${checkLt}:`);
  const lt = nextTemp();
  lines.push(`  ${lt} = icmp slt i32 ${indexI32}, ${lengthI32}`);
  lines.push(`  br i1 ${lt}, label %${okLabel}, label %${failLabel}`);
  lines.push(`${failLabel}:`);
  const rel = relativizeSourcePath(sourcePath, sourceRoot);
  const file = internString(rel);
  const idx64 = nextTemp();
  lines.push(`  ${idx64} = sext i32 ${indexI32} to i64`);
  const len64 = nextTemp();
  lines.push(`  ${len64} = sext i32 ${lengthI32} to i64`);
  lines.push(
    `  call void @sn_panic_bounds(ptr noundef getelementptr inbounds ([${file.length} x i8], ptr @${file.name}, i64 0, i64 0), i32 noundef ${span.start.line}, i32 noundef ${span.start.column}, i64 noundef ${idx64}, i64 noundef ${len64})`,
  );
  lines.push(`  unreachable`);
  lines.push(`${okLabel}:`);
  return okLabel;
}
