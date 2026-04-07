/**
 * Bot management tools — info, commands, webhook, payments.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TelegramClient } from "../lib/client.js";
import {
  SetMyCommandsSchema,
  SetWebhookSchema,
  SendInvoiceSchema,
} from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerBotTools(server: McpServer, client: TelegramClient): void {
  // ── Bot Info ──

  server.tool(
    "get_me",
    "Get basic information about the bot (test your token)",
    {},
    async () => {
      const result = await client.callApi("getMe");
      return toolResult(result);
    }
  );

  // ── Commands ──

  server.tool(
    "set_my_commands",
    "Set the bot's command list (shown in menu)",
    SetMyCommandsSchema.shape,
    async (params) => {
      const result = await client.callApi("setMyCommands", params);
      return toolResult(result);
    }
  );

  server.tool(
    "get_my_commands",
    "Get the current bot command list",
    {
      scope: { type: "object", additionalProperties: true, optional: true } as any,
      language_code: { type: "string", optional: true } as any,
    },
    async (params) => {
      const result = await client.callApi("getMyCommands", params);
      return toolResult(result);
    }
  );

  server.tool(
    "delete_my_commands",
    "Delete the bot's command list",
    {
      scope: { type: "object", additionalProperties: true, optional: true } as any,
      language_code: { type: "string", optional: true } as any,
    },
    async (params) => {
      const result = await client.callApi("deleteMyCommands", params);
      return toolResult(result);
    }
  );

  // ── Webhook ──

  server.tool(
    "set_webhook",
    "Set a webhook URL to receive incoming updates",
    SetWebhookSchema.shape,
    async (params) => {
      const result = await client.callApi("setWebhook", params);
      return toolResult(result);
    }
  );

  server.tool(
    "delete_webhook",
    "Remove the webhook integration",
    {
      drop_pending_updates: { type: "boolean", optional: true } as any,
    },
    async (params) => {
      const result = await client.callApi("deleteWebhook", params);
      return toolResult(result);
    }
  );

  server.tool(
    "get_webhook_info",
    "Get current webhook status and configuration",
    {},
    async () => {
      const result = await client.callApi("getWebhookInfo");
      return toolResult(result);
    }
  );

  // ── Updates (polling) ──

  server.tool(
    "get_updates",
    "Get incoming updates via long polling (for debugging)",
    {
      offset: { type: "number", optional: true } as any,
      limit: { type: "number", optional: true } as any,
      timeout: { type: "number", optional: true } as any,
      allowed_updates: { type: "array", items: { type: "string" }, optional: true } as any,
    },
    async (params) => {
      const result = await client.callApi("getUpdates", params);
      return toolResult(result);
    }
  );

  // ── Payments ──

  server.tool(
    "send_invoice",
    "Send an invoice for payment (fiat or Telegram Stars)",
    SendInvoiceSchema.shape,
    async (params) => {
      const result = await client.callApi("sendInvoice", params);
      return toolResult(result);
    }
  );

  server.tool(
    "get_star_transactions",
    "Get the bot's Telegram Stars transaction history",
    {
      offset: { type: "number", optional: true } as any,
      limit: { type: "number", optional: true } as any,
    },
    async (params) => {
      const result = await client.callApi("getStarTransactions", params);
      return toolResult(result);
    }
  );
}
