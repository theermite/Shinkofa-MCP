import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeClient, YouTubeError } from "../src/lib/client.js";
import { registerRawTool } from "../src/tools/raw.js";

let server: McpServer;
let client: YouTubeClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new YouTubeClient({ apiKey: "test_key" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerRawTool(server, client);
});

describe("Raw API call tool — callbacks", () => {
  it("should_make_GET_raw_call", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "GET", path: "/videoCategories", query: { part: "snippet", regionCode: "US" } });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/videoCategories", undefined, { part: "snippet", regionCode: "US" });
  });

  it("should_make_POST_raw_call_with_body", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "POST", path: "/activities", body: { snippet: { description: "test" } } });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/activities", { snippet: { description: "test" } }, undefined);
  });

  it("should_make_DELETE_raw_call", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "DELETE", path: "/channelSections", query: { id: "cs1" } });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/channelSections", undefined, { id: "cs1" });
  });

  it("should_handle_undefined_body_and_query", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "GET", path: "/i18nLanguages" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/i18nLanguages", undefined, undefined);
  });
});

describe("Raw API call tool — error handling", () => {
  it("should_return_toolError_on_YouTubeError", async () => {
    callApiSpy.mockRejectedValueOnce(new YouTubeError(404, "Not Found"));
    const cb = registeredTools.get("raw_api_call")!;
    const result = await cb({ method: "GET", path: "/unknown" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
  });

  it("should_return_toolError_on_AbortError", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    callApiSpy.mockRejectedValueOnce(err);
    const cb = registeredTools.get("raw_api_call")!;
    const result = await cb({ method: "GET", path: "/slow" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Request timed out");
  });

  it("should_rethrow_unknown_errors", async () => {
    callApiSpy.mockRejectedValueOnce(new RangeError("bad"));
    const cb = registeredTools.get("raw_api_call")!;
    await expect(cb({ method: "GET", path: "/x" })).rejects.toThrow("bad");
  });
});
