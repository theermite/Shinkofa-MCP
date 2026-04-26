import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { YouTubeClient, YouTubeError } from "../src/lib/client.js";
import { registerSearchTools } from "../src/tools/search.js";

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

  registerSearchTools(server, client);
});

describe("Search tools — callbacks", () => {
  it("should_search_youtube", async () => {
    const cb = registeredTools.get("search_youtube")!;
    await cb({ part: "snippet", q: "typescript", type: "video", maxResults: 10 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/search", undefined, {
      part: "snippet",
      q: "typescript",
      type: "video",
      maxResults: 10,
    });
  });

  it("should_list_captions", async () => {
    const cb = registeredTools.get("list_captions")!;
    await cb({ part: "snippet", videoId: "v1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/captions", undefined, { part: "snippet", videoId: "v1" });
  });

  it("should_delete_caption", async () => {
    const cb = registeredTools.get("delete_caption")!;
    await cb({ id: "cap1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/captions", undefined, { id: "cap1" });
  });

  it("should_list_subscriptions", async () => {
    const cb = registeredTools.get("list_subscriptions")!;
    await cb({ part: "snippet", mine: true });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/subscriptions", undefined, { part: "snippet", mine: true });
  });

  it("should_subscribe_with_default_part", async () => {
    const cb = registeredTools.get("subscribe")!;
    await cb({ channelId: "UC123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/subscriptions",
      { snippet: { resourceId: { kind: "youtube#channel", channelId: "UC123" } } },
      { part: "snippet" },
    );
  });

  it("should_unsubscribe", async () => {
    const cb = registeredTools.get("unsubscribe")!;
    await cb({ id: "sub1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/subscriptions", undefined, { id: "sub1" });
  });
});

describe("Search tools — error handling", () => {
  it("should_return_toolError_on_YouTubeError", async () => {
    callApiSpy.mockRejectedValueOnce(new YouTubeError(403, "quotaExceeded"));
    const cb = registeredTools.get("search_youtube")!;
    const result = await cb({ part: "snippet", q: "test" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("quotaExceeded");
  });

  it("should_return_toolError_on_AbortError", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    callApiSpy.mockRejectedValueOnce(err);
    const cb = registeredTools.get("list_captions")!;
    const result = await cb({ part: "snippet", videoId: "v1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Request timed out");
  });

  it("should_rethrow_unknown_errors", async () => {
    callApiSpy.mockRejectedValueOnce(false);
    const cb = registeredTools.get("subscribe")!;
    await expect(cb({ channelId: "UC123" })).rejects.toBe(false);
  });
});
