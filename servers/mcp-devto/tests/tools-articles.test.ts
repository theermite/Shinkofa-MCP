import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DevtoClient, DevtoError } from "../src/lib/client.js";
import { registerArticleTools } from "../src/tools/articles.js";

let server: McpServer;
let client: DevtoClient;
let getSpy: ReturnType<typeof vi.spyOn>;
let postSpy: ReturnType<typeof vi.spyOn>;
let putSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new DevtoClient({ apiKey: "test-key" });
  getSpy = vi.spyOn(client, "get").mockResolvedValue([]);
  postSpy = vi.spyOn(client, "post").mockResolvedValue({});
  putSpy = vi.spyOn(client, "put").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(
      args[0] as string,
      args[args.length - 1] as (...a: unknown[]) => unknown,
    );
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerArticleTools(server, client);
});

describe("Article tools — registration", () => {
  it("should_register_all_6_article_tools", () => {
    const expected = [
      "list_articles",
      "get_article",
      "get_article_by_path",
      "create_article",
      "update_article",
      "list_my_articles",
    ];
    for (const name of expected) {
      expect(registeredTools.has(name)).toBe(true);
    }
  });
});

describe("Article tools — calls", () => {
  it("should_list_articles_with_query", async () => {
    const cb = registeredTools.get("list_articles")!;
    await cb({ tag: "javascript", page: 2 });
    expect(getSpy).toHaveBeenCalledWith(
      "/api/articles?tag=javascript&page=2",
    );
  });

  it("should_list_articles_without_query", async () => {
    const cb = registeredTools.get("list_articles")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/api/articles");
  });

  it("should_get_article_by_id", async () => {
    const cb = registeredTools.get("get_article")!;
    await cb({ id: 42 });
    expect(getSpy).toHaveBeenCalledWith("/api/articles/42");
  });

  it("should_get_article_by_path", async () => {
    const cb = registeredTools.get("get_article_by_path")!;
    await cb({ username: "jay", slug: "my-post" });
    expect(getSpy).toHaveBeenCalledWith("/api/articles/jay/my-post");
  });

  it("should_create_article_wrapped", async () => {
    const cb = registeredTools.get("create_article")!;
    await cb({ title: "Test", body_markdown: "content" });
    expect(postSpy).toHaveBeenCalledWith("/api/articles", {
      article: { title: "Test", body_markdown: "content" },
    });
  });

  it("should_update_article_with_id_extracted", async () => {
    const cb = registeredTools.get("update_article")!;
    await cb({ id: 42, title: "Updated" });
    expect(putSpy).toHaveBeenCalledWith("/api/articles/42", {
      article: { title: "Updated" },
    });
  });

  it("should_list_my_published_articles", async () => {
    const cb = registeredTools.get("list_my_articles")!;
    await cb({ status: "published" });
    expect(getSpy).toHaveBeenCalledWith("/api/articles/me/published");
  });

  it("should_list_my_drafts", async () => {
    const cb = registeredTools.get("list_my_articles")!;
    await cb({ status: "unpublished" });
    expect(getSpy).toHaveBeenCalledWith("/api/articles/me/unpublished");
  });

  it("should_list_all_my_articles_by_default", async () => {
    const cb = registeredTools.get("list_my_articles")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/api/articles/me/all");
  });
});

describe("Article tools — error handling", () => {
  it("should_handle_DevtoError", async () => {
    getSpy.mockRejectedValue(new DevtoError(404, "not found"));
    const cb = registeredTools.get("get_article")!;
    const result = (await cb({ id: 99999 })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
  });
});
