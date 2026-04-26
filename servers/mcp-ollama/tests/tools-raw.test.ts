import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OllamaClient } from "../src/lib/client.js";
import { registerRawTools } from "../src/tools/raw.js";

let server: McpServer;
let client: OllamaClient;
let getSpy: ReturnType<typeof vi.spyOn>;
let postSpy: ReturnType<typeof vi.spyOn>;
let delSpy: ReturnType<typeof vi.spyOn>;
let headSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new OllamaClient();
  getSpy = vi.spyOn(client, "get").mockResolvedValue({});
  postSpy = vi.spyOn(client, "post").mockResolvedValue({});
  delSpy = vi.spyOn(client, "del").mockResolvedValue(undefined);
  headSpy = vi.spyOn(client, "head").mockResolvedValue({ exists: true, status: 200 });
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerRawTools(server, client);
});

describe("Raw tools", () => {
  it("should_register_get_version", () => {
    expect(registeredTools.has("get_version")).toBe(true);
  });

  it("should_register_raw_api_call", () => {
    expect(registeredTools.has("raw_api_call")).toBe(true);
  });

  it("should_get_version", async () => {
    const cb = registeredTools.get("get_version")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/api/version");
  });

  it("should_raw_get", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "GET", path: "/api/tags" });
    expect(getSpy).toHaveBeenCalledWith("/api/tags");
  });

  it("should_raw_post", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "POST", path: "/api/show", body: { model: "llama3" } });
    expect(postSpy).toHaveBeenCalledWith("/api/show", { model: "llama3" });
  });

  it("should_raw_delete", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "DELETE", path: "/api/delete", body: { model: "old" } });
    expect(delSpy).toHaveBeenCalledWith("/api/delete", { model: "old" });
  });

  it("should_raw_head", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "HEAD", path: "/api/blobs/sha256:abc" });
    expect(headSpy).toHaveBeenCalledWith("/api/blobs/sha256:abc");
  });
});
