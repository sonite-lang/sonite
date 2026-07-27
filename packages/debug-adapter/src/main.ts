import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import {
  DebugSession,
  InitializedEvent,
  TerminatedEvent,
  OutputEvent,
} from "@vscode/debugadapter";
import type { DebugProtocol } from "@vscode/debugprotocol";
import { LldbDapBackend } from "./backend/lldb.js";

export interface SoniteLaunchArgs extends DebugProtocol.LaunchRequestArguments {
  program: string;
  cwd?: string;
  args?: string[];
  env?: Record<string, string>;
  profile?: string;
  buildBeforeLaunch?: boolean;
  showNativeFrames?: boolean;
}

export interface SoniteAttachArgs extends DebugProtocol.AttachRequestArguments {
  processId?: number;
  showNativeFrames?: boolean;
}

function runBuild(cwd: string, profile: string): void {
  const sn = process.env.SONITE_CLI?.trim() || "sn";
  const result = spawnSync(sn, ["build", "--profile", profile], {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "sn build failed");
  }
}

function resolveBinary(program: string, profile: string): string {
  const abs = resolve(program);
  const cwd = dirname(abs);
  const projectName = basename(cwd) || "app";
  if (abs.endsWith(".sn")) {
    return join(cwd, "build", profile, projectName);
  }
  return abs;
}

export class SoniteDebugSession extends DebugSession {
  private backend: LldbDapBackend | null = null;

  protected override initializeRequest(
    response: DebugProtocol.InitializeResponse,
    _args: DebugProtocol.InitializeRequestArguments,
  ): void {
    response.body = response.body ?? {};
    response.body.supportsConfigurationDoneRequest = true;
    response.body.supportsConditionalBreakpoints = true;
    response.body.supportsEvaluateForHovers = true;
    response.body.supportsSetVariable = false;
    response.body.exceptionBreakpointFilters = [
      {
        filter: "uncaught",
        label: "Uncaught Sonite exceptions",
        default: true,
      },
    ];
    this.sendResponse(response);
    this.sendEvent(new InitializedEvent());
  }

