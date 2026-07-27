import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  registryFetch,
  registryJson,
  RegistryError,
} from "../../src/registry/client.js";
import {
  getPackage,
  searchPackages,
} from "../../src/registry/packages.js";

describe("registry HTTP client", () => {
  let server: Server;
  let baseUrl: string;
  const prevUrl = process.env.SN_REGISTRY_URL;

  beforeEach(async () => {
    server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", baseUrl);

      if (url.pathname === "/packages" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            packages: [
              {
                id: "1",
                name: "demo-lib",
                description: "A demo package",
                createdAt: "2026-01-01T00:00:00Z",
                owner: { id: "u1", username: "alice", avatarUrl: "" },
              },
            ],
            pagination: { limit: 20, offset: 0, total: 1 },
          }),
        );
        return;
      }

      if (url.pathname === "/packages/demo-lib" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            id: "1",
            name: "demo-lib",
            description: "A demo package",
            createdAt: "2026-01-01T00:00:00Z",
            owner: { id: "u1", username: "alice", avatarUrl: "" },
            latestVersion: {
              version: "1.0.0",
              metadata: {},
              checksumSha256: "abc",
              sizeBytes: 100,
              createdAt: "2026-01-01T00:00:00Z",
            },
          }),
        );
        return;
      }

      if (url.pathname === "/packages/missing" && req.method === "GET") {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "not_found", message: "package not found" }));
        return;
      }

      if (url.pathname === "/auth-required" && req.method === "GET") {
        const auth = req.headers.authorization;
        if (auth !== "Bearer test-token") {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "unauthorized", message: "invalid token" }));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const addr = server.address();
    if (!addr || typeof addr === "string") {
      throw new Error("failed to bind mock registry");
    }
    baseUrl = `http://127.0.0.1:${addr.port}`;
    process.env.SN_REGISTRY_URL = baseUrl;
  });

  afterEach(async () => {
    process.env.SN_REGISTRY_URL = prevUrl;
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("searchPackages returns results from mock registry", async () => {
    const result = await searchPackages("demo");
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]!.name).toBe("demo-lib");
  });

  it("getPackage returns package details", async () => {
    const pkg = await getPackage("demo-lib");
    expect(pkg.name).toBe("demo-lib");
    expect(pkg.latestVersion?.version).toBe("1.0.0");
  });

  it("registryJson throws RegistryError on 404", async () => {
    await expect(getPackage("missing")).rejects.toBeInstanceOf(RegistryError);
    await expect(getPackage("missing")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("registryFetch attaches Bearer token when auth required", async () => {
    process.env.SN_REGISTRY_TOKEN = "test-token";
    const data = await registryJson<{ ok: boolean }>("/auth-required", {
      auth: true,
    });
    expect(data.ok).toBe(true);
    delete process.env.SN_REGISTRY_TOKEN;
  });

  it("registryFetch rejects missing auth", async () => {
    delete process.env.SN_REGISTRY_TOKEN;
    await expect(
      registryJson("/auth-required", { auth: true }),
    ).rejects.toBeInstanceOf(RegistryError);
  });

  it("registryFetch returns raw response", async () => {
    const response = await registryFetch("/packages/demo-lib", { raw: true });
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
  });
});
