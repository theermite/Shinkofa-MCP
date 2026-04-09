import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeClient, YouTubeError } from "../src/lib/client.js";
import { registerCommentTools } from "../src/tools/comments.js";

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

  registerCommentTools(server, client);
});

describe("Comment tools — callbacks", () => {
  it("should_list_comments", async () => {
    const cb = registeredTools.get("list_comments")!;
    await cb({ part: "snippet", parentId: "c1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/comments", undefined, { part: "snippet", parentId: "c1" });
  });

  it("should_reply_to_comment_with_default_part", async () => {
    const cb = registeredTools.get("reply_to_comment")!;
    await cb({ parentId: "c1", textOriginal: "Nice!" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/comments", { snippet: { parentId: "c1", textOriginal: "Nice!" } }, { part: "snippet" });
  });

  it("should_update_comment_with_default_part", async () => {
    const cb = registeredTools.get("update_comment")!;
    await cb({ id: "c1", textOriginal: "Updated text" });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/comments", { id: "c1", snippet: { textOriginal: "Updated text" } }, { part: "snippet" });
  });

  it("should_delete_comment", async () => {
    const cb = registeredTools.get("delete_comment")!;
    await cb({ id: "c1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/comments", undefined, { id: "c1" });
  });

  it("should_set_comment_moderation", async () => {
    const cb = registeredTools.get("set_comment_moderation")!;
    await cb({ id: "c1,c2", moderationStatus: "published" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/comments/setModerationStatus", undefined, { id: "c1,c2", moderationStatus: "published" });
  });

  it("should_list_comment_threads", async () => {
    const cb = registeredTools.get("list_comment_threads")!;
    await cb({ part: "snippet", videoId: "v1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/commentThreads", undefined, { part: "snippet", videoId: "v1" });
  });

  it("should_post_comment_thread_with_videoId", async () => {
    const cb = registeredTools.get("post_comment_thread")!;
    await cb({ videoId: "v1", textOriginal: "Great video!" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/commentThreads", { snippet: { textOriginal: "Great video!", videoId: "v1" } }, { part: "snippet" });
  });

  it("should_post_comment_thread_with_channelId", async () => {
    const cb = registeredTools.get("post_comment_thread")!;
    await cb({ channelId: "ch1", textOriginal: "Nice channel!" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/commentThreads", { snippet: { textOriginal: "Nice channel!", channelId: "ch1" } }, { part: "snippet" });
  });
});

describe("Comment tools — error handling", () => {
  it("should_return_toolError_on_YouTubeError", async () => {
    callApiSpy.mockRejectedValueOnce(new YouTubeError(400, "Bad Request"));
    const cb = registeredTools.get("list_comments")!;
    const result = await cb({ part: "snippet" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("400");
  });

  it("should_return_toolError_on_SyntaxError", async () => {
    callApiSpy.mockRejectedValueOnce(new SyntaxError("Unexpected token"));
    const cb = registeredTools.get("reply_to_comment")!;
    const result = await cb({ parentId: "c1", textOriginal: "Hi" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("non-JSON");
  });

  it("should_rethrow_unknown_errors", async () => {
    callApiSpy.mockRejectedValueOnce(new RangeError("out of range"));
    const cb = registeredTools.get("delete_comment")!;
    await expect(cb({ id: "c1" })).rejects.toThrow("out of range");
  });
});
