import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { YouTubeClient } from "../lib/client.js";
import {
  CommentsDeleteSchema,
  CommentsInsertSchema,
  CommentsListSchema,
  CommentsSetModerationStatusSchema,
  CommentsUpdateSchema,
  CommentThreadsInsertSchema,
  CommentThreadsListSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerCommentTools(server: McpServer, client: YouTubeClient): void {
  server.tool("list_comments", "List comment replies", CommentsListSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/comments",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );
  server.tool("reply_to_comment", "Reply to a comment", CommentsInsertSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { part, parentId, textOriginal } = p;
      return toolResult(
        await client.callApi("POST", "/comments", { snippet: { parentId, textOriginal } }, { part: part ?? "snippet" }),
      );
    }),
  );
  server.tool("update_comment", "Update a comment", CommentsUpdateSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { part, id, textOriginal } = p;
      return toolResult(
        await client.callApi("PUT", "/comments", { id, snippet: { textOriginal } }, { part: part ?? "snippet" }),
      );
    }),
  );
  server.tool("delete_comment", "Delete a comment", CommentsDeleteSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("DELETE", "/comments", undefined, { id: p.id }))),
  );
  server.tool(
    "set_comment_moderation",
    "Set moderation status on comments",
    CommentsSetModerationStatusSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "POST",
            "/comments/setModerationStatus",
            undefined,
            p as Record<string, string | number | boolean | string[] | undefined>,
          ),
        ),
      ),
  );
  server.tool(
    "list_comment_threads",
    "List top-level comment threads on a video/channel",
    CommentThreadsListSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            "/commentThreads",
            undefined,
            p as Record<string, string | number | boolean | string[] | undefined>,
          ),
        ),
      ),
  );
  server.tool("post_comment_thread", "Post a new top-level comment", CommentThreadsInsertSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { part, videoId, channelId, textOriginal } = p;
      const snippet: Record<string, unknown> = { textOriginal };
      if (videoId) snippet.videoId = videoId;
      if (channelId) snippet.channelId = channelId;
      return toolResult(await client.callApi("POST", "/commentThreads", { snippet }, { part: part ?? "snippet" }));
    }),
  );
}
