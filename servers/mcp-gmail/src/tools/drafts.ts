import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GmailClient } from "../lib/client.js";
import { ListDraftsSchema, GetDraftSchema, CreateDraftSchema, UpdateDraftSchema, DeleteDraftSchema, SendDraftSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler, buildRawEmail } from "../lib/utils.js";

export function registerDraftTools(server: McpServer, client: GmailClient): void {
  server.tool("list_drafts", "List Gmail drafts", ListDraftsSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const { userId, ...query } = p;
      return toolResult(await client.callApi("GET", `/users/${userId}/drafts`, undefined, query as Record<string, string | number | boolean | undefined>));
    });
  });

  server.tool("get_draft", "Get a draft by ID", GetDraftSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const { userId, id, ...query } = p;
      return toolResult(await client.callApi("GET", `/users/${userId}/drafts/${id}`, undefined, query as Record<string, string | number | boolean | undefined>));
    });
  });

  server.tool("create_draft", "Create an email draft", CreateDraftSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const raw = buildRawEmail(p);
      const message: Record<string, unknown> = { raw };
      if (p.threadId) message.threadId = p.threadId;
      return toolResult(await client.callApi("POST", `/users/${p.userId}/drafts`, { message }));
    });
  });

  server.tool("update_draft", "Update an existing draft", UpdateDraftSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const raw = buildRawEmail(p);
      const message: Record<string, unknown> = { raw };
      if (p.threadId) message.threadId = p.threadId;
      return toolResult(await client.callApi("PUT", `/users/${p.userId}/drafts/${p.id}`, { message } as Record<string, unknown>));
    });
  });

  server.tool("delete_draft", "Delete a draft", DeleteDraftSchema.shape, async (p) => {
    return withErrorHandler(async () => toolResult(await client.callApi("DELETE", `/users/${p.userId}/drafts/${p.id}`)));
  });

  server.tool("send_draft", "Send an existing draft", SendDraftSchema.shape, async (p) => {
    return withErrorHandler(async () => toolResult(await client.callApi("POST", `/users/${p.userId}/drafts/send`, { id: p.id })));
  });
}
