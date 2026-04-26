import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HashnodeClient } from "../src/lib/client.js";
import { registerCommunityTools } from "../src/tools/community.js";

let server: McpServer;
let client: HashnodeClient;
let querySpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new HashnodeClient({ pat: "test" });
  querySpy = vi.spyOn(client, "query").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerCommunityTools(server, client);
});

describe("Community tools — registration", () => {
  it("should_register_all_6_community_tools", () => {
    const expected = ["get_me", "get_publication", "add_comment", "like_post", "create_series", "add_post_to_series"];
    for (const name of expected) {
      expect(registeredTools.has(name)).toBe(true);
    }
  });
});

describe("Community tools — calls", () => {
  it("should_get_me", async () => {
    const cb = registeredTools.get("get_me")!;
    await cb({});
    expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("me"));
  });

  it("should_get_publication", async () => {
    const cb = registeredTools.get("get_publication")!;
    await cb({ host: "blog.test.com" });
    expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("publication(host: $host)"), {
      host: "blog.test.com",
    });
  });

  it("should_add_comment", async () => {
    const cb = registeredTools.get("add_comment")!;
    await cb({ postId: "p1", contentMarkdown: "Nice!" });
    expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("addComment"), {
      input: { postId: "p1", contentMarkdown: "Nice!" },
    });
  });

  it("should_like_post", async () => {
    const cb = registeredTools.get("like_post")!;
    await cb({ postId: "p1" });
    expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("likePost"), { input: { postId: "p1" } });
  });

  it("should_create_series", async () => {
    const cb = registeredTools.get("create_series")!;
    await cb({ publicationId: "pub1", name: "My Series", slug: "my-series" });
    expect(querySpy).toHaveBeenCalledWith(
      expect.stringContaining("createSeries"),
      expect.objectContaining({
        input: { publicationId: "pub1", name: "My Series", slug: "my-series" },
      }),
    );
  });

  it("should_add_post_to_series", async () => {
    const cb = registeredTools.get("add_post_to_series")!;
    await cb({ postId: "p1", seriesId: "s1" });
    expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("addPostToSeries"), {
      input: { postId: "p1", seriesId: "s1" },
    });
  });
});
