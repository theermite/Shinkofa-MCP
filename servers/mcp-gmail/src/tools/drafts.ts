import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GmailClient } from "../lib/client.js";
import { ListDraftsSchema, GetDraftSchema, CreateDraftSchema, UpdateDraftSchema, DeleteDraftSchema, SendDraftSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

function buildRawEmail(p: { to: string; subject: string; body: string; cc?: string; bcc?: string; replyTo?: string; inReplyTo?: string; references?: string; isHtml?: boolean }): string {
  const lines: string[] = [`To: ${p.to}`];
  if (p.cc) lines.push(`Cc: ${p.cc}`);
  if (p.bcc) lines.push(`Bcc: ${p.bcc}`);
  lines.push(`Subject: ${p.subject}`);
  if (p.replyTo) lines.push(`Reply-To: ${p.replyTo}`);
  if (p.inReplyTo) lines.push(`In-Reply-To: ${p.inReplyTo}`);
  if (p.references) lines.push(`References: ${p.references}`);
  lines.push(`Content-Type: ${p.isHtml ? "text/html" : "text/plain"}; charset=utf-8`, "MIME-Version: 1.0", "", p.body);
  return btoa(unescape(encodeURIComponent(lines.join("\r\n")))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function registerDraftTools(server: McpServer, client: GmailClient): void {
  server.tool("list_drafts", "List Gmail drafts", ListDraftsSchema.shape, async (p) => {
    const { userId, ...query } = p;
    return toolResult(await client.callApi("GET", `/users/${userId}/drafts`, undefined, query as Record<string, string | number | boolean | undefined>));
  });

  server.tool("get_draft", "Get a draft by ID", GetDraftSchema.shape, async (p) => {
    const { userId, id, ...query } = p;
    return toolResult(await client.callApi("GET", `/users/${userId}/drafts/${id}`, undefined, query as Record<string, string | number | boolean | undefined>));
  });

  server.tool("create_draft", "Create an email draft", CreateDraftSchema.shape, async (p) => {
    const raw = buildRawEmail(p);
    const message: Record<string, unknown> = { raw };
    if (p.threadId) message.threadId = p.threadId;
    return toolResult(await client.callApi("POST", `/users/${p.userId}/drafts`, { message }));
  });

  server.tool("update_draft", "Update an existing draft", UpdateDraftSchema.shape, async (p) => {
    const raw = buildRawEmail(p);
    const message: Record<string, unknown> = { raw };
    if (p.threadId) message.threadId = p.threadId;
    return toolResult(await client.callApi("PUT", `/users/${p.userId}/drafts/${p.id}`, { message } as Record<string, unknown>));
  });

  server.tool("delete_draft", "Delete a draft", DeleteDraftSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/users/${p.userId}/drafts/${p.id}`));
  });

  server.tool("send_draft", "Send an existing draft", SendDraftSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/users/${p.userId}/drafts/send`, { id: p.id }));
  });
}
