import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GmailClient } from "../lib/client.js";
import { ListMessagesSchema, GetMessageSchema, SendMessageSchema, DeleteMessageSchema, TrashMessageSchema, UntrashMessageSchema, ModifyMessageSchema, BatchModifyMessagesSchema, BatchDeleteMessagesSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

function buildRawEmail(p: { to: string; subject: string; body: string; cc?: string; bcc?: string; replyTo?: string; inReplyTo?: string; references?: string; isHtml?: boolean }): string {
  const lines: string[] = [];
  lines.push(`To: ${p.to}`);
  if (p.cc) lines.push(`Cc: ${p.cc}`);
  if (p.bcc) lines.push(`Bcc: ${p.bcc}`);
  lines.push(`Subject: ${p.subject}`);
  if (p.replyTo) lines.push(`Reply-To: ${p.replyTo}`);
  if (p.inReplyTo) lines.push(`In-Reply-To: ${p.inReplyTo}`);
  if (p.references) lines.push(`References: ${p.references}`);
  lines.push(`Content-Type: ${p.isHtml ? "text/html" : "text/plain"}; charset=utf-8`);
  lines.push("MIME-Version: 1.0");
  lines.push("");
  lines.push(p.body);
  return btoa(unescape(encodeURIComponent(lines.join("\r\n")))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function registerMessageTools(server: McpServer, client: GmailClient): void {
  server.tool("list_messages", "List Gmail messages (search, filter by label)", ListMessagesSchema.shape, async (p) => {
    const { userId, ...query } = p;
    return toolResult(await client.callApi("GET", `/users/${userId}/messages`, undefined, query as Record<string, string | number | boolean | undefined>));
  });

  server.tool("get_message", "Get a Gmail message by ID", GetMessageSchema.shape, async (p) => {
    const { userId, id, ...query } = p;
    return toolResult(await client.callApi("GET", `/users/${userId}/messages/${id}`, undefined, query as Record<string, string | number | boolean | undefined>));
  });

  server.tool("send_message", "Send an email", SendMessageSchema.shape, async (p) => {
    const raw = buildRawEmail(p);
    const body: Record<string, unknown> = { raw };
    if (p.threadId) body.threadId = p.threadId;
    return toolResult(await client.callApi("POST", `/users/${p.userId}/messages/send`, body));
  });

  server.tool("delete_message", "Permanently delete a message (bypasses Trash)", DeleteMessageSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/users/${p.userId}/messages/${p.id}`));
  });

  server.tool("trash_message", "Move a message to Trash", TrashMessageSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/users/${p.userId}/messages/${p.id}/trash`));
  });

  server.tool("untrash_message", "Restore a message from Trash", UntrashMessageSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/users/${p.userId}/messages/${p.id}/untrash`));
  });

  server.tool("modify_message", "Add or remove labels on a message", ModifyMessageSchema.shape, async (p) => {
    const { userId, id, ...body } = p;
    return toolResult(await client.callApi("POST", `/users/${userId}/messages/${id}/modify`, body));
  });

  server.tool("batch_modify_messages", "Add/remove labels on multiple messages (max 1000)", BatchModifyMessagesSchema.shape, async (p) => {
    const { userId, ...body } = p;
    return toolResult(await client.callApi("POST", `/users/${userId}/messages/batchModify`, body));
  });

  server.tool("batch_delete_messages", "Permanently delete multiple messages (max 1000)", BatchDeleteMessagesSchema.shape, async (p) => {
    const { userId, ...body } = p;
    return toolResult(await client.callApi("POST", `/users/${userId}/messages/batchDelete`, body));
  });
}
