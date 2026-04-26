import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GmailClient } from "../lib/client.js";
import {
  BatchDeleteMessagesSchema,
  BatchModifyMessagesSchema,
  DeleteMessageSchema,
  GetAttachmentSchema,
  GetMessageSchema,
  ListMessagesSchema,
  ModifyMessageSchema,
  SendMessageSchema,
  TrashMessageSchema,
  UntrashMessageSchema,
} from "../lib/schemas.js";
import { buildRawEmail, toolResult, withErrorHandler } from "../lib/utils.js";

export function registerMessageTools(server: McpServer, client: GmailClient): void {
  server.tool("list_messages", "List Gmail messages (search, filter by label)", ListMessagesSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const { userId, ...query } = p;
      return toolResult(
        await client.callApi(
          "GET",
          `/users/${userId}/messages`,
          undefined,
          query as Record<string, string | number | boolean | undefined>,
        ),
      );
    });
  });

  server.tool("get_message", "Get a Gmail message by ID", GetMessageSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const { userId, id, ...query } = p;
      return toolResult(
        await client.callApi(
          "GET",
          `/users/${userId}/messages/${id}`,
          undefined,
          query as Record<string, string | number | boolean | undefined>,
        ),
      );
    });
  });

  server.tool("send_message", "Send an email", SendMessageSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const raw = buildRawEmail(p);
      const body: Record<string, unknown> = { raw };
      if (p.threadId) body.threadId = p.threadId;
      return toolResult(await client.callApi("POST", `/users/${p.userId}/messages/send`, body));
    });
  });

  server.tool(
    "delete_message",
    "Permanently delete a message (bypasses Trash)",
    DeleteMessageSchema.shape,
    async (p) => {
      return withErrorHandler(async () =>
        toolResult(await client.callApi("DELETE", `/users/${p.userId}/messages/${p.id}`)),
      );
    },
  );

  server.tool("trash_message", "Move a message to Trash", TrashMessageSchema.shape, async (p) => {
    return withErrorHandler(async () =>
      toolResult(await client.callApi("POST", `/users/${p.userId}/messages/${p.id}/trash`)),
    );
  });

  server.tool("untrash_message", "Restore a message from Trash", UntrashMessageSchema.shape, async (p) => {
    return withErrorHandler(async () =>
      toolResult(await client.callApi("POST", `/users/${p.userId}/messages/${p.id}/untrash`)),
    );
  });

  server.tool("modify_message", "Add or remove labels on a message", ModifyMessageSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const { userId, id, ...body } = p;
      return toolResult(await client.callApi("POST", `/users/${userId}/messages/${id}/modify`, body));
    });
  });

  server.tool(
    "batch_modify_messages",
    "Add/remove labels on multiple messages (max 1000)",
    BatchModifyMessagesSchema.shape,
    async (p) => {
      return withErrorHandler(async () => {
        const { userId, ...body } = p;
        return toolResult(await client.callApi("POST", `/users/${userId}/messages/batchModify`, body));
      });
    },
  );

  server.tool(
    "batch_delete_messages",
    "Permanently delete multiple messages (max 1000)",
    BatchDeleteMessagesSchema.shape,
    async (p) => {
      return withErrorHandler(async () => {
        const { userId, ...body } = p;
        return toolResult(await client.callApi("POST", `/users/${userId}/messages/batchDelete`, body));
      });
    },
  );

  server.tool(
    "get_attachment",
    "Download a message attachment by ID. Returns base64-encoded data and size.",
    GetAttachmentSchema.shape,
    async (p) => {
      return withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            `/users/${p.userId}/messages/${encodeURIComponent(p.messageId)}/attachments/${encodeURIComponent(p.attachmentId)}`,
          ),
        ),
      );
    },
  );
}
