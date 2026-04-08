import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeClient } from "../lib/client.js";
import { CommentsListSchema, CommentsInsertSchema, CommentsUpdateSchema, CommentsDeleteSchema, CommentsSetModerationStatusSchema, CommentThreadsListSchema, CommentThreadsInsertSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerCommentTools(server: McpServer, client: YouTubeClient): void {
  server.tool("list_comments", "List comment replies", CommentsListSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/comments", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("reply_to_comment", "Reply to a comment", CommentsInsertSchema.shape, async (p) => {
    const { part, parentId, textOriginal } = p;
    return toolResult(await client.callApi("POST", "/comments", { snippet: { parentId, textOriginal } }, { part: part ?? "snippet" }));
  });
  server.tool("update_comment", "Update a comment", CommentsUpdateSchema.shape, async (p) => {
    const { part, id, textOriginal } = p;
    return toolResult(await client.callApi("PUT", "/comments", { id, snippet: { textOriginal } }, { part: part ?? "snippet" }));
  });
  server.tool("delete_comment", "Delete a comment", CommentsDeleteSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", "/comments", undefined, { id: p.id }));
  });
  server.tool("set_comment_moderation", "Set moderation status on comments", CommentsSetModerationStatusSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/comments/setModerationStatus", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("list_comment_threads", "List top-level comment threads on a video/channel", CommentThreadsListSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/commentThreads", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("post_comment_thread", "Post a new top-level comment", CommentThreadsInsertSchema.shape, async (p) => {
    const { part, videoId, channelId, textOriginal } = p;
    const snippet: Record<string, unknown> = { textOriginal };
    if (videoId) snippet.videoId = videoId;
    if (channelId) snippet.channelId = channelId;
    return toolResult(await client.callApi("POST", "/commentThreads", { snippet }, { part: part ?? "snippet" }));
  });
}
