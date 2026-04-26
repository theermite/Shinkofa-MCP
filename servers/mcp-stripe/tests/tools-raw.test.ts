import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StripeClient, StripeError } from "../src/lib/client.js";
import { registerRawTool } from "../src/tools/raw.js";

let server: McpServer;
let client: StripeClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new StripeClient({ secretKey: "sk_test_123" });
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
  it("should_call_GET_endpoint", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "GET", path: "/tax/settings" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/tax/settings", undefined);
  });

  it("should_call_POST_with_params", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({
      method: "POST",
      path: "/tax/calculations",
      params: { currency: "eur" },
    });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/tax/calculations", { currency: "eur" });
  });

  it("should_call_DELETE_endpoint", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "DELETE", path: "/files/file_123" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/files/file_123", undefined);
  });

  it("should_handle_StripeError_gracefully", async () => {
    callApiSpy.mockRejectedValue(new StripeError(404, "invalid_request_error", undefined, "Not found"));
    const cb = registeredTools.get("raw_api_call")!;
    const result = await cb({ method: "GET", path: "/unknown" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
  });

  it("should_handle_timeout_gracefully", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    callApiSpy.mockRejectedValue(err);
    const cb = registeredTools.get("raw_api_call")!;
    const result = await cb({ method: "GET", path: "/slow" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Request timed out");
  });

  it("should_handle_network_error_gracefully", async () => {
    callApiSpy.mockRejectedValue(new TypeError("fetch failed"));
    const cb = registeredTools.get("raw_api_call")!;
    const result = await cb({ method: "GET", path: "/down" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });

  it("should_pass_undefined_when_no_params", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "GET", path: "/balance" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/balance", undefined);
  });
});
