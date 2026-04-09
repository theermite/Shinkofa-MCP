import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TelegramClient, TelegramError } from "../src/lib/client.js";
import { registerRawTool } from "../src/tools/raw.js";

let server: McpServer;
let client: TelegramClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new TelegramClient({ botToken: "123:ABC" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerRawTool(server, client);
});

describe("Raw API tool", () => {
  it("should_call_method", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "getMe" });
    expect(callApiSpy).toHaveBeenCalledWith("getMe", undefined);
  });

  it("should_call_method_with_params", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "sendMessage", params: { chat_id: 123, text: "Hi" } });
    expect(callApiSpy).toHaveBeenCalledWith("sendMessage", { chat_id: 123, text: "Hi" });
  });

  it("should_handle_TelegramError", async () => {
    callApiSpy.mockRejectedValue(new TelegramError(404, "Not Found"));
    const cb = registeredTools.get("raw_api_call")!;
    const result = await cb({ method: "unknown" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
  });

  it("should_handle_timeout", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    callApiSpy.mockRejectedValue(err);
    const cb = registeredTools.get("raw_api_call")!;
    const result = await cb({ method: "getMe" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Request timed out");
  });

  it("should_handle_network_error", async () => {
    callApiSpy.mockRejectedValue(new TypeError("fetch failed"));
    const cb = registeredTools.get("raw_api_call")!;
    const result = await cb({ method: "getMe" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });
});
