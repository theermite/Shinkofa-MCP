import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GmailClient } from "../lib/client.js";
import { ListThreadsSchema, GetThreadSchema, ModifyThreadSchema, TrashThreadSchema, UntrashThreadSchema, DeleteThreadSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerThreadTools(server: McpServer, client: GmailClient): void {
  server.tool("list_threads", "List Gmail threads (conversations)", ListThreadsSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const { userId, ...query } = p;
      return toolResult(await client.callApi("GET", `/users/${userId}/threads`, undefined, query as Record<string, string | number | boolean | undefined>));
    });
  });

  server.tool("get_thread", "Get a thread by ID (with all messages)", GetThreadSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const { userId, id, ...query } = p;
      return toolResult(await client.callApi("GET", `/users/${userId}/threads/${id}`, undefined, query as Record<string, string | number | boolean | undefined>));
    });
  });

  server.tool("modify_thread", "Add/remove labels on an entire thread", ModifyThreadSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const { userId, id, ...body } = p;
      return toolResult(await client.callApi("POST", `/users/${userId}/threads/${id}/modify`, body));
    });
  });

  server.tool("trash_thread", "Move a thread to Trash", TrashThreadSchema.shape, async (p) => {
    return withErrorHandler(async () => toolResult(await client.callApi("POST", `/users/${p.userId}/threads/${p.id}/trash`)));
  });

  server.tool("untrash_thread", "Restore a thread from Trash", UntrashThreadSchema.shape, async (p) => {
    return withErrorHandler(async () => toolResult(await client.callApi("POST", `/users/${p.userId}/threads/${p.id}/untrash`)));
  });

  server.tool("delete_thread", "Permanently delete a thread", DeleteThreadSchema.shape, async (p) => {
    return withErrorHandler(async () => toolResult(await client.callApi("DELETE", `/users/${p.userId}/threads/${p.id}`)));
  });
}
