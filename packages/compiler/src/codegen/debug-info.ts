import type { SourceSpan } from "../diagnostics/diagnostic.js";
import { basename, dirname, relative } from "node:path";

export interface DebugInfoOptions {
  /** Project root used to emit project-relative paths in DIFile. */
  readonly sourceRoot?: string;
  readonly isOptimized?: boolean;
  /** When true, add CodeView module flag (Windows COFF targets). */
  readonly emitCodeView?: boolean;
}

/**
 * Allocates LLVM metadata node IDs and formats DWARF-ish debug info as textual IR.
 * Consumed by string-based codegen (parsed via LLVMParseIR).
 */
export class DebugInfoBuilder {
  private nextId = 0;
  private readonly nodes: string[] = [];
  private compileUnitId: number | null = null;
  private fileIds = new Map<string, number>();
  private readonly typeIds = new Map<string, number>();
  private readonly emptyExprId: number;
  private voidTypeId: number | null = null;

  constructor(private readonly options: DebugInfoOptions = {}) {
    this.emptyExprId = this.alloc(`!{}`);
  }

  private alloc(body: string): number {
    const id = this.nextId;
    this.nextId += 1;
    this.nodes.push(`!${id} = ${body}`);
    return id;
  }

  private ensureVoidType(): number {
    if (this.voidTypeId === null) {
      this.voidTypeId = this.alloc(
        `!DIBasicType(name: "void", size: 0, encoding: DW_ATE_address, flags: DIFlagPublic)`,
      );
    }
    return this.voidTypeId;
  }

