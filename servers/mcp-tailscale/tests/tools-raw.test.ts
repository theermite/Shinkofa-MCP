import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TailscaleClient, TailscaleError } from "../src/lib/client.js";
import { registerRawTools } from "../src/tools/raw.js";

let server: McpServer;
let client: TailscaleClient;
let requestSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new TailscaleClient({ apiKey: "test" });
  requestSpy = vi.spyOn(client, "request").mockResolvedValue({ ok: true });
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerRawTools(server, client);
});

describe("Raw tool", () => {
  it("should_register_raw_api_call", () => {
    expect(registeredTools.has("raw_api_call")).toBe(true);
  });

  it("should_forward_method_path_body", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({
      method: "POST",
      path: "/api/v2/tailnet/-/keys",
      body: { reusable: true },
    });
    expect(requestSpy).toHaveBeenCalledWith("POST", "/api/v2/tailnet/-/keys", { reusable: true });
  });

  it("should_handle_error", async () => {
    requestSpy.mockRejectedValue(new TailscaleError(500, "Internal"));
    const cb = registeredTools.get("raw_api_call")!;
    const result = (await cb({
      method: "GET",
      path: "/api/v2/tailnet/-/devices",
    })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Internal");
  });
});