  protected override launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: DebugProtocol.LaunchRequestArguments,
  ): void {
    void this.handleLaunch(response, args as SoniteLaunchArgs);
  }

  private async handleLaunch(
    response: DebugProtocol.LaunchResponse,
    args: SoniteLaunchArgs,
  ): Promise<void> {
    try {
      const profile = args.profile ?? "debug";
      const cwd = args.cwd ? resolve(args.cwd) : dirname(resolve(args.program));
      if (args.buildBeforeLaunch !== false) {
        runBuild(cwd, profile);
      }
      const binary = resolveBinary(args.program, profile);
      if (!existsSync(binary)) {
        throw new Error(`Debug binary not found: ${binary}`);
      }

      this.backend = new LldbDapBackend({
        ...(args.showNativeFrames ? { showNativeFrames: true } : {}),
      });
      this.backend.onEvent((event) => {
        if (event.event === "output" && event.body) {
          const output = (event.body as { output?: string }).output ?? "";
          this.sendEvent(new OutputEvent(output));
        }
        this.sendEvent(event as never);
      });
      this.backend.start();
      await this.backend.sendLaunch({
        program: binary,
        cwd,
        args: args.args ?? [],
        env: args.env,
      });
      this.sendResponse(response);
    } catch (error) {
      this.sendErrorResponse(response, 1, String(error));
    }
  }

  protected override attachRequest(
    response: DebugProtocol.AttachResponse,
    args: DebugProtocol.AttachRequestArguments,
  ): void {
    void this.handleAttach(response, args as SoniteAttachArgs);
  }

  private async handleAttach(
    response: DebugProtocol.AttachResponse,
    args: SoniteAttachArgs,
  ): Promise<void> {
    try {
      if (!args.processId) {
        throw new Error("processId is required for attach");
      }
      this.backend = new LldbDapBackend({
        ...(args.showNativeFrames ? { showNativeFrames: true } : {}),
      });
      this.backend.onEvent((event) => this.sendEvent(event as never));
      this.backend.start();
      await this.backend.sendAttach({ pid: args.processId });
      this.sendResponse(response);
    } catch (error) {
      this.sendErrorResponse(response, 1, String(error));
    }
  }

  protected override async setBreakPointsRequest(
    response: DebugProtocol.SetBreakpointsResponse,
    args: DebugProtocol.SetBreakpointsArguments,
  ): Promise<void> {
    if (!this.backend) {
      this.sendErrorResponse(response, 1, "Not connected");
      return;
    }
    const res = await this.backend.request<DebugProtocol.SetBreakpointsResponse>(
      "setBreakpoints",
      args as unknown as Record<string, unknown>,
    );
    response.body = res.body;
    this.sendResponse(response);
  }

  protected override async threadsRequest(
    response: DebugProtocol.ThreadsResponse,
  ): Promise<void> {
    if (!this.backend) {
      this.sendErrorResponse(response, 1, "Not connected");
      return;
    }
    const res = await this.backend.request<DebugProtocol.ThreadsResponse>("threads");
    response.body = res.body;
    this.sendResponse(response);
  }

  protected override async stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments,
  ): Promise<void> {
    if (!this.backend) {
      this.sendErrorResponse(response, 1, "Not connected");
      return;
    }
    const res = await this.backend.request<DebugProtocol.StackTraceResponse>(
      "stackTrace",
      args as unknown as Record<string, unknown>,
    );
    response.body = res.body;
    this.sendResponse(response);
  }

  protected override async scopesRequest(
    response: DebugProtocol.ScopesResponse,
    args: DebugProtocol.ScopesArguments,
  ): Promise<void> {
    if (!this.backend) {
      this.sendErrorResponse(response, 1, "Not connected");
      return;
    }
    const res = await this.backend.request<DebugProtocol.ScopesResponse>(
      "scopes",
      args as unknown as Record<string, unknown>,
    );
    response.body = res.body;
    this.sendResponse(response);
  }

  protected override async variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments,
  ): Promise<void> {
    if (!this.backend) {
      this.sendErrorResponse(response, 1, "Not connected");
      return;
    }
    const res = await this.backend.request<DebugProtocol.VariablesResponse>(
      "variables",
      args as unknown as Record<string, unknown>,
    );
    response.body = res.body;
    this.sendResponse(response);
  }

  protected override async continueRequest(
    response: DebugProtocol.ContinueResponse,
    args: DebugProtocol.ContinueArguments,
  ): Promise<void> {
    if (!this.backend) {
      this.sendErrorResponse(response, 1, "Not connected");
      return;
    }
    const res = await this.backend.request<DebugProtocol.ContinueResponse>(
      "continue",
      args as unknown as Record<string, unknown>,
    );
    response.body = res.body;
    this.sendResponse(response);
  }

  protected override async nextRequest(
    response: DebugProtocol.NextResponse,
    args: DebugProtocol.NextArguments,
  ): Promise<void> {
    if (!this.backend) {
      this.sendErrorResponse(response, 1, "Not connected");
      return;
    }
    const res = await this.backend.request<DebugProtocol.NextResponse>(
      "next",
      args as unknown as Record<string, unknown>,
    );
    response.body = res.body;
    this.sendResponse(response);
  }

  protected override async stepInRequest(
    response: DebugProtocol.StepInResponse,
    args: DebugProtocol.StepInArguments,
  ): Promise<void> {
    if (!this.backend) {
      this.sendErrorResponse(response, 1, "Not connected");
      return;
    }
    const res = await this.backend.request<DebugProtocol.StepInResponse>(
      "stepIn",
      args as unknown as Record<string, unknown>,
    );
    response.body = res.body;
    this.sendResponse(response);
  }

  protected override async stepOutRequest(
    response: DebugProtocol.StepOutResponse,
    args: DebugProtocol.StepOutArguments,
  ): Promise<void> {
    if (!this.backend) {
      this.sendErrorResponse(response, 1, "Not connected");
      return;
    }
    const res = await this.backend.request<DebugProtocol.StepOutResponse>(
      "stepOut",
      args as unknown as Record<string, unknown>,
    );
    response.body = res.body;
    this.sendResponse(response);
  }

  protected override async pauseRequest(
    response: DebugProtocol.PauseResponse,
    args: DebugProtocol.PauseArguments,
  ): Promise<void> {
    if (!this.backend) {
      this.sendErrorResponse(response, 1, "Not connected");
      return;
    }
    const res = await this.backend.request<DebugProtocol.PauseResponse>(
      "pause",
      args as unknown as Record<string, unknown>,
    );
    response.body = res.body;
    this.sendResponse(response);
  }

  protected override async evaluateRequest(
    response: DebugProtocol.EvaluateResponse,
    args: DebugProtocol.EvaluateArguments,
  ): Promise<void> {
    if (!this.backend) {
      this.sendErrorResponse(response, 1, "Not connected");
      return;
    }
    const res = await this.backend.request<DebugProtocol.EvaluateResponse>(
      "evaluate",
      args as unknown as Record<string, unknown>,
    );
    response.body = res.body;
    this.sendResponse(response);
  }

  protected override disconnectRequest(
    response: DebugProtocol.DisconnectResponse,
    _args: DebugProtocol.DisconnectArguments,
  ): void {
    this.backend?.dispose();
    this.backend = null;
    this.sendResponse(response);
    this.sendEvent(new TerminatedEvent());
  }
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  DebugSession.run(SoniteDebugSession);
}
