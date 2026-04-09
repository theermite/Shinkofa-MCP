import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeClient, YouTubeError } from "../src/lib/client.js";
import { registerVideoTools } from "../src/tools/videos.js";

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

  registerVideoTools(server, client);
});

describe("Video tools — callbacks", () => {
  it("should_list_videos", async () => {
    const cb = registeredTools.get("list_videos")!;
    await cb({ part: "snippet", id: "abc" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/videos", undefined, { part: "snippet", id: "abc" });
  });

  it("should_update_video_with_default_part", async () => {
    const cb = registeredTools.get("update_video")!;
    await cb({ id: "vid1", snippet: { title: "New Title" } });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/videos", { id: "vid1", snippet: { title: "New Title" } }, { part: "snippet,status" });
  });

  it("should_update_video_with_custom_part", async () => {
    const cb = registeredTools.get("update_video")!;
    await cb({ id: "vid1", part: "snippet", snippet: { title: "T" } });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/videos", { id: "vid1", snippet: { title: "T" } }, { part: "snippet" });
  });

  it("should_delete_video", async () => {
    const cb = registeredTools.get("delete_video")!;
    await cb({ id: "vid1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/videos", undefined, { id: "vid1" });
  });

  it("should_rate_video", async () => {
    const cb = registeredTools.get("rate_video")!;
    await cb({ id: "vid1", rating: "like" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/videos/rate", undefined, { id: "vid1", rating: "like" });
  });

  it("should_get_video_rating", async () => {
    const cb = registeredTools.get("get_video_rating")!;
    await cb({ id: "vid1,vid2" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/videos/getRating", undefined, { id: "vid1,vid2" });
  });
});

describe("Video tools — error handling", () => {
  it("should_return_toolError_on_YouTubeError", async () => {
    callApiSpy.mockRejectedValueOnce(new YouTubeError(404, "Not Found"));
    const cb = registeredTools.get("list_videos")!;
    const result = await cb({ part: "snippet" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
  });

  it("should_return_toolError_on_AbortError", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    callApiSpy.mockRejectedValueOnce(err);
    const cb = registeredTools.get("list_videos")!;
    const result = await cb({ part: "snippet" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Request timed out");
  });

  it("should_rethrow_unknown_errors", async () => {
    callApiSpy.mockRejectedValueOnce("unknown");
    const cb = registeredTools.get("list_videos")!;
    await expect(cb({ part: "snippet" })).rejects.toBe("unknown");
  });
});
