import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DevtoClient } from "../src/lib/client.js";
import { registerRawTools } from "../src/tools/raw.js";

let server: McpServer;
let client: DevtoClient;
let getSpy: ReturnType<typeof vi.spyOn>;
let postSpy: ReturnType<typeof vi.spyOn>;
let putSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new DevtoClient({ apiKey: "test-key" });
  getSpy = vi.spyOn(client, "get").mockResolvedValue({});
  postSpy = vi.spyOn(client, "post").mockResolvedValue({});
  putSpy = vi.spyOn(client, "put").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerRawTools(server, client);
});

describe("Raw tools", () => {
  it("should_register_raw_api_call", () => {
    expect(registeredTools.has("raw_api_call")).toBe(true);
  });

  it("should_raw_get", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "GET", path: "/api/tags" });
    expect(getSpy).toHaveBeenCalledWith("/api/tags");
  });

  it("should_raw_post", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({
      method: "POST",
      path: "/api/articles",
      body: { article: { title: "Test" } },
    });
    expect(postSpy).toHaveBeenCalledWith("/api/articles", {
      article: { title: "Test" },
    });
  });

  it("should_raw_put", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({
      method: "PUT",
      path: "/api/articles/1",
      body: { article: { title: "Updated" } },
    });
    expect(putSpy).toHaveBeenCalledWith("/api/articles/1", {
      article: { title: "Updated" },
    });
  });
});
