import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HashnodeClient, HashnodeError } from "../src/lib/client.js";
import { registerPostTools } from "../src/tools/posts.js";

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

  registerPostTools(server, client);
});

describe("Post tools — registration", () => {
  it("should_register_all_6_post_tools", () => {
    const expected = ["get_post", "list_posts", "search_posts", "publish_post", "update_post", "remove_post"];
    for (const name of expected) {
      expect(registeredTools.has(name)).toBe(true);
    }
  });
});

describe("Post tools — calls", () => {
  it("should_get_post_with_host_and_slug", async () => {
    const cb = registeredTools.get("get_post")!;
    await cb({ host: "blog.test.com", slug: "my-post" });
    expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("publication(host: $host)"), {
      host: "blog.test.com",
      slug: "my-post",
    });
  });

  it("should_list_posts_with_default_first", async () => {
    const cb = registeredTools.get("list_posts")!;
    await cb({ host: "blog.test.com" });
    expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("posts(first: $first"), {
      host: "blog.test.com",
      first: 10,
      after: undefined,
    });
  });

  it("should_publish_post_with_cover_image", async () => {
    const cb = registeredTools.get("publish_post")!;
    await cb({
      publicationId: "pub1",
      title: "Test",
      contentMarkdown: "content",
      coverImageURL: "https://img.com/cover.png",
    });
    const vars = querySpy.mock.calls[0]?.[1] as { input: Record<string, unknown> };
    expect(vars.input.coverImageOptions).toEqual({
      coverImageURL: "https://img.com/cover.png",
    });
  });

  it("should_publish_post_with_tags_as_objects", async () => {
    const cb = registeredTools.get("publish_post")!;
    await cb({
      publicationId: "pub1",
      title: "Test",
      contentMarkdown: "c",
      tags: [{ name: "JS", slug: "javascript" }],
    });
    const vars = querySpy.mock.calls[0]?.[1] as { input: Record<string, unknown> };
    expect(vars.input.tags).toEqual([{ name: "JS", slug: "javascript" }]);
  });

  it("should_remove_post_by_id", async () => {
    const cb = registeredTools.get("remove_post")!;
    await cb({ id: "p123" });
    expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("removePost"), { id: "p123" });
  });
});

describe("Post tools — error handling", () => {
  it("should_handle_HashnodeError", async () => {
    querySpy.mockRejectedValue(new HashnodeError(400, "bad query"));
    const cb = registeredTools.get("get_post")!;
    const result = (await cb({ host: "x", slug: "y" })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("bad query");
  });
});
