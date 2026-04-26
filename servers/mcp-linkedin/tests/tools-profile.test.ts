import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LinkedInClient } from "../src/lib/client.js";
import { registerProfileTools } from "../src/tools/profile.js";

let server: McpServer;
let client: LinkedInClient;
let getSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new LinkedInClient({ accessToken: "test" });
  getSpy = vi.spyOn(client, "get").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerProfileTools(server, client);
});

describe("Profile tools — registration", () => {
  it("should_register_get_me", () => {
    expect(registeredTools.has("get_me")).toBe(true);
  });
});

describe("Profile tools — calls", () => {
  it("should_call_userinfo_endpoint", async () => {
    const cb = registeredTools.get("get_me")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/v2/userinfo");
  });
});
