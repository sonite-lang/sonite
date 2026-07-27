import { createRequire } from "node:module";
import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

function resolveDebugAdapterMain(
  context: vscode.ExtensionContext,
): string | undefined {
  const bundled = context.asAbsolutePath(
    path.join("dist", "debug-adapter.js"),
  );
  if (fs.existsSync(bundled)) {
    return bundled;
  }
  try {
    const require = createRequire(context.extensionPath);
    return require.resolve("@sonite/debug-adapter/dist/main.js");
  } catch {
    const monorepo = path.join(
      context.extensionPath,
      "..",
      "debug-adapter",
      "dist",
      "main.js",
    );
    if (fs.existsSync(monorepo)) {
      return monorepo;
    }
  }
  return undefined;
}

export function registerSoniteDebugger(
  context: vscode.ExtensionContext,
): void {
  const factory = vscode.debug.registerDebugAdapterDescriptorFactory("sonite", {
    createDebugAdapterDescriptor(
      _session: vscode.DebugSession,
    ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
      const main = resolveDebugAdapterMain(context);
      if (!main) {
        void vscode.window.showErrorMessage(
          "Sonite debug adapter not found. Reinstall the extension or build @sonite/debug-adapter.",
        );
        return undefined;
      }
      return new vscode.DebugAdapterExecutable(process.execPath, [main]);
    },
  });
  context.subscriptions.push(factory);
}

export const launchConfiguration: vscode.DebugConfiguration = {
  type: "sonite",
  request: "launch",
  name: "Launch Sonite",
  program: "${workspaceFolder}/src/main.sn",
  cwd: "${workspaceFolder}",
  profile: "debug",
  buildBeforeLaunch: true,
};