  /** Normalize and optionally relativize a source path for stable DIFile paths. */
  normalizePath(sourcePath: string): string {
    const normalized = sourcePath.replace(/\\/g, "/");
    const root = this.options.sourceRoot?.replace(/\\/g, "/").replace(/\/$/, "");
    if (!root || normalized === "<source>") {
      return normalized;
    }
    if (normalized.startsWith(`${root}/`)) {
      return normalized.slice(root.length + 1);
    }
    if (normalized.startsWith(root)) {
      return normalized.slice(root.length).replace(/^\//, "");
    }
    return normalized;
  }

  /** Ensure a compile unit exists for the primary source file. */
  ensureCompileUnit(sourcePath: string): number {
    if (this.compileUnitId !== null) {
      return this.compileUnitId;
    }
    const fileId = this.file(sourcePath);
    const empty = this.emptyExprId;
    const optimized = this.options.isOptimized === true;
    this.compileUnitId = this.alloc(
      `distinct !DICompileUnit(language: DW_LANG_C_plus_plus, file: !${fileId}, producer: "sonite", isOptimized: ${optimized}, runtimeVersion: 0, emissionKind: FullDebug, enums: !${empty})`,
    );
    return this.compileUnitId;
  }

  file(sourcePath: string): number {
    const normalized = this.normalizePath(sourcePath);
    const existing = this.fileIds.get(normalized);
    if (existing !== undefined) {
      return existing;
    }
    const fileName = basename(normalized) || "sonite";
    const directory = dirname(normalized);
    const dir =
      directory === "." || directory === ""
        ? ""
        : directory === "/"
          ? "/"
          : directory;
    const id = this.alloc(
      `!DIFile(filename: ${llvmQuote(fileName)}, directory: ${llvmQuote(dir)})`,
    );
    this.fileIds.set(normalized, id);
    return id;
  }

  basicType(name: string, size: number, encoding: string): number {
    const key = `basic:${name}:${size}:${encoding}`;
    const cached = this.typeIds.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const id = this.alloc(
      `!DIBasicType(name: ${llvmQuote(name)}, size: ${size}, encoding: ${encoding}, flags: DIFlagPublic)`,
    );
    this.typeIds.set(key, id);
    return id;
  }

  pointerType(pointeeId: number, size = 64): number {
    const key = `ptr:${pointeeId}:${size}`;
    const cached = this.typeIds.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const id = this.alloc(
      `!DIDerivedType(tag: DW_TAG_pointer_type, baseType: !${pointeeId}, size: ${size}, flags: DIFlagPublic)`,
    );
    this.typeIds.set(key, id);
    return id;
  }

  compositeType(
    name: string,
    tag: "DW_TAG_structure_type" | "DW_TAG_class_type" | "DW_TAG_enumeration_type",
    size: number,
    memberIds: number[],
  ): number {
    const key = `composite:${tag}:${name}:${size}:${memberIds.join(",")}`;
    const cached = this.typeIds.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const members = memberIds.length > 0 ? memberIds.join(", ") : "";
    const elements =
      memberIds.length > 0
        ? `, elements: !${this.alloc(`!{${members}}`)}`
        : `, elements: !${this.emptyExprId}`;
    const id = this.alloc(
      `!DICompositeType(tag: ${tag}, name: ${llvmQuote(name)}, size: ${size}, flags: DIFlagPublic${elements})`,
    );
    this.typeIds.set(key, id);
    return id;
  }

  memberType(
    name: string,
    typeId: number,
    offset: number,
    parentScope: number,
  ): number {
    return this.alloc(
      `!DIDerivedType(tag: DW_TAG_member, name: ${llvmQuote(name)}, scope: !${parentScope}, baseType: !${typeId}, size: 0, offset: ${offset}, flags: DIFlagPublic)`,
    );
  }

  /** Map a Sonite/LLVM type name to a DI type node (pragmatic subset). */
  soniteType(typeName: string): number {
    const key = `sonite:${typeName}`;
    const cached = this.typeIds.get(key);
    if (cached !== undefined) {
      return cached;
    }
    let id: number;
    switch (typeName) {
      case "void":
        id = this.ensureVoidType();
        break;
      case "bool":
        id = this.basicType("bool", 8, "DW_ATE_boolean");
        break;
      case "char":
        id = this.basicType("char", 8, "DW_ATE_signed_char");
        break;
      case "i8":
      case "u8":
        id = this.basicType(typeName, 8, "DW_ATE_unsigned_char");
        break;
      case "i16":
      case "u16":
        id = this.basicType(typeName, 16, "DW_ATE_signed");
        break;
      case "i32":
      case "u32":
        id = this.basicType(typeName, 32, "DW_ATE_signed");
        break;
      case "i64":
      case "u64":
      case "isize":
      case "usize":
        id = this.basicType(typeName, 64, "DW_ATE_signed");
        break;
      case "f32":
        id = this.basicType("f32", 32, "DW_ATE_float");
        break;
      case "f64":
        id = this.basicType("f64", 64, "DW_ATE_float");
        break;
      case "string":
        id = this.pointerType(this.basicType("char", 8, "DW_ATE_signed_char"));
        break;
      default:
        if (typeName.endsWith("[]")) {
          const elem = typeName.slice(0, -2);
          id = this.pointerType(this.soniteType(elem));
        } else {
          id = this.pointerType(this.basicType("opaque", 64, "DW_ATE_address"));
        }
        break;
    }
    this.typeIds.set(key, id);
    return id;
  }

  subprogram(
    name: string,
    sourcePath: string,
    line: number,
    options: {
      readonly linkageName?: string;
      readonly returnTypeName?: string;
      readonly isDefinition?: boolean;
    } = {},
  ): number {
    const cu = this.ensureCompileUnit(sourcePath);
    const fileId = this.file(sourcePath);
    const retName = options.returnTypeName ?? "void";
    const retTypeId =
      retName === "void"
        ? this.ensureVoidType()
        : this.soniteType(retName);
    const paramTypes: number[] = [retTypeId];
    const typeListId =
      paramTypes.length > 0
        ? this.alloc(`!{${paramTypes.map((t) => `!${t}`).join(", ")}}`)
        : this.emptyExprId;
    const typeId = this.alloc(`!DISubroutineType(types: !${typeListId})`);
    const linkage =
      options.linkageName && options.linkageName !== name
        ? `, linkageName: ${llvmQuote(options.linkageName)}`
        : "";
    const flags = options.isDefinition === false ? "DISPFlagPrototyped" : "DISPFlagDefinition";
    return this.alloc(
      `distinct !DISubprogram(name: ${llvmQuote(name)}, scope: !${fileId}, file: !${fileId}, line: ${Math.max(1, line)}, type: !${typeId}, scopeLine: ${Math.max(1, line)}, spFlags: ${flags}${linkage}, unit: !${cu})`,
    );
  }

  lexicalBlock(
    parentScope: number,
    sourcePath: string,
    span: SourceSpan,
  ): number {
    const fileId = this.file(sourcePath);
    return this.alloc(
      `distinct !DILexicalBlock(scope: !${parentScope}, file: !${fileId}, line: ${span.start.line}, column: ${span.start.column})`,
    );
  }

  location(scope: number, span: SourceSpan): number {
    return this.alloc(
      `!DILocation(line: ${span.start.line}, column: ${span.start.column}, scope: !${scope})`,
    );
  }

  localVariable(
    name: string,
    scope: number,
    sourcePath: string,
    line: number,
    typeName: string,
    options: { readonly arg?: number; readonly isParameter?: boolean } = {},
  ): number {
    const fileId = this.file(sourcePath);
    const typeId = this.soniteType(typeName);
    const argPart =
      options.arg !== undefined
        ? `, arg: ${options.arg}`
        : options.isParameter
          ? `, arg: 1`
          : "";
    return this.alloc(
      `!DILocalVariable(name: ${llvmQuote(name)}, scope: !${scope}, file: !${fileId}, line: ${Math.max(1, line)}, type: !${typeId}${argPart})`,
    );
  }

  /** Attach `!dbg !N` to an alloca line for a local variable. */
  attachLocalDbg(allocaLine: string, varId: number): string {
    if (allocaLine.includes("!dbg ")) {
      return allocaLine;
    }
    return allocaLine.replace(
      /^(.*alloca[^;]*)(.*)$/,
      `$1, !dbg !${varId}$2`,
    );
  }

  /** Module-level named metadata + all DI nodes. */
  emitFooter(): string[] {
    if (this.compileUnitId === null) {
      return [];
    }
    const dwarfFlag = this.alloc(`!{i32 7, !"Dwarf Version", i32 4}`);
    const diFlag = this.alloc(`!{i32 2, !"Debug Info Version", i32 3}`);
    const wcharFlag = this.alloc(`!{i32 1, !"wchar_size", i32 4}`);
    const ident = this.alloc(`!{!"sonite"}`);
    const flags: string[] = [`!${dwarfFlag}`, `!${diFlag}`, `!${wcharFlag}`];
    if (this.options.emitCodeView) {
      const cvFlag = this.alloc(`!{i32 2, !"CodeView", i32 1}`);
      flags.push(`!${cvFlag}`);
    }
    return [
      "",
      `!llvm.dbg.cu = !{!${this.compileUnitId}}`,
      `!llvm.module.flags = !{${flags.join(", ")}}`,
      `!llvm.ident = !{!${ident}}`,
      "",
      ...this.nodes,
    ];
  }

  get enabled(): boolean {
    return true;
  }
}

function llvmQuote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Attach `!dbg !N` to an LLVM instruction line when missing. */
export function attachDbg(line: string, dbgId: number): string {
  if (!line || line.includes("!dbg ") || !/^\s+/.test(line)) {
    return line;
  }
  if (/^\s+[A-Za-z0-9_.]+:\s*$/.test(line) || /^\s*;/.test(line)) {
    return line;
  }
  const trimmed = line.trimStart();
  if (
    !(
      trimmed.startsWith("%") ||
      trimmed.startsWith("store ") ||
      trimmed.startsWith("call ") ||
      trimmed.startsWith("invoke ") ||
      trimmed.startsWith("br ") ||
      trimmed.startsWith("ret ") ||
      trimmed.startsWith("unreachable") ||
      trimmed.startsWith("switch ") ||
      trimmed.startsWith("indirectbr ") ||
      trimmed.startsWith("resume ") ||
      trimmed.startsWith("landingpad ") ||
      trimmed.startsWith("fence ") ||
      trimmed.startsWith("atomicrmw ") ||
      trimmed.startsWith("cmpxchg ")
    )
  ) {
    return line;
  }
  const commentIdx = line.indexOf(";");
  if (commentIdx >= 0) {
    const code = line.slice(0, commentIdx).trimEnd();
    const comment = line.slice(commentIdx);
    return `${code}, !dbg !${dbgId} ${comment}`;
  }
  return `${line.trimEnd()}, !dbg !${dbgId}`;
}

export function attachDbgToDefine(header: string, subprogramId: number): string {
  if (header.includes("!dbg ")) {
    return header;
  }
  return header.replace(/\s*\{\s*$/, ` !dbg !${subprogramId} {`);
}

/** Relativize path against project root for runtime frame strings. */
export function relativizeSourcePath(
  sourcePath: string,
  sourceRoot?: string,
): string {
  const normalized = sourcePath.replace(/\\/g, "/");
  const root = sourceRoot?.replace(/\\/g, "/").replace(/\/$/, "");
  if (!root || normalized === "<source>") {
    return normalized;
  }
  try {
    return relative(root, normalized).replace(/\\/g, "/");
  } catch {
    return normalized;
  }
}
