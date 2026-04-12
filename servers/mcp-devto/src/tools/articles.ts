import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DevtoClient } from "../lib/client.js";
import {
  ListArticlesSchema,
  GetArticleSchema,
  GetArticleByPathSchema,
  CreateArticleSchema,
  UpdateArticleSchema,
  ListMyArticlesSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

function buildQuery(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) return "";
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `?${qs}`;
}

export function registerArticleTools(
  server: McpServer,
  client: DevtoClient,
): void {
  server.tool(
    "list_articles",
    "List published articles with optional filters",
    ListArticlesSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(await client.get(`/api/articles${buildQuery(p)}`)),
      ),
  );

  server.tool(
    "get_article",
    "Get a single article by ID",
    GetArticleSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(await client.get(`/api/articles/${p.id}`)),
      ),
  );

  server.tool(
    "get_article_by_path",
    "Get an article by username and slug",
    GetArticleByPathSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.get(`/api/articles/${p.username}/${p.slug}`),
        ),
      ),
  );

  server.tool(
    "create_article",
    "Create a new article (draft by default)",
    CreateArticleSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.post("/api/articles", { article: p }),
        ),
      ),
  );

  server.tool(
    "update_article",
    "Update an existing article",
    UpdateArticleSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { id, ...fields } = p;
        return toolResult(
          await client.put(`/api/articles/${id}`, { article: fields }),
        );
      }),
  );

  server.tool(
    "list_my_articles",
    "List my articles (published, drafts, or all)",
    ListMyArticlesSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { status, ...pagination } = p;
        const suffix =
          status === "published"
            ? "/published"
            : status === "unpublished"
              ? "/unpublished"
              : "/all";
        return toolResult(
          await client.get(
            `/api/articles/me${suffix}${buildQuery(pagination)}`,
          ),
        );
      }),
  );
}
