import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LinkedInClient } from "../src/lib/client.js";
import { registerRawTools } from "../src/tools/raw.js";

let server: McpServer;
let client: LinkedInClient;
let getSpy: ReturnType<typeof vi.spyOn>;
let postSpy: ReturnType<typeof vi.spyOn>;
let delSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new LinkedInClient({ accessToken: "test" });
  getSpy = vi.spyOn(client, "get").mockResolvedValue({});
  postSpy = vi.spyOn(client, "post").mockResolvedValue({});
  delSpy = vi.spyOn(client, "del").mockResolvedValue(undefined);
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerRawTools(server, client);
});

describe("Raw tools — registration", () => {
  it("should_register_raw_api_call", () => {
    expect(registeredTools.has("raw_api_call")).toBe(true);
  });
});

describe("Raw tools — calls", () => {
  it("should_execute_get_request", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "GET", path: "/rest/posts" });
    expect(getSpy).toHaveBeenCalledWith("/rest/posts");
  });

  it("should_execute_post_request", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({
      method: "POST",
      path: "/rest/posts",
      body: { commentary: "test" },
    });
    expect(postSpy).toHaveBeenCalledWith("/rest/posts", { commentary: "test" });
  });

  it("should_execute_delete_request", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "DELETE", path: "/rest/posts/urn" });
    expect(delSpy).toHaveBeenCalledWith("/rest/posts/urn");
  });
});
