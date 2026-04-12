import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinkedInClient, LinkedInError } from "../src/lib/client.js";
import { registerPostTools } from "../src/tools/posts.js";

let server: McpServer;
let client: LinkedInClient;
let getSpy: ReturnType<typeof vi.spyOn>;
let postSpy: ReturnType<typeof vi.spyOn>;
let delSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new LinkedInClient({ accessToken: "test" });
  getSpy = vi.spyOn(client, "get").mockResolvedValue({});
  postSpy = vi.spyOn(client, "post").mockResolvedValue({});
  delSpy = vi.spyOn(client, "del").mockResolvedValue(undefined);
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(
      args[0] as string,
      args[args.length - 1] as (...a: unknown[]) => unknown,
    );
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerPostTools(server, client);
});

describe("Post tools — registration", () => {
  it("should_register_all_5_post_tools", () => {
    const expected = [
      "create_text_post",
      "create_article_post",
      "initialize_image_upload",
      "create_image_post",
      "delete_post",
    ];
    for (const name of expected) {
      expect(registeredTools.has(name)).toBe(true);
    }
  });
});

describe("Post tools — calls", () => {
  it("should_create_text_post", async () => {
    const cb = registeredTools.get("create_text_post")!;
    await cb({
      author: "urn:li:person:abc",
      commentary: "Hello!",
      visibility: "PUBLIC",
    });
    expect(postSpy).toHaveBeenCalledWith(
      "/rest/posts",
      expect.objectContaining({
        author: "urn:li:person:abc",
        commentary: "Hello!",
        visibility: "PUBLIC",
        lifecycleState: "PUBLISHED",
      }),
    );
  });

  it("should_create_article_post_with_content", async () => {
    const cb = registeredTools.get("create_article_post")!;
    await cb({
      author: "urn:li:person:abc",
      commentary: "Check this out",
      articleUrl: "https://blog.test.com/post",
      articleTitle: "My Post",
      visibility: "PUBLIC",
    });
    const call = postSpy.mock.calls[0]!;
    const body = call[1] as Record<string, unknown>;
    expect(body).toHaveProperty("content.article.source", "https://blog.test.com/post");
    expect(body).toHaveProperty("content.article.title", "My Post");
  });

  it("should_initialize_image_upload", async () => {
    const cb = registeredTools.get("initialize_image_upload")!;
    await cb({ owner: "urn:li:person:abc" });
    expect(postSpy).toHaveBeenCalledWith(
      "/rest/images?action=initializeUpload",
      { initializeUploadRequest: { owner: "urn:li:person:abc" } },
    );
  });

  it("should_create_image_post_with_alt_text", async () => {
    const cb = registeredTools.get("create_image_post")!;
    await cb({
      author: "urn:li:person:abc",
      commentary: "Photo",
      imageUrn: "urn:li:image:123",
      altText: "A nice photo",
      visibility: "PUBLIC",
    });
    const call = postSpy.mock.calls[0]!;
    const body = call[1] as Record<string, unknown>;
    expect(body).toHaveProperty("content.media.id", "urn:li:image:123");
    expect(body).toHaveProperty("content.media.altText", "A nice photo");
  });

  it("should_delete_post_with_encoded_urn", async () => {
    const cb = registeredTools.get("delete_post")!;
    await cb({ postUrn: "urn:li:share:123456" });
    expect(delSpy).toHaveBeenCalledWith(
      `/rest/posts/${encodeURIComponent("urn:li:share:123456")}`,
    );
  });
});

describe("Post tools — error handling", () => {
  it("should_handle_LinkedInError", async () => {
    postSpy.mockRejectedValue(new LinkedInError(401, "Unauthorized"));
    const cb = registeredTools.get("create_text_post")!;
    const result = (await cb({
      author: "urn:li:person:abc",
      commentary: "test",
      visibility: "PUBLIC",
    })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unauthorized");
  });
});
