import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DevtoClient } from "../src/lib/client.js";
import { registerCommunityTools } from "../src/tools/community.js";

let server: McpServer;
let client: DevtoClient;
let getSpy: ReturnType<typeof vi.spyOn>;
let postSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new DevtoClient({ apiKey: "test-key" });
  getSpy = vi.spyOn(client, "get").mockResolvedValue([]);
  postSpy = vi.spyOn(client, "post").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(
      args[0] as string,
      args[args.length - 1] as (...a: unknown[]) => unknown,
    );
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerCommunityTools(server, client);
});

describe("Community tools — registration", () => {
  it("should_register_all_9_community_tools", () => {
    const expected = [
      "list_comments",
      "get_comment",
      "get_me",
      "get_user",
      "list_tags",
      "list_followed_tags",
      "list_followers",
      "list_reading_list",
      "toggle_reaction",
    ];
    for (const name of expected) {
      expect(registeredTools.has(name)).toBe(true);
    }
  });
});

describe("Community tools — calls", () => {
  it("should_list_comments_for_article", async () => {
    const cb = registeredTools.get("list_comments")!;
    await cb({ a_id: 42 });
    expect(getSpy).toHaveBeenCalledWith("/api/comments?a_id=42");
  });

  it("should_get_comment_by_id", async () => {
    const cb = registeredTools.get("get_comment")!;
    await cb({ id: "abc123" });
    expect(getSpy).toHaveBeenCalledWith("/api/comments/abc123");
  });

  it("should_get_me", async () => {
    const cb = registeredTools.get("get_me")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/api/users/me");
  });

  it("should_get_user", async () => {
    const cb = registeredTools.get("get_user")!;
    await cb({ id: 1 });
    expect(getSpy).toHaveBeenCalledWith("/api/users/1");
  });

  it("should_list_tags", async () => {
    const cb = registeredTools.get("list_tags")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/api/tags");
  });

  it("should_list_tags_with_pagination", async () => {
    const cb = registeredTools.get("list_tags")!;
    await cb({ page: 2, per_page: 10 });
    expect(getSpy).toHaveBeenCalledWith("/api/tags?page=2&per_page=10");
  });

  it("should_list_followed_tags", async () => {
    const cb = registeredTools.get("list_followed_tags")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/api/follows/tags");
  });

  it("should_list_followers", async () => {
    const cb = registeredTools.get("list_followers")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/api/followers/users");
  });

  it("should_list_reading_list", async () => {
    const cb = registeredTools.get("list_reading_list")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/api/readinglist");
  });

  it("should_toggle_reaction", async () => {
    const cb = registeredTools.get("toggle_reaction")!;
    await cb({
      reactable_id: 1,
      reactable_type: "Article",
      category: "like",
    });
    expect(postSpy).toHaveBeenCalledWith("/api/reactions/toggle", {
      reactable_id: 1,
      reactable_type: "Article",
      category: "like",
    });
  });
});
