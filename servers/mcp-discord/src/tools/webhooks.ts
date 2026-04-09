/**
 * Webhook tools — create, get, modify, delete, execute, message management.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import {
  CreateWebhookSchema, GetWebhookSchema, GetChannelWebhooksSchema,
  GetGuildWebhooksSchema, ModifyWebhookSchema, DeleteWebhookSchema,
  ExecuteWebhookSchema, GetWebhookMessageSchema, EditWebhookMessageSchema,
  DeleteWebhookMessageSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerWebhookTools(server: McpServer, client: DiscordClient): void {
  server.tool("create_webhook", "Create a webhook for a channel", CreateWebhookSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { channel_id, reason, ...body } = p;
      return toolResult(await client.callApi("POST", `/channels/${channel_id}/webhooks`, body, undefined, reason));
    })
  );

  server.tool("get_webhook", "Get a webhook by ID", GetWebhookSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/webhooks/${p.webhook_id}`)))
  );

  server.tool("get_channel_webhooks", "List webhooks for a channel", GetChannelWebhooksSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/channels/${p.channel_id}/webhooks`)))
  );

  server.tool("get_guild_webhooks", "List all webhooks in a guild", GetGuildWebhooksSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/webhooks`)))
  );

  server.tool("modify_webhook", "Modify a webhook", ModifyWebhookSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { webhook_id, reason, ...body } = p;
      return toolResult(await client.callApi("PATCH", `/webhooks/${webhook_id}`, body, undefined, reason));
    })
  );

  server.tool("delete_webhook", "Delete a webhook", DeleteWebhookSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("DELETE", `/webhooks/${p.webhook_id}`, undefined, undefined, p.reason)))
  );

  server.tool("execute_webhook", "Execute a webhook (send a message)", ExecuteWebhookSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { webhook_id, webhook_token, wait, thread_id, ...body } = p;
      const query: Record<string, string | number | boolean | undefined> = {};
      if (wait !== undefined) query.wait = wait;
      if (thread_id) query.thread_id = thread_id;
      return toolResult(await client.callApi("POST", `/webhooks/${webhook_id}/${webhook_token}`, body, query));
    })
  );

  server.tool("get_webhook_message", "Get a message sent by a webhook", GetWebhookMessageSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const query: Record<string, string | number | boolean | undefined> = {};
      if (p.thread_id) query.thread_id = p.thread_id;
      return toolResult(await client.callApi("GET", `/webhooks/${p.webhook_id}/${p.webhook_token}/messages/${p.message_id}`, undefined, query));
    })
  );

  server.tool("edit_webhook_message", "Edit a message sent by a webhook", EditWebhookMessageSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { webhook_id, webhook_token, message_id, thread_id, ...body } = p;
      const query: Record<string, string | number | boolean | undefined> = {};
      if (thread_id) query.thread_id = thread_id;
      return toolResult(await client.callApi("PATCH", `/webhooks/${webhook_id}/${webhook_token}/messages/${message_id}`, body, query));
    })
  );

  server.tool("delete_webhook_message", "Delete a message sent by a webhook", DeleteWebhookMessageSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const query: Record<string, string | number | boolean | undefined> = {};
      if (p.thread_id) query.thread_id = p.thread_id;
      return toolResult(await client.callApi("DELETE", `/webhooks/${p.webhook_id}/${p.webhook_token}/messages/${p.message_id}`, undefined, query));
    })
  );
}
