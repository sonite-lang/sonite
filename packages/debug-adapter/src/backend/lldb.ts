import { spawn, type ChildProcess } from "node:child_process";
import type { DebugProtocol } from "@vscode/debugprotocol";
import { filterStackFrames, locateLldbDap } from "../locate-lldb.js";

export interface LldbBackendOptions {
  readonly showNativeFrames?: boolean;
}

/**
 * Thin lldb-dap proxy with Sonite frame filtering on stack traces.
 */
export class LldbDapBackend {
  private child: ChildProcess | null = null;
  private seq = 1;
  private readonly pending = new Map<
    number,
  { resolve: (msg: DebugProtocol.ProtocolMessage) => void; reject: (e: Error) => void }
  >();
  private readonly eventListeners = new Set<
    (event: DebugProtocol.Event) => void
  >();
  private buffer = "";

  constructor(private readonly options: LldbBackendOptions = {}) {}

  start(): void {
    const lldbDap = locateLldbDap();
    this.child = spawn(lldbDap, [], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = this.child.stdout;
    if (!stdout) {
      throw new Error("lldb-dap stdout unavailable");
    }
    stdout.on("data", (chunk: Buffer) => {
      this.buffer += chunk.toString("utf8");
      this.drain();
    });
    this.child.on("exit", () => {
      for (const { reject } of this.pending.values()) {
        reject(new Error("lldb-dap exited"));
      }
      this.pending.clear();
    });
  }

  onEvent(listener: (event: DebugProtocol.Event) => void): void {
    this.eventListeners.add(listener);
  }

  async request<R extends DebugProtocol.Response>(
    command: string,
    args?: Record<string, unknown>,
  ): Promise<R> {
    const request: DebugProtocol.Request = {
      seq: this.seq++,
      type: "request",
      command,
      arguments: args,
    };
    return new Promise<R>((resolve, reject) => {
      this.pending.set(request.seq, {
        resolve: (msg) => resolve(msg as R),
        reject,
      });
      this.send(request);
    });
  }

  async sendLaunch(args: Record<string, unknown>): Promise<void> {
    await this.request("initialize", {
      clientID: "sonite",
      clientName: "Sonite",
      adapterID: "sonite",
      linesStartAt1: true,
      columnsStartAt1: true,
      pathFormat: "path",
      supportsVariableType: true,
      supportsVariablePaging: true,
      supportsRunInTerminalRequest: true,
    });
    await this.request("launch", args);
    await this.request("configurationDone");
  }

  async sendAttach(args: Record<string, unknown>): Promise<void> {
    await this.request("initialize", {
      clientID: "sonite",
      clientName: "Sonite",
      adapterID: "sonite",
      linesStartAt1: true,
      columnsStartAt1: true,
      pathFormat: "path",
    });
    await this.request("attach", args);
    await this.request("configurationDone");
  }

  dispose(): void {
    this.child?.kill();
    this.child = null;
  }

  private send(msg: DebugProtocol.ProtocolMessage): void {
    const stdin = this.child?.stdin;
    if (!stdin) {
      return;
    }
    const json = JSON.stringify(msg);
    stdin.write(
      `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`,
    );
  }

  private drain(): void {
    while (true) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd < 0) {
        return;
      }
      const header = this.buffer.slice(0, headerEnd);
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) {
        this.buffer = this.buffer.slice(headerEnd + 4);
        continue;
      }
      const length = Number.parseInt(match[1]!, 10);
      const bodyStart = headerEnd + 4;
      if (this.buffer.length < bodyStart + length) {
        return;
      }
      const body = this.buffer.slice(bodyStart, bodyStart + length);
      this.buffer = this.buffer.slice(bodyStart + length);
      const msg = JSON.parse(body) as DebugProtocol.ProtocolMessage;
      this.handleMessage(msg);
    }
  }

  private handleMessage(msg: DebugProtocol.ProtocolMessage): void {
    if (msg.type === "response") {
      const response = msg as DebugProtocol.Response;
      if (response.command === "stackTrace" && response.body) {
        const body = response.body as DebugProtocol.StackTraceResponse["body"];
        if (body?.stackFrames) {
          body.stackFrames = filterStackFrames(
            body.stackFrames,
            this.options.showNativeFrames === true,
          );
        }
      }
      const pending = this.pending.get(response.request_seq);
      if (pending) {
        this.pending.delete(response.request_seq);
        if (response.success) {
          pending.resolve(response);
        } else {
          pending.reject(new Error(response.message ?? "lldb-dap request failed"));
        }
      }
      return;
    }
    if (msg.type === "event") {
      for (const listener of this.eventListeners) {
        listener(msg as DebugProtocol.Event);
      }
    }
  }
}
