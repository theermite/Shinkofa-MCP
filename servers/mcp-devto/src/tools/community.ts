import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DevtoClient } from "../lib/client.js";
import {
  GetCommentSchema,
  GetUserSchema,
  ListCommentsSchema,
  ListTagsSchema,
  ToggleReactionSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

function buildQuery(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return "";
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
  return `?${qs}`;
}

export function registerCommunityTools(server: McpServer, client: DevtoClient): void {
  server.tool(
    "list_comments",
    "List comments for an article or podcast episode",
    ListCommentsSchema.innerType().shape,
    async (p) => withErrorHandler(async () => toolResult(await client.get(`/api/comments${buildQuery(p)}`))),
  );

  server.tool("get_comment", "Get a single comment by ID", GetCommentSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.get(`/api/comments/${p.id}`))),
  );

  server.tool("get_me", "Get the authenticated user profile", {}, async () =>
    withErrorHandler(async () => toolResult(await client.get("/api/users/me"))),
  );

  server.tool("get_user", "Get a user profile by ID", GetUserSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.get(`/api/users/${p.id}`))),
  );

  server.tool("list_tags", "List available tags", ListTagsSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.get(`/api/tags${buildQuery(p)}`))),
  );

  server.tool("list_followed_tags", "List tags followed by the authenticated user", {}, async () =>
    withErrorHandler(async () => toolResult(await client.get("/api/follows/tags"))),
  );

  server.tool("list_followers", "List followers of the authenticated user", {}, async () =>
    withErrorHandler(async () => toolResult(await client.get("/api/followers/users"))),
  );

  server.tool("list_reading_list", "List articles in the reading list", {}, async () =>
    withErrorHandler(async () => toolResult(await client.get("/api/readinglist"))),
  );

  server.tool(
    "toggle_reaction",
    "Toggle a reaction (like, unicorn, etc.) on an article or comment",
    ToggleReactionSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.post("/api/reactions/toggle", p))),
  );
}
